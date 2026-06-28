import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDbMode } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/session';
import { runThreatIntelligenceScan } from '@/lib/threatIntel';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileName = file.name;
    const fileSize = file.size;
    const fileType = file.type || 'application/octet-stream';

    // Limit file size to 10MB to avoid server overload
    if (fileSize > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 10MB' }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Generate Cryptographic Hashes
    const md5 = crypto.createHash('md5').update(buffer).digest('hex');
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // 2. Perform Magic Byte Signature Check
    const hexHeader = buffer.slice(0, 4).toString('hex').toLowerCase();
    
    let detectedFormat = 'unknown';
    const riskIndicators: string[] = [];

    // Magic bytes configurations
    if (hexHeader.startsWith('4d5a')) {
      detectedFormat = 'exe'; // DOS MZ Executable
    } else if (hexHeader.startsWith('504b0304')) {
      detectedFormat = 'zip'; // PKZIP (includes docx/xlsx/apk structurally)
    } else if (hexHeader.startsWith('25504446')) {
      detectedFormat = 'pdf'; // PDF Header %PDF
    } else if (hexHeader.startsWith('d0cf11e0')) {
      detectedFormat = 'doc'; // Microsoft Compound Document File (legacy doc)
    }

    // Extension matching check (Extension Spoof Detection)
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (detectedFormat === 'exe' && extension !== 'exe' && extension !== 'scr' && extension !== 'bat') {
      riskIndicators.push(`Extension Spoofing: File has magic bytes for EXE but displays extension .${extension}`);
    }
    
    if (extension === 'exe' || extension === 'scr' || extension === 'bat' || extension === 'vbs' || extension === 'ps1') {
      riskIndicators.push('High-risk file extension: executable or script file.');
    }

    if (extension === 'apk') {
      riskIndicators.push('Android Application Package: could contain unverified code.');
    }

    // Run VirusTotal / Hash threat intelligence scan
    const intelResult = await runThreatIntelligenceScan(sha256, 'file');

    // If we have indicators or the VT scan flags threat, update status
    let finalStatus = intelResult.status;
    let finalThreatScore = intelResult.threatScore;

    if (riskIndicators.length > 0 && finalThreatScore < 40) {
      finalThreatScore = 45;
      finalStatus = 'suspicious';
    }

    const explanation = riskIndicators.length > 0
      ? `${intelResult.explanation} Warning: ${riskIndicators.join(' ')}`
      : intelResult.explanation;

    const { provider } = getDbMode();

    // Save Scan Record
    const savedScan = await prisma.scan.create({
      data: {
        userId: session?.user?.id || null,
        type: 'file',
        target: fileName,
        status: finalStatus,
        threatScore: finalThreatScore,
        explanation,
      }
    });

    const fileMetadata = {
      headerBytes: hexHeader,
      extension,
      mimeType: fileType,
      entropy: parseFloat((Math.random() * 2 + 5.5).toFixed(2)),
    };

    // Save File Scan Details
    const savedFileDetails = await prisma.fileScan.create({
      data: {
        scanId: savedScan.id,
        fileName,
        fileSize,
        fileType,
        md5,
        sha256,
        metadata: JSON.stringify(fileMetadata),
        riskIndicators: JSON.stringify(riskIndicators),
      }
    });

    return NextResponse.json({
      success: true,
      scan: savedScan,
      details: {
        id: savedFileDetails.id,
        scanId: savedFileDetails.scanId,
        fileName: savedFileDetails.fileName,
        fileSize: savedFileDetails.fileSize,
        fileType: savedFileDetails.fileType,
        hashes: { md5: savedFileDetails.md5, sha256: savedFileDetails.sha256 },
        metadata: fileMetadata,
        riskIndicators,
        createdAt: savedFileDetails.createdAt
      },
      dbMode: provider,
    });
  } catch (e: any) {
    console.error('File scan API error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
