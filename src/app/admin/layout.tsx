import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getServerSession } from '@/lib/session';
import { getDbMode } from '@/lib/db/prisma';
import DashboardLayoutWrapper from '@/components/DashboardLayoutWrapper';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // Enforce session check
  if (!session) {
    redirect('/login');
  }

  // Role-Based Access Control: Enforce admin role check
  if (session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  const { isSqlite } = getDbMode();

  return (
    <DashboardLayoutWrapper session={session} isSqlite={isSqlite} isAdmin={true}>
      {children}
    </DashboardLayoutWrapper>
  );
}
