"use client";

import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error("Sign out error:", e);
      // Hard fallback: trigger clear cookie via backend route if needed,
      // but in mock mode signOut does it automatically
      router.push('/login');
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/40 transition-all text-xs font-semibold cursor-pointer"
    >
      <LogOut className="h-4 w-4" />
      {isSigningOut ? "Signing Out..." : "Terminate Session"}
    </button>
  );
}
