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
      targetUrl = 'http://' + targetUrl;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Run threat scan
    const scanResult = await runThreatIntelligenceScan(targetUrl, 'url');

    const { provider } = getDbMode();

    // Save Scan Record
    const savedScan = await prisma.scan.create({
      data: {
        userId: session?.user?.id || null,
        type: 'url',
        target: targetUrl,
        status: scanResult.status,
        threatScore: scanResult.threatScore,
        explanation: scanResult.explanation,
      }
    });

    // Save Related Security Report
    const securityReport = await prisma.securityReport.create({
      data: {
        scanId: savedScan.id,
        url: targetUrl,
        host: parsedUrl.host,
        securityScore: Math.max(0, 100 - scanResult.threatScore),
        threatLevel: scanResult.status,
        headers: JSON.stringify(scanResult.details?.headers || {}),
        findings: JSON.stringify(scanResult.details || {}),
        summary: scanResult.explanation,
        isFetchedLive: true,
        fetchError: scanResult.details?.fetchError || null,
      }
    });

    return NextResponse.json({
      success: true,
      scan: savedScan,
      details: scanResult.details,
      dbMode: provider,
    });
  } catch (e: any) {
    console.error('URL scan API error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
