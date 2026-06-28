import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { getServerSession } from '@/lib/session';
import { getDbMode } from '@/lib/db/prisma';
import DashboardLayoutWrapper from '@/components/DashboardLayoutWrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  const { isSqlite } = getDbMode();

  return (
    <DashboardLayoutWrapper session={session} isSqlite={isSqlite}>
      {children}
    </DashboardLayoutWrapper>
  );
}
