import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDbMode } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const query = searchParams.get('q') || '';
    const isAdminView = searchParams.get('admin') === 'true';

    // Enforce admin privileges if requesting admin view
    if (isAdminView && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { provider } = getDbMode();

    // Prisma Query Builder
    const whereClause: any = {};
    if (!isAdminView) {
      whereClause.userId = session.user.id;
    }
    if (type && type !== 'all') {
      whereClause.type = type;
    }
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    if (query) {
      whereClause.target = { contains: query };
    }

    const scans = await prisma.scan.findMany({
      where: whereClause,
      include: {
        securityReport: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      scans,
      dbMode: provider,
    });
  } catch (e: any) {
    console.error('Scan history API error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('id');

    if (!scanId) {
      return NextResponse.json({ error: 'Scan ID is required' }, { status: 400 });
    }

    const { provider } = getDbMode();

    // Query scan
    const scan = await prisma.scan.findUnique({
      where: { id: scanId }
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Check ownership
    if (scan.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prisma Delete (cascades automatically to related DomainScan, FileScan, or SecurityReport records)
    await prisma.scan.delete({
      where: { id: scanId }
    });

    return NextResponse.json({ success: true, dbMode: provider });
  } catch (e: any) {
    console.error('Scan delete API error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
