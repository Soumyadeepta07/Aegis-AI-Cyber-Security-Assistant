import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDbMode } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/session';
import { runThreatIntelligenceScan } from '@/lib/threatIntel';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await req.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain name is required' }, { status: 400 });
    }

    // Clean domain string
    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];

    // Basic domain validation regex
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,15}$/i;
    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json({ error: 'Invalid domain name format' }, { status: 400 });
    }

    // Run unified reputation scan
    const intelResult = await runThreatIntelligenceScan(cleanDomain, 'domain');

    // Extract real records from the unified engine
    const dnsRecords = intelResult.details.dnsRecords || { A: [], AAAA: [], MX: [], NS: [], TXT: [] };
    const sslCertInfo = intelResult.details.sslCertInfo || { valid: false, issuer: 'Unknown', expired: false, selfSigned: false, wrongHost: false, error: 'Check failed' };
    const registrar = intelResult.details.whois?.registrar || 'Unknown';
    const domainAge = intelResult.details.whois?.ageText || 'Unknown';

    // Compute basic configuration settings based on TXT records
    const txtJoined = (dnsRecords.TXT || []).join(' ').toLowerCase();
    const securityConfig = {
      dnssec: false,
      spf: txtJoined.includes('v=spf1'),
      dmarc: txtJoined.includes('v=dmarc1'),
    };

    const { provider } = getDbMode();

    // Save Scan Record
    const savedScan = await prisma.scan.create({
      data: {
        userId: session?.user?.id || null,
        type: 'domain',
        target: cleanDomain,
        status: intelResult.status,
        threatScore: intelResult.threatScore,
        explanation: intelResult.explanation,
      }
    });

    const parsedSslCertInfo = sslCertInfo.error ? { issuer: sslCertInfo.issuer || 'Self-Signed / Untrusted', expired: sslCertInfo.expired, error: sslCertInfo.error } : sslCertInfo;

    // Save Domain Details
    const savedDomainDetails = await prisma.domainScan.create({
      data: {
        scanId: savedScan.id,
        domain: cleanDomain,
        age: domainAge,
        registrar,
        dnsRecords: JSON.stringify(dnsRecords),
        sslCertInfo: JSON.stringify(parsedSslCertInfo),
        reputationScore: intelResult.securityScore, // Use unified securityScore
        securityConfig: JSON.stringify(securityConfig),
      }
    });

    return NextResponse.json({
      success: true,
      scan: savedScan,
      details: {
        id: savedDomainDetails.id,
        scanId: savedDomainDetails.scanId,
        domain: savedDomainDetails.domain,
        age: savedDomainDetails.age,
        registrar: savedDomainDetails.registrar,
        dnsRecords,
        sslCertInfo: parsedSslCertInfo,
        reputationScore: savedDomainDetails.reputationScore,
        securityConfig,
        createdAt: savedDomainDetails.createdAt
      },
      dbMode: provider,
    });
  } catch (e: any) {
    console.error('Domain scan API error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
