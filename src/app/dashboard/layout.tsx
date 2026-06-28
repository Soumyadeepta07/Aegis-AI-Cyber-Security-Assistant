import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { getServerSession } from '@/lib/session';
import { getDbMode } from '@/lib/db/prisma';
import { 
  Shield, 
  AlertTriangle,
  User
} from 'lucide-react';
import SignOutButton from '@/components/SignOutButton';
import ThemeToggle from '@/components/ThemeToggle';
import SidebarNav from '@/components/SidebarNav';

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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between sticky top-0 h-screen z-20 shrink-0">
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-900">
            <Shield className="h-5 w-5 text-cyan-400" />
            <span className="font-outfit font-bold tracking-wider text-sm">AEGIS SYSTEM</span>
            <span className="font-mono text-[9px] font-extrabold px-1 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">SOC</span>
            {isSqlite && (
              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/40 text-amber-400 animate-pulse ml-auto">DEV</span>
            )}
          </div>

          {/* Nav Items */}
          <SidebarNav role={session.user.role} />
        </div>

        {/* User Session Profile & Log Out */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/40 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-slate-800 rounded-lg p-2 text-slate-300 shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{session.user.name}</p>
                <span className="font-mono text-[9px] font-bold text-cyan-400/80 uppercase tracking-widest bg-cyan-950/30 px-1 rounded border border-cyan-900/40">{session.user.role}</span>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <SignOutButton />
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* SQL Local Development Mode fallback warning banner */}
        {isSqlite && (
          <div className="bg-amber-950/40 border-b border-amber-800/30 px-6 py-2.5 flex items-center justify-between text-amber-400 text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span><strong>DEVELOPMENT MODE ACTIVE:</strong> The application is running using a local SQLite database fallback because a production MySQL 8+ database is unreachable. Logins, security scans, and audits are fully persistent locally in SQLite.</span>
            </div>
            <span className="bg-amber-900/50 border border-amber-800/50 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">SQLite Local</span>
          </div>
        )}

        {/* Page children */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
