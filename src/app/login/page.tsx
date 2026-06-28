"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, authClient } from "@/lib/auth-client";
import { Shield, Key, Mail, Lock, AlertTriangle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError("");

    try {
      await signIn.email({
        email,
        password,
      }, {
        onSuccess: async () => {
          const { data } = await authClient.getSession();
          if (data?.user?.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
          router.refresh();
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Failed to sign in. Please check your credentials.");
          setIsLoading(false);
        }
      });
    } catch (err: any) {
      console.error("LOGIN_ERROR:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen px-4 py-12 relative overflow-hidden bg-slate-950 cyber-grid">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20 text-cyan-400">
              <Shield className="h-6 w-6" />
            </div>
            <span className="font-outfit font-bold text-lg tracking-wider text-slate-100">AEGIS SOC</span>
          </Link>
          <h2 className="text-2xl font-bold font-outfit text-white">Access Dashboard Portal</h2>
          <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">Authentication Required</p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 glow-blue backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex gap-2 items-start font-mono">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Security Identifier (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-600" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@aicyber.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Access Code (Password)
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-600" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-md shadow-cyan-500/10 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isLoading ? "Validating Session..." : "Authorize Access"}
              {!isLoading && <ArrowRight className="h-4.5 w-4.5" />}
            </button>
          </form>

          {/* Quick info about demo login */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider mb-2">Demo Credentials</span>
              <div className="grid grid-cols-1 gap-2 text-[10px] font-mono">
                <button 
                  type="button" 
                  onClick={() => { setEmail("user@aicyber.com"); setPassword("password123"); }}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-cyan-400/80 hover:text-cyan-400 transition-colors"
                >
                  USER: user@aicyber.com
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="text-center font-mono text-xs text-slate-500">
          Need a security clearance?{" "}
          <Link href="/register" className="text-cyan-400 hover:underline">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
}
