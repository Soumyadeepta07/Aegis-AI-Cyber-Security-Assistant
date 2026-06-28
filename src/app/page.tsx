"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Shield, 
  Terminal, 
  Search, 
  Globe, 
  FileText, 
  Activity, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Lock
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
  const [quickUrl, setQuickUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [quickResult, setQuickResult] = useState<any>(null);

  const handleQuickScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl) return;

    setIsScanning(true);
    setQuickResult(null);

    try {
      const response = await fetch("/api/scan/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: quickUrl }),
      });
      const data = await response.json();
      if (data.success) {
        setQuickResult(data.scan);
      } else {
        setQuickResult({ error: data.error || "Analysis failed" });
      }
    } catch (err) {
      setQuickResult({ error: "Failed to connect to scanner API" });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Cyber Grid Lines overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%)] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20 text-cyan-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="font-outfit font-bold text-lg tracking-wider text-slate-100">AEGIS</span>
              <span className="text-cyan-400 font-mono text-xs ml-1.5 uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/40">AI</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors">
              Login
            </Link>
            <Link href="/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium text-sm transition-all shadow-md shadow-cyan-500/10">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center justify-center relative z-10">
        <div className="text-center max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider">
            <Activity className="h-3.5 w-3.5 animate-pulse" /> Threat Intelligence Powered By Gemini AI
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold font-outfit tracking-tight text-white leading-none">
            Next-Gen AI <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
              Cyber Security Assistant
            </span>
          </h1>
          
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-normal">
            Analyze malicious URLs, detect domain fraud, inspect suspicious files, and run automated website security audits mapped to OWASP Top 10 categories.
          </p>
        </div>

        {/* Live Scan Console Demonstration */}
        <div className="w-full max-w-2xl mt-12 bg-slate-900/40 border border-cyan-500/10 rounded-2xl p-6 glow-blue backdrop-blur-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">Live Scanner Sandbox</span>
            </div>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <form onSubmit={handleQuickScan} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter suspicious URL (e.g. paypal-login-verify.com)..."
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isScanning}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm hover:bg-cyan-600 focus:outline-none disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              {isScanning ? (
                <>Scanning...</>
              ) : (
                <>Scan Now</>
              )}
            </button>
          </form>

          {/* Quick results panel */}
          {isScanning && (
            <div className="mt-4 p-4 rounded-xl border border-dashed border-cyan-500/20 bg-cyan-950/5 animate-pulse text-center">
              <span className="text-xs font-mono text-cyan-400">Auditing DNS Records, reputation checks, and header configurations...</span>
            </div>
          )}

          {quickResult && (
            <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-950/80 font-mono text-xs text-slate-300 space-y-2">
              {quickResult.error ? (
                <div className="text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Error: {quickResult.error}
                </div>
              ) : (
                <>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">TARGET:</span>
                    <span className="text-slate-200 break-all">{quickResult.target}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">THREAT STATUS:</span>
                    <span className={`font-bold ${
                      quickResult.status === 'dangerous' ? 'text-rose-400' :
                      quickResult.status === 'suspicious' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {quickResult.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">RISK SCORE:</span>
                    <span className="text-cyan-400 font-bold">{quickResult.threatScore}/100</span>
                  </div>
                  <div className="pt-2 text-slate-400 leading-relaxed text-xs">
                    <span className="text-slate-500 font-bold block mb-1">ANALYSIS SUMMARY:</span>
                    {quickResult.explanation}
                  </div>
                  <div className="pt-2 text-center text-cyan-500 font-semibold border-t border-slate-900 mt-2">
                    <Link href="/register" className="hover:underline inline-flex items-center gap-1">
                      Register to view full reports and unlock all features <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24">
          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 text-cyan-400 w-fit">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="font-outfit font-bold text-lg text-slate-100">URL & Domain Intel</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Verify links against VirusTotal, AbuseIPDB, and Google Safe Browsing. Resolve real-time DNS configuration mappings and SSL status.
            </p>
          </div>

          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-rose-400 w-fit">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-outfit font-bold text-lg text-slate-100">OWASP Website Audits</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Inspect application security headers, CORS structures, and cookie security flags. Review AI vulnerability maps aligned with the OWASP Top 10.
            </p>
          </div>

          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400 w-fit">
              <Terminal className="h-6 w-6" />
            </div>
            <h3 className="font-outfit font-bold text-lg text-slate-100">AI Advisor Chatbot</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Consult with Gemini AI in a sandbox CLI format. Get mitigations, vulnerability explanations, and network hardening strategies.
            </p>
          </div>
        </section>

        {/* Global Security Metrics Banner */}
        <div className="w-full mt-24 border-t border-b border-slate-800/80 py-8 bg-slate-950/20 flex flex-col md:flex-row justify-around gap-8 text-center font-mono">
          <div>
            <div className="text-3xl font-extrabold text-white">99.8%</div>
            <div className="text-slate-500 text-xs uppercase tracking-widest mt-1">Phishing Recall</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-cyan-400">100+</div>
            <div className="text-slate-500 text-xs uppercase tracking-widest mt-1">CVE Database Audits</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">&lt; 3.0s</div>
            <div className="text-slate-500 text-xs uppercase tracking-widest mt-1">Scan Latency</div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full mt-24 pt-8 border-t border-slate-900 text-center text-xs text-slate-600">
          &copy; 2026 Aegis Security AI. All rights reserved. Built as a showcase security operations center portfolio application.
        </footer>
      </main>
    </div>
  );
}
