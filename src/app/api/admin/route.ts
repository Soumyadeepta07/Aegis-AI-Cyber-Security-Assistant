import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDbMode } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { provider } = getDbMode();

    // Query stats via Prisma count
    const totalScans = await prisma.scan.count();
    const threatsDetected = await prisma.scan.count({ where: { status: 'dangerous' } });
    const safeScans = await prisma.scan.count({ where: { status: 'safe' } });
    const suspiciousScans = await prisma.scan.count({ where: { status: 'suspicious' } });

    // Fetch users (exposing basic profile fields, omitting passwords)
    const usersList = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isBlocked: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute simple date-based aggregation for Recharts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentScans = await prisma.scan.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      }
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap = new Map<string, { name: string; safe: number; suspicious: number; dangerous: number }>();

    // Prepopulate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = dayNames[d.getDay()];
      trendMap.set(label, { name: label, safe: 0, suspicious: 0, dangerous: 0 });
    }

    // Aggregate
    recentScans.forEach(s => {
      const dayLabel = dayNames[new Date(s.createdAt).getDay()];
      if (trendMap.has(dayLabel)) {
        const item = trendMap.get(dayLabel)!;
        if (s.status === 'safe') item.safe++;
        else if (s.status === 'suspicious') item.suspicious++;
        else if (s.status === 'dangerous') item.dangerous++;
      }
    });

    const threatTrends = Array.from(trendMap.values());

    return NextResponse.json({
      success: true,
      stats: {
        totalScans,
        threatsDetected,
        safeScans,
        suspiciousScans,
      },
      users: usersList,
      threatTrends,
      dbMode: provider,
    });
  } catch (e: any) {
    console.error('Admin API GET error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action } = body; // action: 'block' | 'unblock' | 'make_admin' | 'make_user'

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and Action are required' }, { status: 400 });
    }

    // Prevent admin self-blocking/demotion
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot modify your own administrative account status' }, { status: 400 });
    }

    const { provider } = getDbMode();

    // Query user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Perform moderation action
    if (action === 'block') {
      await prisma.user.update({ where: { id: userId }, data: { isBlocked: true } });
    } else if (action === 'unblock') {
      await prisma.user.update({ where: { id: userId }, data: { isBlocked: false } });
    } else if (action === 'make_admin') {
      await prisma.user.update({ where: { id: userId }, data: { role: 'admin' } });
    } else if (action === 'make_user') {
      await prisma.user.update({ where: { id: userId }, data: { role: 'user' } });
    }

    return NextResponse.json({ success: true, dbMode: provider });
  } catch (e: any) {
    console.error('Admin API POST error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
