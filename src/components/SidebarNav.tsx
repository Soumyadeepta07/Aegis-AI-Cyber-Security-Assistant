"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  Search, 
  Globe, 
  FileText, 
  Terminal, 
  Lock, 
  History, 
  Users,
  AlertCircle
} from "lucide-react";

interface SidebarNavProps {
  role: 'user' | 'admin';
}

export default function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard SOC', href: '/dashboard', icon: Shield },
    { name: 'URL Scanner', href: '/dashboard/scanner', icon: Search },
    { name: 'Domain Intel', href: '/dashboard/domain', icon: Globe },
    { name: 'File Analyzer', href: '/dashboard/file', icon: FileText },
    { name: 'AI Security Audit', href: '/dashboard/audit', icon: AlertCircle },
    { name: 'Security Advisor', href: '/dashboard/advisor', icon: Terminal },
    { name: 'CVE Database', href: '/dashboard/cves', icon: Lock },
    { name: 'Scan History', href: '/dashboard/history', icon: History },
  ];

  const adminNav = [
    { name: 'Admin Panel', href: '/admin', icon: Users }
  ];

  const getLinkClass = (href: string, isAdminTheme: boolean = false) => {
    // Check if pathname matches href exactly, or if it is a subpath (except for /dashboard base)
    const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

    const baseClass = "flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium border";

    if (isActive) {
      if (isAdminTheme) {
        return `${baseClass} text-rose-400 bg-rose-950/20 border-rose-500/30 font-semibold`;
      }
      return `${baseClass} text-cyan-400 bg-cyan-950/20 border-cyan-500/30 font-semibold`;
    }

    return `${baseClass} text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border-transparent`;
  };

  return (
    <nav className="p-4 space-y-1.5 flex-1">
      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block px-2 mb-2">Modules</span>
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={getLinkClass(item.href)}
          >
            <Icon className="h-4.5 w-4.5" />
            {item.name}
          </Link>
        );
      })}

      {/* Admin Section */}
      {role === 'admin' && (
        <div className="pt-4 border-t border-slate-900 mt-4 space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block px-2 mb-2">Management</span>
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={getLinkClass(item.href, true)}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
