"use client";

import { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  RefreshCw,
  Globe,
  FileText,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileCode
} from "lucide-react";

export default function HistoryPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [expandedFindingIndex, setExpandedFindingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/scan/history?type=${type}&status=${status}&q=${encodeURIComponent(search)}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setScans(data.scans || []);
      } else {
        throw new Error(data.error || "Failed to fetch scan logs.");
      }
    } catch (e: any) {
      console.error("Failed to fetch scan history logs:", e);
      setError(e.message || "Failed to fetch scan history logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [type, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDeleteScan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scan entry from your logs?")) return;
    setError("");

    try {
      const response = await fetch(`/api/scan/history?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setScans(prev => prev.filter(s => (s.id || s._id) !== id));
        if (selectedScan && (selectedScan.id === id || selectedScan._id === id)) {
          setSelectedScan(null);
          setExpandedFindingIndex(null);
        }
      } else {
        throw new Error(data.error || "Failed to delete scan log.");
      }
    } catch (e: any) {
      console.error("Failed to delete scan entry:", e);
      setError(e.message || "Failed to delete scan entry.");
    }
  };

  const getStatusColor = (stat: string) => {
    switch (stat.toLowerCase()) {
      case 'dangerous': return 'bg-rose-950/30 border-rose-900/50 text-rose-400';
      case 'suspicious': return 'bg-amber-950/30 border-amber-900/50 text-amber-400';
      default: return 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white">Scan History Logs</h1>
          <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">Historical SOC Scans and Threat Records</p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 bg-slate-900/40 text-xs font-semibold rounded-lg hover:text-cyan-400 hover:border-cyan-500/20 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Logs
        </button>
      </div>

      {/* Filters HUD */}
      <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 glow-blue flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-1/3 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-650 focus:outline-none focus:border-cyan-500/50 transition-all font-mono text-xs"
            />
          </div>
          <button type="submit" className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer flex items-center justify-center shrink-0">
            Search
          </button>
        </form>

        <div className="flex gap-4 items-center font-mono text-xs w-full md:w-auto flex-wrap justify-between sm:justify-start">
          {/* Scan Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase text-[10px]">Type:</span>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 focus:outline-none"
            >
              <option value="all">ALL</option>
              <option value="url">URL</option>
              <option value="domain">DOMAIN</option>
              <option value="file">FILE</option>
              <option value="audit">AUDIT</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase text-[10px]">Status:</span>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 focus:outline-none"
            >
              <option value="all">ALL</option>
              <option value="safe">SAFE</option>
              <option value="suspicious">SUSPICIOUS</option>
              <option value="dangerous">DANGEROUS</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex gap-2 items-center">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scans List */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : scans.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-950/10">
              <AlertCircle className="h-8 w-8 text-slate-650 mx-auto mb-2" />
              <p className="text-slate-500 text-xs font-mono uppercase tracking-wider">No historic scan logs registered</p>
            </div>
          ) : (
            scans.map((scan) => (
              <div 
                key={scan.id || scan._id} 
                onClick={() => { setSelectedScan(scan); setExpandedFindingIndex(null); }}
                className={`p-4 bg-slate-900/30 border rounded-xl flex items-center justify-between gap-4 hover:border-slate-700/80 hover:bg-slate-900/50 transition-all font-mono text-xs cursor-pointer ${
                  selectedScan && (selectedScan.id === scan.id || selectedScan._id === scan._id)
                    ? "border-cyan-500/30 bg-slate-900/60"
                    : "border-slate-850"
                }`}
              >
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
                    <span className="text-[9px] text-slate-500 block">
                      {new Date(scan.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusColor(scan.status)}`}>
                    {scan.status}
                  </span>
                  <button
                    onClick={() => handleDeleteScan(scan.id || scan._id)}
                    className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Scan Info Panel */}
        <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 h-fit space-y-4">
          <div className="border-b border-slate-900 pb-3">
            <h3 className="font-outfit font-bold text-sm text-slate-200">Incident Inspection</h3>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Metadata Log Audit</p>
          </div>

          {selectedScan ? (
            <div className="space-y-4 font-mono text-xs leading-relaxed text-slate-300">
              <div className="space-y-1">
                <span className="text-slate-500 uppercase block font-bold text-[9px] tracking-wider">Log Reference ID</span>
                <span className="text-slate-200 select-all">{selectedScan.id || selectedScan._id}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase block font-bold text-[9px] tracking-wider">Target Endpoint</span>
                <span className="text-slate-200 break-all select-all">{selectedScan.target}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <span className="text-slate-500 uppercase block font-bold text-[9px] tracking-wider">Scan Category</span>
                  <span className="text-cyan-400 font-bold uppercase">{selectedScan.type}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 uppercase block font-bold text-[9px] tracking-wider">Danger Rating</span>
                  <span className="text-slate-200 font-bold">{selectedScan.threatScore}%</span>
                </div>
              </div>

              {selectedScan.type === 'audit' && selectedScan.securityReport ? (() => {
                let parsedHeaders: Record<string, string> = {};
                let parsedFindings: any[] = [];
                try {
                  parsedHeaders = typeof selectedScan.securityReport.headers === 'string'
                    ? JSON.parse(selectedScan.securityReport.headers)
                    : selectedScan.securityReport.headers || {};
                } catch (e) {
                  console.error("Error parsing headers", e);
                }
                try {
                  parsedFindings = typeof selectedScan.securityReport.findings === 'string'
                    ? JSON.parse(selectedScan.securityReport.findings)
                    : selectedScan.securityReport.findings || [];
                } catch (e) {
                  console.error("Error parsing findings", e);
                }

                return (
                  <div className="space-y-4 pt-3 border-t border-slate-900">
                    <div className="grid grid-cols-2 gap-2 bg-[#090f1d] p-3 rounded-xl border border-slate-900">
                      <div>
                        <span className="text-slate-500 uppercase block font-bold text-[8px] tracking-wider font-mono">Security Score</span>
                        <span className={`text-sm font-extrabold ${
                          selectedScan.securityReport.securityScore >= 85 ? 'text-emerald-400' :
                          selectedScan.securityReport.securityScore >= 60 ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>{selectedScan.securityReport.securityScore}/100</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase block font-bold text-[8px] tracking-wider font-mono">Threat Level</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          selectedScan.securityReport.threatLevel === 'dangerous' ? 'text-rose-400' :
                          selectedScan.securityReport.threatLevel === 'suspicious' ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>{selectedScan.securityReport.threatLevel}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 uppercase block font-bold text-[9px] tracking-wider">Executive Summary</span>
                      <p className="text-slate-400 font-sans text-xs leading-relaxed">{selectedScan.securityReport.summary || selectedScan.explanation}</p>
                    </div>

                    {/* Findings list */}
                    <div className="space-y-2">
                      <span className="text-slate-500 uppercase block font-bold text-[9px] tracking-wider border-b border-slate-900 pb-1">Vulnerability Findings ({parsedFindings.length})</span>
                      {parsedFindings.length === 0 ? (
                        <p className="text-slate-500 italic text-[11px]">No vulnerability findings recorded.</p>
                      ) : (
                        <div className="space-y-2">
                          {parsedFindings.map((finding: any, idx: number) => {
                            const isExpanded = expandedFindingIndex === idx;
                            return (
                              <div key={idx} className="border border-slate-800 bg-[#090f1d]/50 rounded-xl overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => setExpandedFindingIndex(isExpanded ? null : idx)}
                                  className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-900/30 transition-all font-mono text-[11px] cursor-pointer animate-none"
                                >
                                  <div className="font-outfit font-semibold text-slate-200 truncate pr-2">
                                    {finding.findingTitle}
                                  </div>
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-500 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
                                </button>

                                {isExpanded && (
                                  <div className="p-3 border-t border-slate-900 space-y-3 text-[11px] text-slate-350">
                                    <div className="flex items-center justify-between">
                                      <span className="text-cyan-400 font-semibold uppercase text-[8px] tracking-wide">{finding.owaspCategory}</span>
                                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                        finding.confidence === 'High Confidence' ? 'bg-emerald-950/20 border-emerald-900/55 text-emerald-400' :
                                        finding.confidence === 'Medium Confidence' ? 'bg-amber-950/20 border-amber-900/55 text-amber-400' :
                                        'bg-orange-950/20 border-orange-900/55 text-orange-400'
                                      }`}>{finding.confidence || 'High Confidence'}</span>
                                    </div>

                                    {/* Inspected Evidence Block */}
                                    <div className="space-y-1.5 p-2.5 bg-slate-950 border border-slate-900 rounded-lg">
                                      <span className="text-amber-400 uppercase block font-bold text-[8px] tracking-wider">Inspected Evidence (Evidence Mode)</span>
                                      <div>
                                        <span className="text-slate-500 text-[8px] uppercase font-semibold">Header Name</span>
                                        <code className="text-slate-200 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 block mt-0.5 select-all">{finding.evidenceHeader}</code>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 text-[8px] uppercase font-semibold">Header Value</span>
                                        <code className="text-rose-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 block mt-0.5 break-all select-all">{finding.evidenceValue || "Absent / Not Detected"}</code>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 text-[8px] uppercase font-semibold">Inspection Reason</span>
                                        <p className="text-slate-300 font-sans text-[11px] leading-relaxed mt-0.5">{finding.evidenceReason}</p>
                                      </div>
                                    </div>

                                    <div className="space-y-0.5">
                                      <span className="text-slate-500 uppercase block font-bold text-[8px] tracking-wider font-mono">Threat Explanation</span>
                                      <p className="text-slate-400 font-sans text-[11px] leading-relaxed">{finding.threatExplanation}</p>
                                    </div>
                                    <div className="space-y-0.5 p-2 bg-slate-950 border border-slate-900 rounded-lg">
                                      <span className="text-emerald-400 uppercase block font-bold text-[8px] tracking-wider">Remediation Guide</span>
                                      <p className="text-slate-350 font-sans text-[11px] leading-relaxed">{finding.remediationSteps}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Raw Headers Dump */}
                    <div className="space-y-2 border-t border-slate-900 pt-3">
                      <div className="flex items-center gap-1.5">
                        <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-slate-500 uppercase block font-bold text-[9px] tracking-wider font-mono">Raw Audited HTTP Headers</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 font-mono text-[10px] text-slate-400 space-y-1 overflow-x-auto leading-relaxed max-h-52 overflow-y-auto">
                        {Object.entries(parsedHeaders).length === 0 ? (
                          <div className="text-slate-650 italic">No raw headers logged.</div>
                        ) : (
                          Object.entries(parsedHeaders).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="text-cyan-400/80 font-bold shrink-0">{key}:</span>
                              <span className="text-slate-300 break-all select-all">{value}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="space-y-1 border-t border-slate-900 pt-3">
                  <span className="text-slate-500 uppercase block font-bold text-[9px] tracking-wider font-mono">Incident Summary</span>
                  <p className="text-slate-400 font-sans text-xs leading-relaxed">{selectedScan.explanation}</p>
                  {selectedScan.type === 'audit' && (
                    <div className="text-[10px] text-amber-500 italic mt-2">
                      * Detailed security audit findings and raw headers are not available for this record.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-650 text-xs font-mono">
              Select an incident from the log list to inspect metadata details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
