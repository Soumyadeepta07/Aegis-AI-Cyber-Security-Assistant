import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDbMode } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/session';
import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: any = null;

if (geminiApiKey) {
  try {
    aiClient = new GoogleGenerativeAI(geminiApiKey);
  } catch (e) {
    console.error("Gemini client initialization failed for Chat:", e);
  }
}

const CYBER_SECURITY_SYSTEM_PROMPT = `You are a Senior Cyber Security Assistant and Threat Intelligence Analyst. 
You are here to assist users with cybersecurity-related inquiries, including:
1. Explaining vulnerabilities, exploits, and CVEs.
2. Explaining social engineering, phishing, malware, and ransomware attacks.
3. Suggesting best practices to secure personal accounts, servers, networks, and databases.
4. Analyzing security configurations, HTTP headers, domain trust, and cryptographic signatures.
5. Providing security remediation steps and mitigation guides.

CRITICAL RULES:
- Only answer questions related to computer science, network engineering, information security, cryptology, software engineering, and general cyber threats.
- If the user asks a completely unrelated question (e.g. cooking, travel, sports, creative writing), politely redirect them back to cybersecurity and state that you are dedicated to securing their digital environment.
- Format your output professionally with Markdown, headers, bullet points, and code blocks where necessary.
- Write in a highly secure, professional, and helpful tone.
- Do not provide actual malicious exploit code, but feel free to explain proof-of-concepts conceptually.`;

export async function GET(req: NextRequest) {
  try {
    const key = process.env.GEMINI_API_KEY;
    const isConfigured = !!key;
    let isReachable = false;
    let errorMsg: string | null = null;

    if (isConfigured) {
      try {
        const genAI = new GoogleGenerativeAI(key!);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // Connectivity check with a simple prompt and short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
        });
        clearTimeout(timeoutId);
        
        if (response && response.response) {
          isReachable = true;
        }
      } catch (err: any) {
        errorMsg = err.message || String(err);
        console.error('[AI Advisor GET Check] Gemini API check failed:', errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      reachable: isReachable,
      modelInUse: 'gemini-1.5-flash',
      error: errorMsg
    });
  } catch (e: any) {
    console.error('[AI Advisor GET Status] Internal check error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await req.json();
    const { messages, chatId } = body; 

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const latestUserMessage = messages[messages.length - 1].content;

    let assistantResponse = '';
    let isFallbackMode = !aiClient;
    let apiError: string | null = null;

    if (aiClient) {
      try {
        const model = aiClient.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          systemInstruction: CYBER_SECURITY_SYSTEM_PROMPT
        });
        
        const geminiMessages = messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const response = await model.generateContent({
          contents: geminiMessages
        });

        assistantResponse = response.response.text().trim();
      } catch (err: any) {
        apiError = err.message || String(err);
        isFallbackMode = true;
        // Show exact backend error in server logs
        console.error('[AI Advisor POST] Gemini API Chat execution failed. Exact backend error:', err);
      }
    }

    if (isFallbackMode) {
      const query = latestUserMessage.toLowerCase();
      
      if (query.includes('phish') || query.includes('website') || query.includes('safe')) {
        assistantResponse = `### Understanding Phishing & Website Safety

Phishing is a social engineering attack where attackers duplicate a trusted login page to steal credentials. 

**Indicators of a Phishing Website:**
*   **Domain Mismatch:** Check the URL bar closely (e.g., \`paypaI-login.com\` using an 'I' instead of 'l').
*   **Missing Security Headers:** Phishing landing pages rarely configure HSTS, Content-Security-Policy (CSP), or secure cookies.
*   **Urgency:** The page demands immediate login or credentials verification.

**Remediation Recommendations:**
1. Use a password manager (they will not autofill credentials on matching lookalike domains).
2. Enable Multi-Factor Authentication (MFA) on all critical business accounts.
3. Run any suspicious URL through our **URL Scanner** or **AI Security Audit** dashboard.`;
      } else if (query.includes('secure') || query.includes('password') || query.includes('account')) {
        assistantResponse = `### Account Security Best Practices

Securing accounts is the first line of defense against compromise.

**Recommendations:**
1. **Password Entropy:** Utilize passwords of at least 16 characters containing numbers, mixed case letters, and symbols. Avoid reusing passwords.
2. **Multi-Factor Authentication (MFA):** Implement FIDO2/WebAuthn hardware keys (like YubiKey) or app-based authenticator codes. Avoid SMS-based MFA.
3. **Session Management:** Enforce cookie flags like \`HttpOnly\`, \`Secure\`, and \`SameSite=Strict\` on your web applications to prevent session-jacking.
4. **Audit Logs:** Monitor your account login history for unfamiliar locations, IPs, or devices.`;
      } else if (query.includes('cve') || query.includes('vulnerabilit') || query.includes('exploit')) {
        assistantResponse = `### Vulnerability Disclosure & CVEs

A **CVE (Common Vulnerabilities and Exposures)** is a unique identifier assigned to publicly disclosed software vulnerabilities.

**Key CVE Concepts:**
*   **CVSS Score:** Common Vulnerability Scoring System, ranging from 0.0 (none) to 10.0 (critical).
*   **Zero-Day:** A vulnerability that is actively exploited before the vendor has released a patch.
*   **Remediation:** Typically involves applying security patches, upgrading dependencies, or setting specific software configurations.

Please query our **Vulnerability Knowledge Base** in the sidebar to search for real CVEs like Log4Shell or Heartbleed!`;
      } else if (query.includes('csp') || query.includes('content security policy') || query.includes('content-security-policy')) {
        assistantResponse = `### Content Security Policy (CSP) Explanation

**Content-Security-Policy (CSP)** is an HTTP response header that helps detect and mitigate Cross-Site Scripting (XSS) and clickjacking / data injection attacks.

**Key Directives:**
*   \`default-src\`: Default fallback for other fetch directives.
*   \`script-src\`: Restricts the sources of JavaScript (e.g. \`'self'\`, hashes, or nonces).
*   \`style-src\`: Restricts the sources of CSS stylesheets.
*   \`img-src\`: Restricts the sources of images.

**Example Header Configuration:**
\`\`\`http
Content-Security-Policy: default-src 'self'; script-src 'self' https://apis.google.com; style-src 'self' 'unsafe-inline';
\`\`\`

**Remediation and Best Practices:**
1. Avoid using \`'unsafe-inline'\` or \`'unsafe-eval'\` in production without nonces/hashes as they bypass XSS protections.
2. Deploy CSP in Report-Only mode first (\`Content-Security-Policy-Report-Only\`) to audit and resolve blocks before active enforcement.`;
      } else if (query.includes('hsts') || query.includes('strict-transport-security') || query.includes('strict transport security')) {
        assistantResponse = `### Strict-Transport-Security (HSTS) Explanation

**Strict-Transport-Security (HSTS)** is an HTTP header that forces modern browsers to interact with the website only using secure HTTPS connections. It protects against MITM attacks like SSL stripping.

**Key Attributes:**
*   \`max-age=<expire-time>\`: Seconds that the browser should remember to enforce HTTPS (e.g. \`31536000\` for 1 year).
*   \`includeSubDomains\`: Applies the rule to all subdomains under the apex host.
*   \`preload\`: Requests entry into major browser precompiled preload lists.

**Example Header Configuration:**
\`\`\`http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
\`\`\`

**Best Practices:**
1. Ensure your SSL/TLS certificates are fully valid and renewed before configuring long HSTS max-ages.
2. Always redirect HTTP to HTTPS at the server level before returning the HSTS header.`;
      } else if (query.includes('header') || query.includes('headers')) {
        assistantResponse = `### Security Headers Guidance

HTTP security headers provide a vital layer of defense-in-depth to mitigate common web app attack vectors.

**Key Security Headers:**
1.  **Content-Security-Policy (CSP):** Restricts loaded resources (scripts, styles, media) to trusted sources.
2.  **Strict-Transport-Security (HSTS):** Enforces secure HTTPS connections.
3.  **X-Content-Type-Options:** Prevents MIME-sniffing vulnerability (\`nosniff\`).
4.  **X-Frame-Options:** Protects against clickjacking attacks (\`DENY\` or \`SAMEORIGIN\`).
5.  **Referrer-Policy:** Controls how much referrer information is shared.
6.  **Permissions-Policy:** Controls hardware and feature flags.

**Example Nginx Configuration:**
\`\`\`nginx
add_header Content-Security-Policy "default-src 'self';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
\`\`\`
`;
      } else {
        // Custom prompt catch-all. Prevent returning the initial greeting message.
        assistantResponse = `### Local Security Advisor Active

I am currently running in **Local Mode (Gemini Unavailable)**.

I have processed your security query: *"${latestUserMessage}"*

Since my live AI connection is offline, I can only provide general guidance. To receive deep, context-aware cybersecurity analysis, please ensure your \`GEMINI_API_KEY\` is configured in your environmental settings and the dev server is restarted.

**Standard Recommendations:**
1. **Configure Headers**: Ensure you have HSTS, CSP, and X-Content-Type-Options enabled on all outward-facing apps.
2. **Scan URL/Domains**: Use the URL Scanner or Domain Analyzer modules on the left to verify active threats.
3. **MFA Enforcements**: Require phishing-resistant MFA (FIDO2) for critical entryways.`;
      }
    }

    const { provider } = getDbMode();

    // Save Chat History if user is authenticated
    if (session?.user?.id) {
      const newMessages = [
        ...messages,
        { role: 'assistant', content: assistantResponse, timestamp: new Date() }
      ];

      if (chatId && chatId !== 'new') {
        try {
          await prisma.chatHistory.update({
            where: { id: chatId, userId: session.user.id },
            data: { messages: JSON.stringify(newMessages) }
          });
        } catch (e) {
          // If update fails, create instead
          const newChat = await prisma.chatHistory.create({
            data: {
              userId: session.user.id,
              messages: JSON.stringify(newMessages)
            }
          });
          return NextResponse.json({ 
            success: true, 
            response: assistantResponse, 
            chatId: newChat.id, 
            dbMode: provider,
            isFallbackMode,
            apiError
          });
        }
      } else {
        const newChat = await prisma.chatHistory.create({
          data: {
            userId: session.user.id,
            messages: JSON.stringify(newMessages)
          }
        });
        return NextResponse.json({ 
          success: true, 
          response: assistantResponse, 
          chatId: newChat.id, 
          dbMode: provider,
          isFallbackMode,
          apiError
        });
      }
    }

    return NextResponse.json({
      success: true,
      response: assistantResponse,
      chatId: chatId || 'anonymous',
      dbMode: provider,
      isFallbackMode,
      apiError
    });
  } catch (e: any) {
    console.error('Chat API error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
