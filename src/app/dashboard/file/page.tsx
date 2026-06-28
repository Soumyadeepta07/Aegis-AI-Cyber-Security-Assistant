"use client";

import { useState } from "react";
import { 
  FileText, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  ShieldAlert,
  Fingerprint,
  Info,
  Layers
} from "lucide-react";

export default function FileAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copiedText, setCopiedText] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setScanResult(null);
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsScanning(true);
    setError("");
    setScanResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/scan/file", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setScanResult(data);
      } else {
        setError(data.error || "Failed to analyze uploaded file.");
      }
    } catch (err) {
      setError("Failed to connect to file analysis socket.");
    } finally {
      setIsScanning(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(""), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white">File Signature Analyzer</h1>
        <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">Cryptographic Hashing & Extension Verification</p>
      </div>

      {/* Upload Console */}
      <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 glow-blue">
        <form onSubmit={handleScan} className="space-y-4">
          <div className="border border-dashed border-slate-800 hover:border-cyan-500/30 bg-slate-950/40 rounded-xl p-8 text-center transition-all relative flex flex-col items-center justify-center cursor-pointer">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isScanning}
            />
            <div className="bg-slate-900 p-3 rounded-full text-cyan-400 mb-3 border border-slate-800">
              <Upload className="h-6 w-6" />
            </div>
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200 break-all">{file.name}</p>
                <p className="text-[10px] font-mono text-slate-500 uppercase">
                  {(file.size / 1024).toFixed(1)} KB | {file.type || "Unknown type"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-slate-300">Drag & drop files or click to browse</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Supports PDF, DOCX, ZIP, EXE, APK (Max 10MB)</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isScanning || !file}
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-md shadow-cyan-500/10 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isScanning ? "Hashing & Analyzing..." : "Run File Analysis"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex gap-2 items-center">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Progress Overlay */}
      {isScanning && (
        <div className="bg-[#0b1329]/40 border border-slate-800 rounded-2xl p-8 space-y-6 scan-animation">
          <div className="h-4 bg-slate-850 rounded w-1/3 animate-pulse" />
          <div className="h-3 bg-slate-850 rounded w-full animate-pulse" />
          <div className="h-3 bg-slate-850 rounded w-5/6 animate-pulse" />
        </div>
      )}

      {/* Idle Intro State */}
      {!scanResult && !isScanning && (
        <div className="bg-[#0b1329]/30 border border-slate-850 rounded-2xl p-8 text-center space-y-4">
          <FileText className="h-10 w-10 text-cyan-500/50 mx-auto animate-pulse" />
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-outfit font-bold text-sm text-slate-350">File Reputation Analyzer Idle</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Drag & drop or select a file to upload. Aegis will compute MD5 and SHA-256 cryptographic signatures, analyze binary entropy, and verify if it matches known threat database indicators.
            </p>
          </div>
        </div>
      )}

      {/* Results panel */}
      {scanResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status Gauge */}
          <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between items-center text-center">
            <div className="w-full text-left">
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">File Reputation</span>
            </div>

            <div className="my-6 space-y-2">
              <div className={`text-4xl font-extrabold font-mono ${
                scanResult.scan.status === 'dangerous' ? 'text-rose-400' :
                scanResult.scan.status === 'suspicious' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {scanResult.scan.threatScore}%
              </div>
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block">Malware Risk Score</span>
            </div>

            <div className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold uppercase tracking-wider ${
              scanResult.scan.status === 'dangerous' ? 'bg-rose-950/30 border-rose-900/50 text-rose-400' :
              scanResult.scan.status === 'suspicious' ? 'bg-amber-950/30 border-amber-900/50 text-amber-400' :
              'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
            }`}>
              {scanResult.scan.status}
            </div>
          </div>

          {/* Cryptography & Spoil checks */}
          <div className="md:col-span-2 bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-900 pb-3">
              <h3 className="font-outfit font-bold text-sm text-slate-200">Signature Specifications</h3>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">MD5, SHA256, & Entropy Analysis</p>
            </div>

            <div className="space-y-4 font-mono text-xs text-slate-300">
              <div className="space-y-1.5 border-b border-slate-900 pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 uppercase">SHA-256 Hash:</span>
                  <button 
                    onClick={() => copyToClipboard(scanResult.details.hashes.sha256, "sha256")}
                    className="text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    <span className="text-[9px] mr-1">{copiedText === "sha256" ? "Copied" : "Copy"}</span>
                    <Copy className="h-3 w-3 inline" />
                  </button>
                </div>
                <div className="text-slate-200 break-all select-all font-mono leading-relaxed bg-slate-950 p-2 rounded border border-slate-900">
                  {scanResult.details.hashes.sha256}
                </div>
              </div>

              <div className="space-y-1.5 border-b border-slate-900 pb-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 uppercase">MD5 Hash:</span>
                  <button 
                    onClick={() => copyToClipboard(scanResult.details.hashes.md5, "md5")}
                    className="text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    <span className="text-[9px] mr-1">{copiedText === "md5" ? "Copied" : "Copy"}</span>
                    <Copy className="h-3 w-3 inline" />
                  </button>
                </div>
                <div className="text-slate-200 break-all select-all font-mono leading-relaxed bg-slate-950 p-2 rounded border border-slate-900">
                  {scanResult.details.hashes.md5}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <span className="text-[9px] text-slate-500 uppercase block">Magic Bytes Header</span>
                  <span className="text-slate-200 font-bold tracking-wider">{scanResult.details.metadata.headerBytes.toUpperCase()}</span>
                </div>
                <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <span className="text-[9px] text-slate-500 uppercase block">Binary Entropy</span>
                  <span className="text-slate-200 font-bold">{scanResult.details.metadata.entropy} H/B</span>
                </div>
              </div>

              {/* Warning/Sign-offs Indicators */}
              {scanResult.details.riskIndicators.length > 0 ? (
                <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase tracking-wider text-[10px]">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    <span>Spoofing Warning Indicators</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-400/90 font-sans space-y-0.5">
                    {scanResult.details.riskIndicators.map((ind: string, idx: number) => (
                      <li key={idx}>{ind}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-sans text-[11px]">Format signature matches file extension headers. No spoof indicators.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
