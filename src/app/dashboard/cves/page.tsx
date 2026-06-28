"use client";

import { useState, useEffect } from "react";
import { 
  Lock, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

export default function CveDatabasePage() {
  const [cves, setCves] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCves = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/cves?q=${encodeURIComponent(search)}&severity=${severity}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setCves(data.cves || []);
      } else {
        throw new Error(data.error || "Failed to query CVE database.");
      }
    } catch (e: any) {
      console.error("Failed to query CVE entries:", e);
      setError(e.message || "Failed to query CVE entries.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCves();
  }, [severity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCves();
  };

  const getSeverityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return 'bg-red-950/30 border-red-900/50 text-red-400';
      case 'high': return 'bg-rose-950/30 border-rose-900/50 text-rose-400';
      case 'medium': return 'bg-amber-950/30 border-amber-900/50 text-amber-400';
      default: return 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400';
    }
  };

  const filterOptions = [
    { label: 'All Severities', value: 'all' },
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white">Vulnerability Database</h1>
        <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">CVE Search Engine & Mitigations</p>
      </div>

      {/* Search & Filter Options */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 glow-blue shrink-0">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search CVE ID or description (e.g. Log4j, Heartbleed)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
          >
            Query
          </button>
        </form>

        <div className="flex gap-1.5 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSeverity(opt.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                severity === opt.value
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold"
                  : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex gap-2 items-center">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span>Error: {error}. Please verify server availability.</span>
        </div>
      )}

      {/* CVE Listing */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : cves.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
          <AlertCircle className="h-8 w-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">No matching vulnerabilities resolved</p>
        </div>
      ) : (
        <div className="space-y-6">
          {cves.map((cve) => (
            <div key={cve.id || cve._id} className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700/80 transition-all">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-slate-400">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold tracking-wider font-mono text-white select-all">{cve.cveId}</h3>
                    <span className="text-[9px] text-slate-500 font-mono">Published Disclosure Record</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider font-mono shrink-0 ${getSeverityColor(cve.severity)}`}>
                  {cve.severity}
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1 font-sans text-xs">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">Description</span>
                <p className="text-slate-300 leading-relaxed font-normal">{cve.description}</p>
              </div>

              {/* Mitigation */}
              <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Mitigation Remediation</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">{cve.mitigation}</p>
              </div>

              {/* References */}
              {cve.references && cve.references.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">References</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono">
                    {cve.references.map((ref: string, rIdx: number) => (
                      <a 
                        key={rIdx}
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400/80 hover:text-cyan-400 flex items-center gap-1 hover:underline"
                      >
                        Source Link <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
