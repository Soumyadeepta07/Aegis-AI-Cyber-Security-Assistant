import { GoogleGenerativeAI } from '@google/generative-ai';
import dns from 'dns';
import tls from 'tls';
import http from 'http';
import https from 'https';

// Initialize Gemini API client if key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: any = null;

if (geminiApiKey) {
  try {
    aiClient = new GoogleGenerativeAI(geminiApiKey);
  } catch (e) {
    console.error("Failed to initialize Gemini AI client:", e);
  }
}

export interface SecurityFinding {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  owasp: string;
  mitigation: string;
  evidenceHeader: string;
  evidenceValue: string;
  evidenceReason: string;
  confidence: 'High Confidence' | 'Medium Confidence' | 'Low Confidence';
}

export interface ThreatAnalysisResult {
  source: 'real_api';
  status: 'safe' | 'suspicious' | 'dangerous';
  threatScore: number;
  securityScore: number;
  explanation: string;
  findings: SecurityFinding[];
  details: {
    virusTotal?: any;
    abuseIpDb?: any;
    safeBrowsing?: any;
    dnsRecords?: any;
    sslCertInfo?: {
      valid: boolean;
      issuer: string;
      validFrom?: string;
      validTo?: string;
      expired: boolean;
      selfSigned: boolean;
      wrongHost: boolean;
      error: string | null;
    };
    headers?: Record<string, string>;
    securityHeaders?: {
      hsts: boolean;
      csp: boolean;
      xFrame: boolean;
      xContentType: boolean;
      referrerPolicy: boolean;
    };
    isHttps?: boolean;
    redirectsToHttps?: boolean;
    redirectChain?: string[];
    statusCode?: number | null;
    fetchError?: string | null;
    ipResolved?: string | null;
    whois?: {
      registrar: string;
      createdDate: string;
      ageText: string;
    };
    unavailableApis: string[];
  };
}

// 1. Google Safe Browsing check
async function checkSafeBrowsing(url: string): Promise<{ isMalicious: boolean; threatType?: string } | null> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return null;

  try {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: "ai-cyber-security-assistant", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }]
        }
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (data.matches && data.matches.length > 0) {
      return { isMalicious: true, threatType: data.matches[0].threatType };
    }
    return { isMalicious: false };
  } catch (e) {
    console.error("Google Safe Browsing API error:", e);
    return null;
  }
}

// 2. VirusTotal URL scan check
async function checkVirusTotalUrl(url: string): Promise<{ score: number; positives: number; total: number; raw?: any } | null> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return null;

  try {
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
    const endpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`;
    
    const response = await fetch(endpoint, {
      headers: { 'x-apikey': apiKey }
    });

    if (!response.ok) {
      const scanEndpoint = 'https://www.virustotal.com/api/v3/urls';
      await fetch(scanEndpoint, {
        method: 'POST',
        headers: {
          'x-apikey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ url })
      });
      return { score: 0, positives: 0, total: 0 };
    }

    const data = await response.json();
    const stats = data?.data?.attributes?.last_analysis_stats;
    if (stats) {
      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      const total = Object.values(stats).reduce((a: any, b: any) => a + b, 0) as number;
      const score = Math.min(100, Math.round(((malicious * 1.0 + suspicious * 0.5) / (total || 1)) * 100));
      return { score, positives: malicious + suspicious, total, raw: data.data };
    }
    return { score: 0, positives: 0, total: 0 };
  } catch (e) {
    console.error("VirusTotal API error:", e);
    return null;
  }
}

// 3. AbuseIPDB check (takes an IP address)
async function checkAbuseIPDB(ip: string): Promise<{ abuseScore: number; reports: number; raw?: any } | null> {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) return null;

  try {
    const endpoint = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`;
    const response = await fetch(endpoint, {
      headers: { 
        'Key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;
    const data = await response.json();
    const score = data?.data?.abuseConfidenceScore || 0;
    const reports = data?.data?.totalReports || 0;
    return { abuseScore: score, reports, raw: data.data };
  } catch (e) {
    console.error("AbuseIPDB API error:", e);
    return null;
  }
}

// 4. Dynamic RDAP Whois lookup
async function getDomainWhois(domain: string): Promise<{ registrar: string; createdDate: string; ageText: string }> {
  try {
    const parts = domain.split('.');
    let apex = domain;
    if (parts.length > 2) {
      apex = parts.slice(-2).join('.');
    }
    
    const res = await fetch(`https://rdap.org/domain/${apex}`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      return { registrar: 'Unknown', createdDate: 'Unknown', ageText: 'Unknown' };
    }
    
    const data = await res.json();
    let registrar = 'Unknown';
    if (data.entities) {
      const registrarEntity = data.entities.find((e: any) => e.roles && e.roles.includes('registrar'));
      if (registrarEntity && registrarEntity.vcardArray && registrarEntity.vcardArray[1]) {
        const fnInfo = registrarEntity.vcardArray[1].find((item: any) => item[0] === 'fn');
        if (fnInfo) registrar = fnInfo[3];
      }
    }
    
    let createdDate = 'Unknown';
    if (data.events) {
      const registrationEvent = data.events.find((e: any) => e.eventAction === 'registration');
      if (registrationEvent) {
        createdDate = registrationEvent.eventDate;
      }
    }
    
    let ageText = 'Unknown';
    if (createdDate !== 'Unknown') {
      const created = new Date(createdDate);
      const diffMs = Date.now() - created.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 365) {
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        ageText = `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
      } else {
        const months = Math.floor(diffDays / 30);
        ageText = `${months} month${months > 1 ? 's' : ''}`;
      }
    }
    
    return { registrar, createdDate, ageText };
  } catch (e) {
    return { registrar: 'Unknown', createdDate: 'Unknown', ageText: 'Unknown' };
  }
}

// 5. Inspect SSL Socket Cert
function inspectSocketCert(socket: any, hostname: string) {
  let sslError: string | null = null;
  let isExpired = false;
  let isSelfSigned = false;
  let isWrongHost = false;
  let cert: any = null;

  if (socket && socket.getPeerCertificate) {
    cert = socket.getPeerCertificate(true);
    if (cert && Object.keys(cert).length > 0) {
      const authorized = socket.authorized;
      const authError = socket.authorizationError;
      
      // Expired check
      if (cert.valid_to) {
        isExpired = new Date(cert.valid_to) < new Date();
      }
      
      // Self-signed check
      if (authError === 'DEPTH_ZERO_SELF_SIGNED_CERT' || authError === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY') {
        isSelfSigned = true;
      } else if (cert.issuer && cert.subject) {
        const issuerCn = typeof cert.issuer === 'object' ? cert.issuer.CN : String(cert.issuer);
        const subjectCn = typeof cert.subject === 'object' ? cert.subject.CN : String(cert.subject);
        if (issuerCn === subjectCn && issuerCn) {
          isSelfSigned = true;
        }
      }
      
      // Hostname mismatch check
      try {
        const hostError = tls.checkServerIdentity(hostname, cert);
        if (hostError) {
          isWrongHost = true;
          if (!sslError) {
            sslError = hostError.message || 'Hostname mismatch';
          }
        }
      } catch (err: any) {
        isWrongHost = true;
        sslError = err.message || 'Hostname mismatch';
      }
      
      // General authorization error from TLS socket
      if (!authorized && authError && !sslError) {
        sslError = String(authError);
      }
      
      if (isExpired && !sslError) {
        sslError = 'Certificate has expired';
      }
    } else {
      sslError = 'No certificate returned';
    }
  } else {
    sslError = 'Not a secure connection socket';
  }

  return { cert, sslError, isExpired, isSelfSigned, isWrongHost };
}

// 6. Trace HTTP/HTTPS redirects and retrieve headers
async function traceTarget(targetUrl: string, maxRedirects = 5) {
  let currentUrl = targetUrl;
  const redirectChain: string[] = [];
  let redirectsToHttps = false;
  let headersObj: Record<string, string> = {};
  let finalCert: any = null;
  let finalSslError: string | null = null;
  let isExpired = false;
  let isSelfSigned = false;
  let isWrongHost = false;
  let statusCode = 0;
  let isHttps = currentUrl.toLowerCase().startsWith('https://');
  let fetchError: string | null = null;
  let rawCookies: string[] = [];

  for (let i = 0; i < maxRedirects; i++) {
    isHttps = currentUrl.toLowerCase().startsWith('https://');
    const parsed = new URL(currentUrl);
    const reqModule = isHttps ? https : http;
    
    const res: any = await new Promise((resolve) => {
      const req = reqModule.request({
        method: 'GET',
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        port: parsed.port || (isHttps ? 443 : 80),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Aegis/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        rejectUnauthorized: false, // Don't fail on SSL errors, let us inspect!
        timeout: 4000
      }, (r) => {
        resolve({ response: r });
      });

      req.on('error', (err) => {
        resolve({ error: err });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ timeout: true });
      });

      req.end();
    });

    if (res.timeout) {
      fetchError = 'Connection timed out';
      break;
    }

    if (res.error) {
      fetchError = res.error.message || 'Network error';
      break;
    }

    const response = res.response;
    statusCode = response.statusCode || 0;
    
    headersObj = {};
    Object.keys(response.headers).forEach((key) => {
      const val = response.headers[key];
      headersObj[key.toLowerCase()] = Array.isArray(val) ? val.join(', ') : val || '';
    });

    if (response.headers['set-cookie']) {
      rawCookies = Array.isArray(response.headers['set-cookie']) 
        ? response.headers['set-cookie'] 
        : [response.headers['set-cookie']];
      headersObj['set-cookie'] = rawCookies.join(', ');
    }

    if (isHttps) {
      const socketInspect = inspectSocketCert(response.socket, parsed.hostname);
      if (socketInspect.cert) finalCert = socketInspect.cert;
      if (socketInspect.sslError) finalSslError = socketInspect.sslError;
      if (socketInspect.isExpired) isExpired = true;
      if (socketInspect.isSelfSigned) isSelfSigned = true;
      if (socketInspect.isWrongHost) isWrongHost = true;
    }

    const isRedirect = statusCode >= 300 && statusCode < 400 && headersObj['location'];
    if (isRedirect) {
      const loc = headersObj['location'];
      let resolvedLoc = loc;
      try {
        resolvedLoc = new URL(loc, currentUrl).toString();
      } catch (e) {
        // ignore malformed location header
      }
      redirectChain.push(resolvedLoc);
      
      if (currentUrl.startsWith('http://') && resolvedLoc.startsWith('https://')) {
        redirectsToHttps = true;
      }
      currentUrl = resolvedLoc;
    } else {
      break;
    }
  }

  return {
    finalUrl: currentUrl,
    redirectChain,
    redirectsToHttps,
    headers: headersObj,
    cert: finalCert,
    sslError: finalSslError,
    isExpired,
    isSelfSigned,
    isWrongHost,
    statusCode,
    fetchError,
    rawCookies
  };
}

// 7. Resolve DNS records
async function resolveDns(domain: string) {
  const records: any = { A: [], AAAA: [], MX: [], NS: [], TXT: [] };
  const resolver = dns.promises;
  try { records.A = await resolver.resolve4(domain).catch(() => []); } catch (e) {}
  try { records.AAAA = await resolver.resolve6(domain).catch(() => []); } catch (e) {}
  try { 
    records.MX = (await resolver.resolveMx(domain).catch(() => []))
      .map((mx: any) => `${mx.priority} ${mx.exchange}`); 
  } catch (e) {}
  try { records.NS = await resolver.resolveNs(domain).catch(() => []); } catch (e) {}
  try { 
    records.TXT = (await resolver.resolveTxt(domain).catch(() => []))
      .map((txt: any) => txt.join(' ')); 
  } catch (e) {}
  return records;
}

// Helper to ask Gemini to explain a threat profile
async function getGeminiThreatExplanation(target: string, type: string, riskDetails: string): Promise<string> {
  if (!aiClient) return `Threat analysis for ${target} shows: ${riskDetails}`;

  try {
    const model = aiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a Senior Cyber Security Analyst. Provide a brief, professional threat analysis explanation (2-3 sentences max) for a scan of the following target:
Target: ${target}
Type: ${type}
Indicators found: ${riskDetails}
Make sure to explain why these indicators are risky, what mitigation action the user should take, and write in an authoritative, enterprise-ready tone. Never mention "simulated" or "mock" responses.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (e) {
    console.error("Gemini threat explanation query failed:", e);
    return `Threat analysis for ${target} shows: ${riskDetails}`;
  }
}

// Primary scanner function (Shared Analysis Engine)
export async function runThreatIntelligenceScan(
  target: string, 
  type: 'url' | 'domain' | 'file'
): Promise<ThreatAnalysisResult> {
  console.log(`[Unified Engine] Scanning ${target} (${type})...`);

  // Detect missing keys
  const unavailableApis: string[] = [];
  if (!process.env.GOOGLE_SAFE_BROWSING_API_KEY) unavailableApis.push('Google Safe Browsing');
  if (!process.env.VIRUSTOTAL_API_KEY) unavailableApis.push('VirusTotal');
  if (!process.env.ABUSEIPDB_API_KEY) unavailableApis.push('AbuseIPDB');

  let threatScore = 0;
  const findings: SecurityFinding[] = [];
  
  let targetUrl = target.trim();
  if (type === 'domain') {
    targetUrl = 'https://' + target;
  }

  // Parse hostname
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    if (type === 'url') throw new Error('Invalid URL format');
    // If domain mode and URL parser fails, fallback to clean hostname
    parsedUrl = new URL('https://' + target);
  }

  const hostname = parsedUrl.hostname;

  // 1. Run DNS Resolution & WHOIS RDAP
  const dnsRecords = await resolveDns(hostname);
  const whois = await getDomainWhois(hostname);
  
  let ipResolved: string | null = null;
  if (dnsRecords.A && dnsRecords.A.length > 0) {
    ipResolved = dnsRecords.A[0];
  }

  // 2. Run Redirect and Header Tracer
  const trace = await traceTarget(targetUrl);
  
  // 3. API Detections
  let safeBrowsingMatch = null;
  let virusTotalUrlResult = null;
  let abuseIpDbResult = null;

  if (type !== 'file') {
    safeBrowsingMatch = await checkSafeBrowsing(trace.finalUrl);
    virusTotalUrlResult = await checkVirusTotalUrl(trace.finalUrl);
    if (ipResolved) {
      abuseIpDbResult = await checkAbuseIPDB(ipResolved);
    }
  }

  // Compile HTTP/HTTPS check
  const isHttps = trace.finalUrl.toLowerCase().startsWith('https://');
  
  if (trace.fetchError) {
    // Unreachable host
    findings.push({
      title: 'Host Unreachable or Fetch Failure',
      description: `The threat scanner could not reach the target host. Error message: ${trace.fetchError}.`,
      severity: 'high',
      owasp: 'A05:2021-Security Misconfiguration',
      mitigation: 'Verify the host is active, DNS is resolving correctly, and no local network blockages are present.',
      evidenceHeader: 'Status',
      evidenceValue: 'Failed',
      evidenceReason: `Fetch failed due to error: ${trace.fetchError}`,
      confidence: 'High Confidence'
    });
    threatScore += 30;
  } else {
    // HTTP/HTTPS Checks
    if (!isHttps) {
      findings.push({
        title: 'Insecure Connection (HTTP)',
        description: 'The website uses plaintext HTTP. Network traffic is unencrypted and susceptible to interception and tampering.',
        severity: 'critical',
        owasp: 'A02:2021-Cryptographic Failures',
        mitigation: 'Install an SSL/TLS certificate and configure automatic redirection from HTTP to HTTPS.',
        evidenceHeader: 'Protocol',
        evidenceValue: 'http:',
        evidenceReason: 'The target URL protocol was evaluated as plaintext http: instead of secure https:.',
        confidence: 'High Confidence'
      });
      threatScore += 40;

      if (targetUrl.startsWith('http://') && !trace.redirectsToHttps) {
        findings.push({
          title: 'Missing HTTP-to-HTTPS Redirection',
          description: 'The site does not automatically promote insecure HTTP connections to secure HTTPS protocols.',
          severity: 'medium',
          owasp: 'A05:2021-Security Misconfiguration',
          mitigation: 'Configure the web server to return a 301 redirect to the HTTPS equivalent for all HTTP routes.',
          evidenceHeader: 'Redirect',
          evidenceValue: 'Absent',
          evidenceReason: 'Unencrypted HTTP entry is not redirected to HTTPS.',
          confidence: 'High Confidence'
        });
        threatScore += 10;
      }
    }

    // SSL certificate Checks
    if (isHttps) {
      if (trace.sslError) {
        if (trace.isExpired) {
          findings.push({
            title: 'Expired SSL/TLS Certificate',
            description: 'The website’s certificate has expired. Browsers will block access due to cryptographic expiration.',
            severity: 'high',
            owasp: 'A02:2021-Cryptographic Failures',
            mitigation: 'Renew your SSL/TLS certificate immediately with a trusted Certificate Authority.',
            evidenceHeader: 'SSL Certificate Status',
            evidenceValue: trace.cert?.valid_to || 'Expired',
            evidenceReason: `SSL handshake reports certificate expired. Error: ${trace.sslError}`,
            confidence: 'High Confidence'
          });
          threatScore += 25;
        } else if (trace.isSelfSigned) {
          findings.push({
            title: 'Self-Signed SSL/TLS Certificate',
            description: 'The website uses a self-signed certificate, which is not verified by a recognized Certificate Authority.',
            severity: 'medium',
            owasp: 'A02:2021-Cryptographic Failures',
            mitigation: 'Replace the self-signed certificate with one issued by a trusted Public Certificate Authority.',
            evidenceHeader: 'SSL Certificate Issuer',
            evidenceValue: trace.cert?.issuer?.CN || 'Self-Signed',
            evidenceReason: `SSL handshake reports self-signed certificate. Error: ${trace.sslError}`,
            confidence: 'High Confidence'
          });
          threatScore += 20;
        } else if (trace.isWrongHost) {
          findings.push({
            title: 'Hostname Mismatched SSL/TLS Certificate',
            description: 'The domain name does not match any Common Name (CN) or Alternative Name listed on the SSL certificate.',
            severity: 'medium',
            owasp: 'A02:2021-Cryptographic Failures',
            mitigation: 'Reissue the certificate to cover the correct domain name or subdomains.',
            evidenceHeader: 'SSL Certificate Host',
            evidenceValue: trace.cert?.subject?.CN || 'Mismatch',
            evidenceReason: `Hostname mismatch detected. Error: ${trace.sslError}`,
            confidence: 'High Confidence'
          });
          threatScore += 20;
        } else {
          findings.push({
            title: 'Invalid SSL/TLS Certificate Check',
            description: `The SSL handshake succeeded but flagged validation warnings. Reason: ${trace.sslError}.`,
            severity: 'medium',
            owasp: 'A02:2021-Cryptographic Failures',
            mitigation: 'Verify the certificate chain and configure the certificate correctly on the host.',
            evidenceHeader: 'SSL Status',
            evidenceValue: 'Invalid',
            evidenceReason: `SSL error: ${trace.sslError}`,
            confidence: 'High Confidence'
          });
          threatScore += 15;
        }
      }
    }

    // Security Headers checks
    const securityHeaders = {
      hsts: !!trace.headers['strict-transport-security'],
      csp: !!trace.headers['content-security-policy'] || !!trace.headers['content-security-policy-report-only'],
      xFrame: !!trace.headers['x-frame-options'],
      xContentType: !!trace.headers['x-content-type-options'],
      referrerPolicy: !!trace.headers['referrer-policy']
    };

    if (!securityHeaders.csp) {
      findings.push({
        title: 'Missing Content Security Policy (CSP)',
        description: 'Content-Security-Policy header is missing. This enables Cross-Site Scripting (XSS) and content injection attacks.',
        severity: 'high',
        owasp: 'A03:2021-Injection',
        mitigation: 'Implement the Content-Security-Policy header (e.g., default-src \'self\') to restrict resource loading.',
        evidenceHeader: 'Content-Security-Policy',
        evidenceValue: 'Absent',
        evidenceReason: 'No Content-Security-Policy or Content-Security-Policy-Report-Only headers were detected.',
        confidence: 'High Confidence'
      });
      threatScore += 15;
    } else if (trace.headers['content-security-policy-report-only'] && !trace.headers['content-security-policy']) {
      findings.push({
        title: 'Content Security Policy (CSP) in Report-Only Mode',
        description: 'Content-Security-Policy is set to report-only. Violations are logged but not blocked, which does not prevent XSS execution.',
        severity: 'low',
        owasp: 'A05:2021-Security Misconfiguration',
        mitigation: 'Review CSP violation logs, refine the policy, and deploy it in enforcing mode (Content-Security-Policy).',
        evidenceHeader: 'Content-Security-Policy-Report-Only',
        evidenceValue: trace.headers['content-security-policy-report-only'],
        evidenceReason: 'The site has deployed CSP in Report-Only mode, but is missing an enforcing Content-Security-Policy header.',
        confidence: 'High Confidence'
      });
      threatScore += 5;
    }

    if (isHttps && !securityHeaders.hsts) {
      findings.push({
        title: 'Missing Strict-Transport-Security (HSTS)',
        description: 'HTTP Strict Transport Security is not enabled. Attackers can execute SSL stripping or man-in-the-middle downgrade attacks.',
        severity: 'medium',
        owasp: 'A05:2021-Security Misconfiguration',
        mitigation: 'Configure the Strict-Transport-Security header (e.g., max-age=31536000; includeSubDomains; preload).',
        evidenceHeader: 'Strict-Transport-Security',
        evidenceValue: 'Absent',
        evidenceReason: 'Strict-Transport-Security header was not found on the target host.',
        confidence: 'High Confidence'
      });
      threatScore += 10;
    }

    if (!securityHeaders.xFrame) {
      findings.push({
        title: 'Missing X-Frame-Options Header',
        description: 'The X-Frame-Options header is missing. Attackers can embed this page inside an iframe on another domain to perform Clickjacking.',
        severity: 'medium',
        owasp: 'A05:2021-Security Misconfiguration',
        mitigation: 'Configure the web server to return X-Frame-Options: SAMEORIGIN or X-Frame-Options: DENY.',
        evidenceHeader: 'X-Frame-Options',
        evidenceValue: 'Absent',
        evidenceReason: 'X-Frame-Options header was not found in the HTTP response.',
        confidence: 'High Confidence'
      });
      threatScore += 10;
    }

    if (!securityHeaders.xContentType) {
      findings.push({
        title: 'Missing X-Content-Type-Options Header',
        description: 'The X-Content-Type-Options header is missing, allowing browsers to perform MIME-sniffing on content streams.',
        severity: 'low',
        owasp: 'A05:2021-Security Misconfiguration',
        mitigation: 'Add the X-Content-Type-Options: nosniff header to prevent MIME sniffing.',
        evidenceHeader: 'X-Content-Type-Options',
        evidenceValue: 'Absent',
        evidenceReason: 'X-Content-Type-Options header was not found in the HTTP response.',
        confidence: 'High Confidence'
      });
      threatScore += 5;
    }

    if (!securityHeaders.referrerPolicy) {
      findings.push({
        title: 'Missing Referrer-Policy Header',
        description: 'Referrer-Policy header is missing. This could leak sensitive URL components (like authentication tokens or tokens) to external domains.',
        severity: 'low',
        owasp: 'A05:2021-Security Misconfiguration',
        mitigation: 'Configure the Referrer-Policy header (e.g., Referrer-Policy: strict-origin-when-cross-origin).',
        evidenceHeader: 'Referrer-Policy',
        evidenceValue: 'Absent',
        evidenceReason: 'Referrer-Policy header was not found in the HTTP response.',
        confidence: 'High Confidence'
      });
      threatScore += 5;
    }
  }

  // 4. API Detections scoring
  if (safeBrowsingMatch?.isMalicious) {
    findings.push({
      title: 'Google Safe Browsing Reputation Flag',
      description: `Google Safe Browsing has flagged this domain as malicious. Threat category: ${safeBrowsingMatch.threatType}.`,
      severity: 'critical',
      owasp: 'A01:2021-Broken Access Control',
      mitigation: 'Audit host files for compromise, remove malicious software, and submit a review request via Google Search Console.',
      evidenceHeader: 'Google Safe Browsing API',
      evidenceValue: 'MALICIOUS',
      evidenceReason: `Safe Browsing classified target as: ${safeBrowsingMatch.threatType}`,
      confidence: 'High Confidence'
    });
    threatScore = Math.max(threatScore, 95);
  }

  if (virusTotalUrlResult && virusTotalUrlResult.positives > 0) {
    findings.push({
      title: 'VirusTotal Threat Scan Detections',
      description: `Multiple security engines (${virusTotalUrlResult.positives}/${virusTotalUrlResult.total}) flagged this link as malicious or suspicious.`,
      severity: virusTotalUrlResult.positives >= 5 ? 'critical' : virusTotalUrlResult.positives >= 2 ? 'high' : 'medium',
      owasp: 'A01:2021-Broken Access Control',
      mitigation: 'Investigate the domain classification on VirusTotal and inspect server code for active payload distributions.',
      evidenceHeader: 'VirusTotal API',
      evidenceValue: `${virusTotalUrlResult.positives}/${virusTotalUrlResult.total} detections`,
      evidenceReason: `VirusTotal dynamic engine analysis returned positive score: ${virusTotalUrlResult.score}%`,
      confidence: 'High Confidence'
    });
    threatScore = Math.max(threatScore, virusTotalUrlResult.score);
  }

  if (abuseIpDbResult && abuseIpDbResult.abuseScore > 0) {
    findings.push({
      title: 'AbuseIPDB Abuse Reputation Alert',
      description: `The resolved IP address (${ipResolved}) has an abuse confidence score of ${abuseIpDbResult.abuseScore}% with reports of malicious activity.`,
      severity: abuseIpDbResult.abuseScore >= 50 ? 'high' : 'medium',
      owasp: 'A01:2021-Broken Access Control',
      mitigation: 'Verify dynamic routing configurations, investigate host activity logs, and secure local networks.',
      evidenceHeader: 'AbuseIPDB API',
      evidenceValue: `${abuseIpDbResult.abuseScore}% confidence score`,
      evidenceReason: `Host IP resolved to ${ipResolved} which is flagged on AbuseIPDB databases.`,
      confidence: 'High Confidence'
    });
    threatScore = Math.max(threatScore, Math.round(abuseIpDbResult.abuseScore * 0.8));
  }

  // Cap scores
  threatScore = Math.min(100, Math.max(0, threatScore));
  const securityScore = Math.max(0, 100 - threatScore);

  let status: 'safe' | 'suspicious' | 'dangerous' = 'safe';
  if (threatScore >= 70) status = 'dangerous';
  else if (threatScore >= 35) status = 'suspicious';

  // Build natural language risk summary
  const summaryIndicators: string[] = [];
  findings.forEach(f => {
    if (f.severity === 'critical' || f.severity === 'high' || f.severity === 'medium') {
      summaryIndicators.push(f.title);
    }
  });

  let rawExplanation = `The scan of ${target} yielded a threat score of ${threatScore}%. `;
  if (trace.fetchError) {
    rawExplanation += `Failed to connect: ${trace.fetchError}. `;
  } else {
    rawExplanation += `Connection returned HTTP status ${trace.statusCode}. SSL certificate is ${trace.sslError ? 'invalid (' + trace.sslError + ')' : 'valid'}. `;
  }
  
  if (summaryIndicators.length > 0) {
    rawExplanation += `Security alerts flagged: ${summaryIndicators.join(', ')}.`;
  } else {
    rawExplanation += `No high-severity risks observed.`;
  }

  if (unavailableApis.length > 0) {
    rawExplanation += ` (API checks skipped: ${unavailableApis.join(', ')})`;
  }

  const explanation = await getGeminiThreatExplanation(target, type, rawExplanation);

  return {
    source: 'real_api',
    status,
    threatScore,
    securityScore,
    explanation,
    findings,
    details: {
      virusTotal: virusTotalUrlResult,
      abuseIpDb: abuseIpDbResult,
      safeBrowsing: safeBrowsingMatch,
      dnsRecords,
      sslCertInfo: {
        valid: !trace.sslError,
        issuer: trace.cert ? (typeof trace.cert.issuer === 'object' ? (trace.cert.issuer.O || trace.cert.issuer.CN) : String(trace.cert.issuer)) : 'Unknown',
        validFrom: trace.cert?.valid_from,
        validTo: trace.cert?.valid_to,
        expired: trace.isExpired,
        selfSigned: trace.isSelfSigned,
        wrongHost: trace.isWrongHost,
        error: trace.sslError
      },
      headers: trace.headers,
      securityHeaders: {
        hsts: !!trace.headers['strict-transport-security'],
        csp: !!trace.headers['content-security-policy'] || !!trace.headers['content-security-policy-report-only'],
        xFrame: !!trace.headers['x-frame-options'],
        xContentType: !!trace.headers['x-content-type-options'],
        referrerPolicy: !!trace.headers['referrer-policy']
      },
      isHttps,
      redirectsToHttps: trace.redirectsToHttps,
      redirectChain: trace.redirectChain,
      statusCode: trace.statusCode,
      fetchError: trace.fetchError,
      ipResolved,
      whois,
      unavailableApis
    }
  };
}
