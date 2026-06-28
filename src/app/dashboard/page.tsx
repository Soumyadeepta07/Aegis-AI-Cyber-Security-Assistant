"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Shield, 
  Search, 
  Globe, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Activity, 
  ArrowRight,
  RefreshCw,
  Terminal,
  ShieldCheck,
  TrendingUp,
  Cpu
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface Stats {
  totalScans: number;
  threatsDetected: number;
  safeScans: number;
  suspiciousScans: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalScans: 0,
    threatsDetected: 0,
    safeScans: 0,
    suspiciousScans: 0
  });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Fetch scan history
      const historyRes = await fetch("/api/scan/history");
      if (!historyRes.ok) {
        throw new Error(`Server returned status ${historyRes.status}`);
      }
      const historyData = await historyRes.json();
      
      let allScans = [];
      if (historyData.success) {
        allScans = historyData.scans || [];
        setRecentScans(allScans.slice(0, 5)); // Show 5 most recent
      }

      // Compute statistics based on scans
      const total = allScans.length;
      const dangerous = allScans.filter((s: any) => s.status === 'dangerous').length;
      const suspicious = allScans.filter((s: any) => s.status === 'suspicious').length;
      const safe = allScans.filter((s: any) => s.status === 'safe').length;

      setStats({
        totalScans: total,
        threatsDetected: dangerous,
        safeScans: safe,
        suspiciousScans: suspicious
      });

      // Generate chart data based on day of scans, or default if none
      if (allScans.length > 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const counts: Record<string, { name: string; safe: number; suspicious: number; dangerous: number }> = {};
        
        // Prep last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayLabel = days[date.getDay()];
          counts[dayLabel] = { name: dayLabel, safe: 0, suspicious: 0, dangerous: 0 };
        }

        allScans.forEach((s: any) => {
          const scanDate = new Date(s.createdAt);
          const dayLabel = days[scanDate.getDay()];
          if (counts[dayLabel]) {
            if (s.status === 'safe') counts[dayLabel].safe++;
            else if (s.status === 'suspicious') counts[dayLabel].suspicious++;
            else if (s.status === 'dangerous') counts[dayLabel].dangerous++;
          }
        });

        setChartData(Object.values(counts));
      } else {
        // Fallback placeholder chart data
        setChartData([
          { name: "Mon", safe: 0, suspicious: 0, dangerous: 0 },
          { name: "Tue", safe: 0, suspicious: 0, dangerous: 0 },
          { name: "Wed", safe: 0, suspicious: 0, dangerous: 0 },
          { name: "Thu", safe: 0, suspicious: 0, dangerous: 0 },
          { name: "Fri", safe: 0, suspicious: 0, dangerous: 0 },
          { name: "Sat", safe: 0, suspicious: 0, dangerous: 0 },
          { name: "Sun", safe: 0, suspicious: 0, dangerous: 0 },
        ]);
      }
    } catch (e: any) {
      console.error("Failed to load dashboard statistics:", e);
      setError(e.message || "Failed to load dashboard statistics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute calculated risk score
  const scoreFactor = stats.totalScans > 0 
    ? Math.round(100 - ((stats.threatsDetected * 1.0 + stats.suspiciousScans * 0.4) / stats.totalScans) * 100)
    : 100;

  const getScoreRating = (score: number) => {
    if (score >= 85) return { text: "Excellent", color: "text-emerald-400", border: "border-emerald-500/30" };
    if (score >= 60) return { text: "Moderate", color: "text-amber-400", border: "border-amber-500/30" };
    return { text: "Critical Risk", color: "text-rose-400", border: "border-rose-500/30" };
  };

  const scoreRating = getScoreRating(scoreFactor);

  const threatFeed = [
    { id: 1, text: "Active Zero-Day exploit (CVE-2026-1182) identified in popular SSL appliances. Immediate patching advised.", type: "critical", time: "10m ago" },
    { id: 2, text: "New phishing variant detected mimicking Microsoft Admin portal redirection techniques.", type: "high", time: "1h ago" },
    { id: 3, text: "Credential stuffing campaign targeted against standard web applications using cloud VPS nodes.", type: "medium", time: "4h ago" },
  ];

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white">System Security Operations</h1>
          <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">Aegis SOC Control Console</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 bg-slate-900/40 text-xs font-semibold rounded-lg hover:text-cyan-400 hover:border-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Sync Console
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex gap-2 items-center">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span>Error loading security console data: {error}. Check connection or database configurations.</span>
        </div>
      )}

      {isLoading ? (
        // Loading Skeletons
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/40 border border-slate-800 rounded-2xl" />
          ))}
          <div className="md:col-span-3 h-80 bg-slate-900/40 border border-slate-800 rounded-2xl" />
          <div className="h-80 bg-slate-900/40 border border-slate-800 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">Total Analysed</span>
                <Activity className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-100">{stats.totalScans}</span>
                <span className="text-[10px] text-slate-500 font-mono">scans</span>
              </div>
            </div>

            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">Threats Flagged</span>
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-rose-400">{stats.threatsDetected}</span>
                <span className="text-[10px] text-rose-500 font-mono">malicious</span>
              </div>
            </div>

            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">Suspicious Leads</span>
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-amber-400">{stats.suspiciousScans}</span>
                <span className="text-[10px] text-slate-500 font-mono">warnings</span>
              </div>
            </div>

            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-28">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">Safe Endpoints</span>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-emerald-400">{stats.safeScans}</span>
                <span className="text-[10px] text-slate-500 font-mono">resolved</span>
              </div>
            </div>
          </div>

          {/* Analytics Area Chart & Security Score Meter */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between h-80">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-outfit font-bold text-sm text-slate-200">Threat Ingestion Rate</h3>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">7-Day Incident Frequency</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Safe</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Warning</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Threat</span>
                </div>
              </div>
              <div className="flex-1 min-h-0 w-full font-mono text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDangerous" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                    <XAxis dataKey="name" stroke="#475569" />
                    <YAxis stroke="#475569" allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d1a', borderColor: '#1e293b', color: '#f8fafc' }} />
                    <Area type="monotone" dataKey="safe" stroke="#10b981" fillOpacity={1} fill="url(#colorSafe)" />
                    <Area type="monotone" dataKey="dangerous" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDangerous)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score Meter */}
            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between items-center text-center h-80">
              <div className="w-full text-left">
                <h3 className="font-outfit font-bold text-sm text-slate-200">Defensive Rating</h3>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Aggregate Threat Shield</p>
              </div>

              {/* Radial Score Gauge */}
              <div className="relative flex items-center justify-center my-4">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#070d1e"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke={scoreFactor >= 85 ? "#10b981" : scoreFactor >= 60 ? "#f59e0b" : "#f43f5e"}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - scoreFactor / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white font-mono">{scoreFactor}%</span>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Shield Level</span>
                </div>
              </div>

              <div className="w-full">
                <div className={`text-xs font-mono font-bold uppercase tracking-wider ${scoreRating.color}`}>
                  Status: {scoreRating.text}
                </div>
                <p className="text-slate-500 text-[10px] mt-1 px-4 leading-relaxed">
                  Calculated based on threat detection ratio and overall clean scans.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Recent Activity, Threat Feed & Security Tips */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity Logs */}
            <div className="lg:col-span-2 bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <div>
                  <h3 className="font-outfit font-bold text-sm text-slate-200">Incident Logs</h3>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Recent Threat Scan History</p>
                </div>
                <Link href="/dashboard/history" className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1">
                  View All Log History <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {recentScans.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  No scan records captured yet. Initiate a scan to view logs.
                </div>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  {recentScans.map((scan) => (
                    <div key={scan.id || scan._id} className="p-3 bg-slate-950/60 border border-slate-900 hover:border-slate-800/80 rounded-xl flex items-center justify-between gap-4 transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-1.5 rounded-lg border shrink-0 ${
                          scan.type === 'url' ? 'bg-cyan-950/40 border-cyan-900/60 text-cyan-400' :
                          scan.type === 'domain' ? 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400' :
                          scan.type === 'file' ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' :
                          'bg-amber-950/40 border-amber-900/60 text-amber-400'
                        }`}>
                          {scan.type === 'url' && <Search className="h-3.5 w-3.5" />}
                          {scan.type === 'domain' && <Globe className="h-3.5 w-3.5" />}
                          {scan.type === 'file' && <FileText className="h-3.5 w-3.5" />}
                          {scan.type === 'audit' && <ShieldCheck className="h-3.5 w-3.5" />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-slate-200 font-semibold truncate break-all">{scan.target}</p>
                          <span className="text-[9px] text-slate-500">
                            {new Date(scan.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          scan.status === 'dangerous' ? 'bg-rose-950/30 border-rose-900/50 text-rose-400' :
                          scan.status === 'suspicious' ? 'bg-amber-950/30 border-amber-900/50 text-amber-400' :
                          'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
                        }`}>
                          {scan.status}
                        </span>
                        <span className="text-[10px] text-slate-500 w-12 text-right">{scan.threatScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar widgets: Threat Feed & Tips */}
            <div className="space-y-6">
              {/* Threat Feed */}
              <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="font-outfit font-bold text-sm text-slate-200">Global Threat Intel Feed</h3>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Real-time Cyber Disclosures</p>
                </div>
                <div className="space-y-3 font-mono text-[11px] leading-relaxed text-slate-400">
                  {threatFeed.map((feed) => (
                    <div key={feed.id} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-wider">
                        <span className={`font-bold ${
                          feed.type === 'critical' ? 'text-rose-400' : 'text-amber-400'
                        }`}>{feed.type}</span>
                        <span className="text-slate-600">{feed.time}</span>
                      </div>
                      <p className="text-slate-300">{feed.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Tips */}
              <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Cpu className="h-4 w-4" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider">Defensive Recommendation</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Configure strong **Content Security Policies (CSP)** on production servers. Strip response headers like **Server** and **X-Powered-By** to limit information disclosure to reconnaissance crawlers.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
