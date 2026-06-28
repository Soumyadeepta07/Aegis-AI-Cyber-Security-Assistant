"use client";

import { useState } from "react";
import { 
  ShieldAlert, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Server,
  ArrowRight,
  TrendingUp,
  Fingerprint
} from "lucide-react";

export default function UrlScannerPage() {
  const [urlInput, setUrlInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    setIsScanning(true);
    setError("");
    setScanResult(null);

    try {
      const response = await fetch("/api/scan/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await response.json();
      if (data.success) {
        setScanResult(data);
      } else {
        setError(data.error || "Failed to scan URL. Please verify format.");
      }
    } catch (err) {
      setError("Unable to contact threat intelligence network.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white">URL Threat Scanning</h1>
        <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">Aegis Phishing & Link Reputations</p>
      </div>

      {/* Scan Input Card */}
      <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 glow-blue">
        <form onSubmit={handleScan} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Enter suspicious link (e.g. paypal.com or http://unverified-domain.net)..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
              disabled={isScanning}
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !urlInput}
            className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/10 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {isScanning ? "Scanning..." : "Execute Scan"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex gap-2 items-center">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Progress Skeleton */}
      {isScanning && (
        <div className="bg-[#0b1329]/40 border border-slate-800 rounded-2xl p-8 space-y-6 scan-animation">
          <div className="h-4 bg-slate-850 rounded w-1/3 animate-pulse" />
          <div className="space-y-3">
            <div className="h-3 bg-slate-850 rounded w-full animate-pulse" />
            <div className="h-3 bg-slate-850 rounded w-5/6 animate-pulse" />
            <div className="h-3 bg-slate-850 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* Idle Intro State */}
      {!scanResult && !isScanning && (
        <div className="bg-[#0b1329]/30 border border-slate-850 rounded-2xl p-8 text-center space-y-4">
          <Fingerprint className="h-10 w-10 text-cyan-500/50 mx-auto animate-pulse" />
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-outfit font-bold text-sm text-slate-350">Threat Scan Console Idle</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Enter any external URL link or hostname in the scanner input box above. Aegis will query multi-engine reputation databases and provide a real-time danger rating.
            </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {scanResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Threat Meter Card */}
          <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between items-center text-center">
            <div className="w-full text-left">
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">Analysis Outcome</span>
            </div>

            <div className="my-6 space-y-2">
              <div className={`text-4xl font-extrabold font-mono ${
                scanResult.scan.status === 'dangerous' ? 'text-rose-400' :
                scanResult.scan.status === 'suspicious' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {scanResult.scan.threatScore}%
              </div>
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block">Threat Score</span>
            </div>

            <div className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold uppercase tracking-wider ${
              scanResult.scan.status === 'dangerous' ? 'bg-rose-950/30 border-rose-900/50 text-rose-400' :
              scanResult.scan.status === 'suspicious' ? 'bg-amber-950/30 border-amber-900/50 text-amber-400' :
              'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
            }`}>
              {scanResult.scan.status}
            </div>
          </div>

          {/* Details & Heuristics */}
          <div className="md:col-span-2 bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-900 pb-3">
              <h3 className="font-outfit font-bold text-sm text-slate-200">Incident Details</h3>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Structural Analysis & Heuristics</p>
            </div>

            <div className="space-y-4 font-mono text-xs text-slate-300">
              <div className="grid grid-cols-3 gap-2 border-b border-slate-900 pb-2.5">
                <span className="text-slate-500 uppercase">Target Link:</span>
                <span className="col-span-2 text-slate-200 break-all select-all">{scanResult.scan.target}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 border-b border-slate-900 pb-2.5">
                <span className="text-slate-500 uppercase">Registry Status:</span>
                <span className="col-span-2 text-slate-200 flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5 text-cyan-400" />
                  {scanResult.details?.safeBrowsing?.isMalicious ? "Flagged on Blacklist" : "Clean database record"}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-slate-500 uppercase font-bold block">Threat Explanation:</span>
                <p className="text-slate-400 leading-relaxed font-sans text-sm">
                  {scanResult.scan.explanation}
                </p>
              </div>
            </div>

            {/* AI Security Recommendations */}
            <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Info className="h-4 w-4" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">AI Recommendations</span>
              </div>
              <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 font-sans">
                {scanResult.scan.status === 'dangerous' ? (
                  <>
                    <li>Do **NOT** click links or input password credentials on this site.</li>
                    <li>Add this domain to firewall blacklists or internal DNS blockers.</li>
                    <li>If credentials were submitted, initiate credential revocation workflows immediately.</li>
                  </>
                ) : scanResult.scan.status === 'suspicious' ? (
                  <>
                    <li>Exercise caution; verify domain age and certificate validity before interaction.</li>
                    <li>Inspect the site for dynamic redirect loops or hidden iframe assets.</li>
                    <li>Do not execute browser extensions or download binary archives from this endpoint.</li>
                  </>
                ) : (
                  <>
                    <li>No active threats observed. The link matches normal public navigation profiles.</li>
                    <li>Standard SSL handshake validated. Secure navigation can proceed.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
