"use client";

import { useState } from "react";
import { 
  Globe, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  ShieldAlert,
  Server,
  FileCode,
  Network
} from "lucide-react";

export default function DomainIntelPage() {
  const [domainInput, setDomainInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput) return;

    setIsScanning(true);
    setError("");
    setScanResult(null);

    try {
      const response = await fetch("/api/scan/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput }),
      });
      const data = await response.json();
      if (data.success) {
        setScanResult(data);
      } else {
        setError(data.error || "Failed to analyze domain. Please check spelling.");
      }
    } catch (err) {
      setError("Unable to connect to domain resolution API.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white">Domain Intelligence</h1>
        <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">DNS, Registrar, & SSL Reputation checks</p>
      </div>

      {/* Input Form */}
      <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 glow-blue">
        <form onSubmit={handleScan} className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Enter domain name (e.g. github.com or malicious-site.net)..."
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
              disabled={isScanning}
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !domainInput}
            className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/10 disabled:opacity-50 cursor-pointer"
          >
            {isScanning ? "Resolving..." : "Analyze Domain"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex gap-2 items-center">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Progress Animation */}
      {isScanning && (
        <div className="bg-[#0b1329]/40 border border-slate-800 rounded-2xl p-8 space-y-6 scan-animation">
          <div className="h-4 bg-slate-850 rounded w-1/4 animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-slate-850 rounded animate-pulse" />
            <div className="h-20 bg-slate-850 rounded animate-pulse" />
          </div>
        </div>
      )}

      {/* Idle Intro State */}
      {!scanResult && !isScanning && (
        <div className="bg-[#0b1329]/30 border border-slate-850 rounded-2xl p-8 text-center space-y-4">
          <Globe className="h-10 w-10 text-cyan-500/50 mx-auto animate-pulse" />
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-outfit font-bold text-sm text-slate-350">Domain Intelligence Panel Idle</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Enter any domain name (e.g. `google.com`) in the input box above. Aegis will query DNS records, registrar records, security configurations (SPF, DMARC, DNSSEC) and resolve its SSL handshake details.
            </p>
          </div>
        </div>
      )}

      {/* Results panel */}
      {scanResult && (
        <div className="space-y-6">
          {/* Top Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 text-cyan-400">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Domain Age</span>
                <span className="text-sm font-bold text-slate-200">{scanResult.details.age}</span>
              </div>
            </div>

            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Registrar</span>
                <span className="text-sm font-bold text-slate-200 truncate max-w-[180px] block">{scanResult.details.registrar}</span>
              </div>
            </div>

            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl border ${
                scanResult.scan.status === 'dangerous' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                scanResult.scan.status === 'suspicious' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Trust Score</span>
                <span className={`text-sm font-bold ${
                  scanResult.scan.status === 'dangerous' ? 'text-rose-400' :
                  scanResult.scan.status === 'suspicious' ? 'text-amber-400' : 'text-emerald-400'
                }`}>{scanResult.details.reputationScore}/100</span>
              </div>
            </div>
          </div>

          {/* DNS Records & SSL Certificate details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DNS Records */}
            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Network className="h-4 w-4 text-cyan-400" />
                <h3 className="font-outfit font-bold text-sm text-slate-200">DNS Zone Map</h3>
              </div>

              <div className="space-y-3 font-mono text-[11px]">
                {Object.entries(scanResult.details.dnsRecords || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1">
                    <span className="text-[9px] text-cyan-400/80 font-bold uppercase tracking-wider block">{key} Record</span>
                    <div className="space-y-0.5 text-slate-300">
                      {Array.isArray(value) && value.length > 0 ? (
                        value.map((rec: string, i: number) => <div key={i} className="break-all">{rec}</div>)
                      ) : (
                        <span className="text-slate-600">No records found</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SSL & Config Panel */}
            <div className="space-y-6">
              {/* SSL details */}
              <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                  <FileCode className="h-4 w-4 text-cyan-400" />
                  <h3 className="font-outfit font-bold text-sm text-slate-200">SSL Certificate Status</h3>
                </div>

                <div className="space-y-3 font-mono text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500 uppercase">Issuer O/CN:</span>
                    <span className="text-slate-200">{scanResult.details.sslCertInfo.issuer || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500 uppercase">Valid From:</span>
                    <span className="text-slate-200">
                      {scanResult.details.sslCertInfo.validFrom ? new Date(scanResult.details.sslCertInfo.validFrom).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500 uppercase">Valid To:</span>
                    <span className="text-slate-200">
                      {scanResult.details.sslCertInfo.validTo ? new Date(scanResult.details.sslCertInfo.validTo).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-500 uppercase">Status:</span>
                    <span className="flex items-center gap-1">
                      {scanResult.details.sslCertInfo.expired === false ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Active / Secure</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                          <span className="text-rose-400 font-bold">Expired / Invalid</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardening Configurations */}
              <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                  <Globe className="h-4 w-4 text-cyan-400" />
                  <h3 className="font-outfit font-bold text-sm text-slate-200">DNS Security Configuration</h3>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                  <div className={`p-3 border rounded-xl flex flex-col justify-between h-20 ${
                    scanResult.details.securityConfig.spf ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' : 'bg-rose-950/20 border-rose-900/50 text-rose-400'
                  }`}>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">SPF Record</span>
                    <span className="font-bold text-xs">{scanResult.details.securityConfig.spf ? "CONFIGURED" : "MISSING"}</span>
                  </div>

                  <div className={`p-3 border rounded-xl flex flex-col justify-between h-20 ${
                    scanResult.details.securityConfig.dmarc ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' : 'bg-rose-950/20 border-rose-900/50 text-rose-400'
                  }`}>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">DMARC policy</span>
                    <span className="font-bold text-xs">{scanResult.details.securityConfig.dmarc ? "CONFIGURED" : "MISSING"}</span>
                  </div>

                  <div className={`p-3 border rounded-xl flex flex-col justify-between h-20 ${
                    scanResult.details.securityConfig.dnssec ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' : 'bg-rose-950/20 border-rose-900/50 text-rose-400'
                  }`}>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">DNSSEC</span>
                    <span className="font-bold text-xs">{scanResult.details.securityConfig.dnssec ? "ACTIVE" : "INACTIVE"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Security assessment block */}
          <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-3 font-sans">
            <div className="border-b border-slate-900 pb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-cyan-400" />
              <h3 className="font-outfit font-bold text-sm text-slate-200">Threat Explanation & Analysis</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {scanResult.scan.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
