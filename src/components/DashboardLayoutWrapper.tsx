"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  Menu, 
  X, 
  User, 
  AlertTriangle 
} from "lucide-react";
import SidebarNav from "./SidebarNav";
import ThemeToggle from "./ThemeToggle";
import SignOutButton from "./SignOutButton";

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: 'user' | 'admin';
      emailVerified: boolean;
    };
    session: {
      id: string;
      userId: string;
      expiresAt: string;
    };
  };
  isSqlite: boolean;
  isAdmin?: boolean;
}

export default function DashboardLayoutWrapper({
  children,
  session,
  isSqlite,
  isAdmin = false
}: DashboardLayoutWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const brandText = isAdmin ? "AEGIS ADMIN" : "AEGIS SYSTEM";
  const badgeText = isAdmin ? "ROOT" : "SOC";
  
  const iconColorClass = isAdmin ? "text-rose-500" : "text-cyan-400";
  const badgeColorClass = isAdmin 
    ? "bg-rose-955/60 border border-rose-800/50 text-rose-500" 
    : "bg-cyan-950/60 border border-cyan-800/50 text-cyan-400";

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 w-full overflow-hidden">
      {/* 1. Desktop Sidebar (always visible on desktop, hidden on mobile/tablet) */}
      <aside className="hidden lg:flex w-64 border-r border-slate-800/80 bg-slate-950/85 backdrop-blur-md flex-col justify-between sticky top-0 h-screen z-20 shrink-0">
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-900">
            <Shield className={`h-5 w-5 ${iconColorClass} ${isAdmin ? "animate-pulse" : ""}`} />
            <span className="font-outfit font-bold tracking-wider text-sm">{brandText}</span>
            <span className={`font-mono text-[9px] font-extrabold px-1 py-0.5 rounded ${badgeColorClass}`}>{badgeText}</span>
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
                <span className={`font-mono text-[9px] font-bold uppercase tracking-widest px-1 rounded border ${isAdmin ? "text-rose-400 border-rose-900/40 bg-rose-950/30" : "text-cyan-400/80 border-cyan-900/40 bg-cyan-950/30"}`}>
                  {session.user.role}
                </span>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <SignOutButton />
        </div>
      </aside>

      {/* 2. Mobile/Tablet Navbar and Hamburger drawer */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Top Navbar for Mobile/Tablet */}
        <header className="lg:hidden h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 w-full">
          <div className="flex items-center gap-2">
            <Shield className={`h-5 w-5 ${iconColorClass} ${isAdmin ? "animate-pulse" : ""}`} />
            <span className="font-outfit font-bold tracking-wider text-sm">{brandText}</span>
            <span className={`font-mono text-[9px] font-extrabold px-1 py-0.5 rounded ${badgeColorClass}`}>{badgeText}</span>
          </div>

          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 border border-slate-800 rounded-xl hover:bg-slate-900/50 hover:text-cyan-400 transition-all cursor-pointer text-slate-400"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Mobile Slide-out Drawer Menu */}
        <div 
          className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsOpen(false)}
        />

        <aside 
          className={`fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800/80 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out transform lg:hidden ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <Shield className={`h-5 w-5 ${iconColorClass} ${isAdmin ? "animate-pulse" : ""}`} />
                <span className="font-outfit font-bold tracking-wider text-sm">{brandText}</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-cyan-400 text-slate-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Items */}
            <SidebarNav role={session.user.role} />
          </div>

          {/* User profile & Log Out in drawer */}
          <div className="p-4 border-t border-slate-900 bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-slate-800 rounded-lg p-2 text-slate-300 shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-200 truncate">{session.user.name}</p>
                  <span className={`font-mono text-[9px] font-bold uppercase tracking-widest px-1 rounded border ${isAdmin ? "text-rose-400 border-rose-900/40 bg-rose-950/30" : "text-cyan-400/80 border-cyan-900/40 bg-cyan-950/30"}`}>
                    {session.user.role}
                  </span>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <SignOutButton />
          </div>
        </aside>

        {/* Development Mode fallback banner */}
        {isSqlite && (
          <div className="bg-amber-955/30 border-b border-amber-800/20 px-4 sm:px-6 md:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-amber-400 text-xs font-mono gap-2 w-full">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <span><strong>DEV MODE:</strong> Local SQLite fallback is active because MySQL is unreachable. Logins, scans, and audits persist in SQLite.</span>
            </div>
            <span className="bg-amber-900/30 border border-amber-800/45 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider w-fit shrink-0">SQLite Local</span>
          </div>
        )}

        {/* Page Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
