import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDbMode } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/session';
import { runThreatIntelligenceScan } from '@/lib/threatIntel';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl; // Default to HTTPS
    }

    let cleanUrl: URL;
    try {
      cleanUrl = new URL(targetUrl);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    console.log(`[Security Audit] Auditing headers for ${cleanUrl.href}...`);
    
    // Call unified analysis engine
    const intelResult = await runThreatIntelligenceScan(cleanUrl.href, 'url');

    // Extract headers and check findings
    const headersObj = intelResult.details.headers || {};
    const securityScore = intelResult.securityScore;
    const threatLevel = intelResult.status;
    const auditSummary = intelResult.explanation;

    // Calculate evidence statistics
    const targetHeaders = [
      'content-security-policy',
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
      'permissions-policy'
    ];

    let headersPresentCount = 0;
    let headersMissingCount = 0;

    targetHeaders.forEach(h => {
      if (headersObj[h] || (h === 'content-security-policy' && headersObj['content-security-policy-report-only'])) {
        headersPresentCount++;
      } else {
        if (h === 'strict-transport-security' && intelResult.details.securityHeaders?.hsts) {
          headersPresentCount++;
        } else {
          headersMissingCount++;
        }
      }
    });

    const evidenceSummary = {
      totalHeadersInspected: targetHeaders.length,
      headersPresent: headersPresentCount,
      headersMissing: headersMissingCount,
      redirectsFollowed: !!(intelResult.details.redirectChain && intelResult.details.redirectChain.length > 0),
      finalUrlAudited: cleanUrl.href
    };

    // Map findings to the frontend AuditFindings['findings'] format
    const aiFindings = intelResult.findings.map(f => ({
      owaspCategory: f.owasp,
      findingTitle: f.title,
      threatExplanation: f.description,
      remediationSteps: f.mitigation,
      evidenceHeader: f.evidenceHeader,
      evidenceValue: f.evidenceValue,
      evidenceReason: f.evidenceReason,
      confidence: f.confidence
    }));

    const { provider } = getDbMode();

    // Save Scan Record
    const savedScan = await prisma.scan.create({
      data: {
        userId: session?.user?.id || null,
        type: 'audit',
        target: cleanUrl.href,
        status: threatLevel,
        threatScore: intelResult.threatScore,
        explanation: auditSummary,
      }
    });

    // Save SecurityReport (Scan -> One Security Report)
    await prisma.securityReport.create({
      data: {
        scanId: savedScan.id,
        url: cleanUrl.href,
        host: cleanUrl.host,
        securityScore,
        threatLevel,
        headers: JSON.stringify(headersObj),
        findings: JSON.stringify(aiFindings),
        summary: auditSummary,
        isFetchedLive: true,
        fetchError: intelResult.details.fetchError || intelResult.details.sslCertInfo?.error || null,
      }
    });

    // Save AuditReport (User -> Many Audit Reports)
    await prisma.auditReport.create({
      data: {
        userId: session?.user?.id || null,
        url: cleanUrl.href,
        securityScore,
        threatLevel,
        findings: JSON.stringify(aiFindings),
        summary: auditSummary,
        isFetchedLive: true,
        fetchError: intelResult.details.fetchError || intelResult.details.sslCertInfo?.error || null,
      }
    });

    return NextResponse.json({
      success: true,
      scan: savedScan,
      audit: {
        url: cleanUrl.href,
        host: cleanUrl.host,
        securityScore,
        threatLevel,
        headers: headersObj,
        findings: aiFindings,
        summary: auditSummary,
        evidenceSummary,
        isFetchedLive: true,
        fetchError: intelResult.details.fetchError || intelResult.details.sslCertInfo?.error || null
      },
      dbMode: provider,
    });
  } catch (e: any) {
    console.error('Audit scan API error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
