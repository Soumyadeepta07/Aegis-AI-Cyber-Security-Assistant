"use client";

import { useState } from "react";
import { 
  AlertCircle, 
  Search, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  FileCode
} from "lucide-react";
import { jsPDF } from "jspdf";

export default function SecurityAuditPage() {
  const [urlInput, setUrlInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    setIsScanning(true);
    setError("");
    setAuditResult(null);
    setExpandedIndex(null);

    try {
      const response = await fetch("/api/scan/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await response.json();
      if (data.success) {
        setAuditResult(data.audit);
      } else {
        setError(data.error || "Failed to execute security audit.");
      }
    } catch (err) {
      setError("Failed to connect to auditing daemon.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!auditResult) return;

    try {
      const doc = new jsPDF();
      
      // Page styling - Dark Cyber background
      doc.setFillColor(11, 19, 41);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Header Accent line
      doc.setFillColor(0, 240, 255);
      doc.rect(20, 20, 170, 2, 'F');
      
      // Report Title
      doc.setTextColor(0, 240, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("AEGIS SECURITY AUDIT REPORT", 20, 32);
      
      // Subtitle Meta
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("courier", "bold");
      doc.text(`TARGET ENDPOINT : ${auditResult.url}`, 20, 44);
      doc.text(`SECURITY SCORE  : ${auditResult.securityScore}/100`, 20, 49);
      doc.text(`THREAT LEVEL    : ${auditResult.threatLevel.toUpperCase()}`, 20, 54);
      doc.text(`AUDIT TIMESTAMP : ${new Date().toLocaleString()}`, 20, 59);

      // Section: Evidence Summary
      doc.setTextColor(0, 240, 255);
      doc.text("=== EVIDENCE SUMMARY ===", 20, 67);
      doc.setTextColor(255, 255, 255);
      doc.text(`TOTAL HEADERS INSPECTED : ${auditResult.evidenceSummary?.totalHeadersInspected || 6}`, 20, 73);
      doc.text(`HEADERS DETECTED        : ${auditResult.evidenceSummary?.headersPresent || 0}`, 20, 78);
      doc.text(`HEADERS MISSING         : ${auditResult.evidenceSummary?.headersMissing || 0}`, 20, 83);
      doc.text(`REDIRECTS FOLLOWED      : ${auditResult.evidenceSummary?.redirectsFollowed ? "YES" : "NO"}`, 20, 88);
      doc.text(`FINAL AUDITED URL       : ${auditResult.evidenceSummary?.finalUrlAudited || auditResult.url}`, 20, 93);
      
      // Divider
      doc.setLineWidth(0.5);
      doc.setDrawColor(30, 41, 59);
      doc.line(20, 98, 190, 98);
      
      // Section: Summary
      doc.setTextColor(0, 240, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("1. EXECUTIVE SUMMARY", 20, 106);
      
      doc.setTextColor(203, 213, 225);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const splitSummary = doc.splitTextToSize(auditResult.summary, 170);
      doc.text(splitSummary, 20, 112);
      
      let y = 112 + (splitSummary.length * 5) + 10;
      
      // Section: Raw Response Headers
      doc.setTextColor(0, 240, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("2. RAW RESPONSE HEADERS", 20, y);
      y += 6;

      doc.setTextColor(156, 163, 175);
      doc.setFont("courier", "normal");
      doc.setFontSize(7.5);
      
      const rawHeadersText = Object.entries(auditResult.headers || {})
        .map(([key, val]) => `${key}: ${val}`)
        .join('\n');
      const splitHeaders = doc.splitTextToSize(rawHeadersText, 170);
      
      splitHeaders.forEach((line: string) => {
        if (y > 275) {
          doc.addPage();
          doc.setFillColor(11, 19, 41);
          doc.rect(0, 0, 210, 297, 'F');
          y = 25;
        }
        doc.text(line, 20, y);
        y += 4;
      });

      y += 10;

      // Section: Findings
      if (y > 240) {
        doc.addPage();
        doc.setFillColor(11, 19, 41);
        doc.rect(0, 0, 210, 297, 'F');
        y = 25;
      }
      doc.setTextColor(0, 240, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("3. OWASP TOP 10 VULNERABILITY MAPS & EVIDENCE", 20, y);
      y += 8;
      
      (auditResult.findings || []).forEach((finding: any, idx: number) => {
        // Prevent overflowing bottom of page
        if (y > 230) {
          doc.addPage();
          doc.setFillColor(11, 19, 41);
          doc.rect(0, 0, 210, 297, 'F');
          
          doc.setFillColor(0, 240, 255);
          doc.rect(20, 20, 170, 1, 'F');
          
          y = 30;
        }
        
        // Finding header
        doc.setTextColor(244, 63, 94); // Rose/Red for findings
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(`[FINDING 3.1.${idx + 1}] ${finding.findingTitle}`, 20, y);
        y += 5;
        
        doc.setTextColor(156, 163, 175);
        doc.setFont("courier", "bold");
        doc.setFontSize(8.5);
        doc.text(`OWASP CATEGORY: ${finding.owaspCategory} | CONFIDENCE: ${(finding.confidence || 'High Confidence').toUpperCase()}`, 20, y);
        y += 5;
        
        doc.setTextColor(203, 213, 225);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        
        const splitThreat = doc.splitTextToSize(`Threat Analysis: ${finding.threatExplanation}`, 170);
        doc.text(splitThreat, 20, y);
        y += (splitThreat.length * 4) + 1;
        
        // Evidence mode details in PDF
        doc.setTextColor(251, 191, 36); // Amber for evidence
        const evidenceDetailsText = `Inspected Header: ${finding.evidenceHeader}\nInspected Value: ${finding.evidenceValue || 'Absent'}\nInspection Reason: ${finding.evidenceReason}`;
        const splitEvidence = doc.splitTextToSize(evidenceDetailsText, 170);
        doc.text(splitEvidence, 20, y);
        y += (splitEvidence.length * 4) + 2;

        doc.setTextColor(16, 185, 129); // Emerald/Green for mitigations
        const splitMit = doc.splitTextToSize(`Developer Remediation: ${finding.remediationSteps}`, 170);
        doc.text(splitMit, 20, y);
        y += (splitMit.length * 4) + 8; // Extra padding
      });
      
      doc.save(`aegis_audit_${auditResult.host}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white">AI Security Audit</h1>
          <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">Automated Header Audits & OWASP Maps</p>
        </div>
        {auditResult && (
          <button
            onClick={handleDownloadPdf}
            className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
          >
            <Download className="h-4 w-4" /> Download PDF Audit Report
          </button>
        )}
      </div>

      {/* URL Input Form */}
      <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 glow-blue">
        <form onSubmit={handleAudit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <AlertCircle className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Enter website URL to audit (e.g. github.com or myserver.org)..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
              disabled={isScanning}
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !urlInput}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/10 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            {isScanning ? "Auditing..." : "Initialize Audit"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex gap-2 items-center">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {isScanning && (
        <div className="bg-[#0b1329]/40 border border-slate-800 rounded-2xl p-8 space-y-6 scan-animation">
          <div className="h-4 bg-slate-850 rounded w-1/3 animate-pulse" />
          <div className="h-28 bg-slate-850 rounded animate-pulse" />
          <div className="space-y-3">
            <div className="h-10 bg-slate-850 rounded animate-pulse" />
            <div className="h-10 bg-slate-850 rounded animate-pulse" />
          </div>
        </div>
      )}

      {/* Idle Intro State */}
      {!auditResult && !isScanning && (
        <div className="bg-[#0b1329]/30 border border-slate-850 rounded-2xl p-8 text-center space-y-4">
          <ShieldCheck className="h-10 w-10 text-cyan-500/50 mx-auto animate-pulse" />
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-outfit font-bold text-sm text-slate-350">Security Audit Terminal Idle</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Enter any website URL in the input box above. Aegis will run a comprehensive header analysis, checking for Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, Cookie security flags, and map the results to the OWASP Top 10 categories.
            </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {auditResult && (
        <div className="space-y-6">
          {/* Executive Overview Header Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Card 1: Defensive Rating */}
            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between items-center text-center">
              <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase w-full text-left font-mono">Defensive rating</span>
              <div className="my-3 text-4xl font-extrabold font-mono text-cyan-400">
                {auditResult.securityScore}/100
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${
                auditResult.threatLevel === 'dangerous' ? 'bg-rose-950/30 border-rose-900/50 text-rose-400' :
                auditResult.threatLevel === 'suspicious' ? 'bg-amber-950/30 border-amber-900/50 text-amber-400' :
                'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
              }`}>{auditResult.threatLevel}</span>
            </div>

            {/* Card 2: Evidence Summary HUD */}
            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-2 text-left font-mono text-[11px] text-slate-350">
              <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase block border-b border-slate-900 pb-1">Evidence Summary</span>
              <div className="space-y-1 pt-1">
                <div className="flex justify-between"><span>Headers Inspected:</span> <span className="text-cyan-400 font-bold">{auditResult.evidenceSummary?.totalHeadersInspected || 6}</span></div>
                <div className="flex justify-between"><span>Headers Present:</span> <span className="text-emerald-400 font-bold">{auditResult.evidenceSummary?.headersPresent || 0}</span></div>
                <div className="flex justify-between"><span>Headers Missing:</span> <span className="text-rose-400 font-bold">{auditResult.evidenceSummary?.headersMissing || 0}</span></div>
                <div className="flex justify-between"><span>Redirects Followed:</span> <span className="text-slate-250 font-bold">{auditResult.evidenceSummary?.redirectsFollowed ? "YES" : "NO"}</span></div>
              </div>
              <div className="text-[8px] text-slate-500 truncate border-t border-slate-900 pt-1" title={auditResult.evidenceSummary?.finalUrlAudited || auditResult.url}>
                URL: {auditResult.evidenceSummary?.finalUrlAudited || auditResult.url}
              </div>
            </div>

            {/* AI Executive Summary */}
            <div className="lg:col-span-2 bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                <ShieldCheck className="h-4.5 w-4.5 text-cyan-400" />
                <h3 className="font-outfit font-bold text-xs text-slate-300 uppercase tracking-wide">Executive Summary</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                {auditResult.summary}
              </p>
              {!auditResult.isFetchedLive && (
                <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" /> Note: Fetch failed ({auditResult.fetchError || "CORS restriction"}). Analyzed using diagnostic template headers.
                </div>
              )}
            </div>
          </div>

          {/* Detailed Findings & OWASP Maps */}
          <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="border-b border-slate-900 pb-3">
              <h3 className="font-outfit font-bold text-sm text-slate-200">Vulnerability Assessments</h3>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Findings Mapped to OWASP Top 10</p>
            </div>

            <div className="space-y-3">
              {auditResult.findings.map((finding: any, idx: number) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div key={idx} className="border border-slate-800/80 bg-slate-950/40 rounded-xl overflow-hidden transition-all">
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-900/30 transition-all font-mono text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-4 mr-2">
                        <span className="text-slate-500 font-bold">{idx + 1}.</span>
                        <div>
                          <p className="text-slate-200 font-semibold text-sm font-outfit">{finding.findingTitle}</p>
                          <span className="text-[9px] text-cyan-400/80 font-bold uppercase tracking-wider block mt-0.5">{finding.owaspCategory}</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4.5 w-4.5 text-slate-500" /> : <ChevronDown className="h-4.5 w-4.5 text-slate-500" />}
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-900 space-y-4 text-xs font-mono leading-relaxed text-slate-300">
                        {/* Evidence Mode Details Block */}
                        <div className="space-y-2 p-4 bg-slate-950 border border-slate-900 rounded-xl">
                          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                            <span className="text-amber-400 uppercase block font-bold text-[9px] tracking-wider font-mono">Inspected Evidence (Evidence Mode)</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${
                              finding.confidence === 'High Confidence' ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' :
                              finding.confidence === 'Medium Confidence' ? 'bg-amber-950/30 border-amber-900/50 text-amber-400' :
                              'bg-orange-950/30 border-orange-900/50 text-orange-400'
                            }`}>{finding.confidence || 'High Confidence'}</span>
                          </div>
                          <div className="text-xs space-y-2 font-mono">
                            <div>
                              <span className="text-slate-500 font-semibold block uppercase text-[8px] tracking-wide mb-0.5">HTTP Header Name</span>
                              <code className="text-slate-200 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{finding.evidenceHeader}</code>
                            </div>
                            <div>
                              <span className="text-slate-500 font-semibold block uppercase text-[8px] tracking-wide mb-0.5">Inspected Header Value</span>
                              <code className="text-rose-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 break-all select-all">{finding.evidenceValue || "Absent / Not Detected"}</code>
                            </div>
                            <div>
                              <span className="text-slate-500 font-semibold block uppercase text-[8px] tracking-wide mb-0.5">Inspection Reason</span>
                              <span className="text-slate-300 font-sans text-xs">{finding.evidenceReason}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-500 uppercase block font-bold text-[9px] tracking-wider">Threat Explanation</span>
                          <p className="text-slate-400 font-sans text-sm">{finding.threatExplanation}</p>
                        </div>
                        <div className="space-y-1.5 p-3.5 bg-slate-950 border border-slate-900 rounded-xl">
                          <span className="text-emerald-400 uppercase block font-bold text-[9px] tracking-wider">Remediation Guide</span>
                          <p className="text-slate-300 font-sans text-sm leading-relaxed">{finding.remediationSteps}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raw HTTP Headers parsed */}
          <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <FileCode className="h-4 w-4 text-cyan-400" />
              <h3 className="font-outfit font-bold text-sm text-slate-200">Raw Audited HTTP Response Headers</h3>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[11px] text-slate-400 space-y-1.5 overflow-x-auto leading-relaxed max-h-60 overflow-y-auto">
              {Object.entries(auditResult.headers || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-cyan-400/80 font-bold shrink-0">{key}:</span>
                  <span className="text-slate-300 break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
