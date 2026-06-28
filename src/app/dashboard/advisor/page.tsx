"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Terminal, 
  Send, 
  Activity, 
  ShieldAlert, 
  HelpCircle,
  Cpu,
  User,
  Trash2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Play
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function SecurityAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "### Aegis Security Advisor Core Initialized\n\nI am your dedicated AI Threat Analyst. Ask me anything regarding account security, vulnerability mappings, phishing indicators, or mitigation best practices.\n\n*What security query would you like to review?*",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string>("new");
  const [isMounted, setIsMounted] = useState(false);

  // Core Status & Diagnostics States
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "unavailable" | "fallback">("checking");
  const [apiErrorMsg, setApiErrorMsg] = useState("");
  const [diagnostics, setDiagnostics] = useState({
    configured: false,
    reachable: false,
    modelInUse: "gemini-1.5-flash",
    lastSuccessTimestamp: null as string | null
  });
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<"success" | "fallback" | "failed" | null>(null);

  const messageEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkApiStatus = async () => {
    setApiStatus("checking");
    try {
      const response = await fetch("/api/chat");
      const data = await response.json();
      if (data.success) {
        setDiagnostics(prev => ({
          ...prev,
          configured: data.configured,
          reachable: data.reachable,
          modelInUse: data.modelInUse || "gemini-1.5-flash"
        }));
        if (data.reachable) {
          setApiStatus("connected");
          setApiErrorMsg("");
        } else {
          setApiStatus("unavailable");
          setApiErrorMsg(data.error || "Gemini API key is not configured.");
        }
      } else {
        setApiStatus("unavailable");
        setApiErrorMsg(data.error || "Failed to query status details.");
      }
    } catch (err: any) {
      setApiStatus("unavailable");
      setApiErrorMsg(err.message || "Failed to query API status.");
    }
  };

  useEffect(() => {
    setIsMounted(true);
    checkApiStatus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const chatPayload = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text }
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatPayload, chatId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [
          ...prev, 
          { role: "assistant", content: data.response, timestamp: new Date() }
        ]);
        if (data.chatId) {
          setChatId(data.chatId);
        }

        // Update indicator states
        if (data.isFallbackMode) {
          setApiStatus("fallback");
          if (data.apiError) {
            setApiErrorMsg(data.apiError);
          } else {
            setApiErrorMsg("Gemini API key is not configured in local environment.");
          }
        } else {
          setApiStatus("connected");
          setApiErrorMsg("");
          setDiagnostics(prev => ({
            ...prev,
            reachable: true,
            lastSuccessTimestamp: new Date().toLocaleTimeString()
          }));
        }
      } else {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: `**Error**: ${data.error || "Failed to process request."}`, timestamp: new Date() }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `**System Error**: Connection to the AI advisor core failed. (${err.message || err})`, timestamp: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const runVerificationRoutine = async () => {
    if (isVerifying || isLoading) return;
    setIsVerifying(true);
    setVerificationResult(null);
    const testPrompt = "Explain CSP and HSTS";

    const userMsg: Message = {
      role: "user",
      content: testPrompt,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const chatPayload = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: testPrompt }
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatPayload, chatId }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (data.success) {
        setMessages(prev => [
          ...prev, 
          { role: "assistant", content: data.response, timestamp: new Date() }
        ]);
        if (data.chatId) {
          setChatId(data.chatId);
        }

        if (data.isFallbackMode) {
          setApiStatus("fallback");
          if (data.apiError) setApiErrorMsg(data.apiError);
          setVerificationResult("fallback");
        } else {
          setApiStatus("connected");
          setApiErrorMsg("");
          setDiagnostics(prev => ({
            ...prev,
            reachable: true,
            lastSuccessTimestamp: new Date().toLocaleTimeString()
          }));
          setVerificationResult("success");
        }
      } else {
        setVerificationResult("failed");
      }
    } catch (err) {
      setIsLoading(false);
      setVerificationResult("failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "### Aegis Security Advisor Core Initialized\n\nI am your dedicated AI Threat Analyst. Ask me anything regarding account security, vulnerability mappings, phishing indicators, or mitigation best practices.\n\n*What security query would you like to review?*",
        timestamp: new Date()
      }
    ]);
    setChatId("new");
    setVerificationResult(null);
  };

  const suggestions = [
    "Explain CSP",
    "What is HSTS",
    "How to configure headers",
    "What is phishing?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white">AI Security Advisor</h1>
            <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">Aegis Sandbox Terminal</p>
          </div>
          {/* AI Status Badge */}
          <div className="mt-1">
            {apiStatus === 'checking' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold font-mono rounded bg-slate-900 border border-slate-800 text-slate-400 animate-pulse">
                Checking Core...
              </span>
            )}
            {apiStatus === 'connected' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold font-mono rounded bg-emerald-950/30 border border-emerald-900/50 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Gemini Connected
              </span>
            )}
            {apiStatus === 'unavailable' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold font-mono rounded bg-rose-950/30 border border-rose-900/50 text-rose-400 animate-none">
                Gemini Unavailable
              </span>
            )}
            {apiStatus === 'fallback' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold font-mono rounded bg-amber-950/30 border border-amber-900/50 text-amber-400">
                Fallback Mode
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={checkApiStatus}
            disabled={apiStatus === 'checking'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 bg-slate-900/40 text-xs font-semibold rounded-lg hover:text-cyan-400 hover:border-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Sync status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${apiStatus === 'checking' ? 'animate-spin' : ''}`} /> Sync Status
          </button>
          <button
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 bg-slate-900/40 text-xs font-semibold rounded-lg hover:text-rose-400 hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Reset Core
          </button>
        </div>
      </div>

      {/* Main Grid: Chat Left, Diagnostics Sidebar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Terminal Log Console */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-slate-950/80 border border-slate-800 rounded-2xl p-6 glow-blue backdrop-blur-md overflow-hidden">
          
          {/* User-friendly warning display if Gemini fails */}
          {apiErrorMsg && (apiStatus === 'fallback' || apiStatus === 'unavailable') && (
            <div className="mb-4 p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-xl text-amber-400 font-mono text-[11px] flex gap-2.5 items-start shrink-0">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold uppercase block text-[9px] tracking-wider mb-0.5">Local Fallback Active</span>
                Gemini API is offline: {apiErrorMsg}. Operating in localized offline rule response mode.
              </div>
            </div>
          )}

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {messages.map((m, idx) => (
              <div key={idx} className="flex gap-4 items-start text-xs leading-relaxed font-mono select-text">
                <div className={`p-2 rounded-lg border shrink-0 ${
                  m.role === 'assistant' ? 'bg-cyan-950/40 border-cyan-900/60 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  {m.role === 'assistant' ? <Cpu className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                    {m.role === 'assistant' ? 'AEGIS_ADVISOR_V1' : 'AGENT_CONSOLE'} | {isMounted ? m.timestamp.toLocaleTimeString() : ""}
                  </span>
                  
                  {/* Parse basic markdown headers, lists, code */}
                  <div className="text-slate-300 space-y-2 leading-relaxed font-sans text-xs">
                    {m.content.split("\n\n").map((block, bIdx) => {
                      if (block.startsWith("### ")) {
                        return <h3 key={bIdx} className="text-sm font-bold text-white font-outfit mt-3 border-b border-slate-900 pb-1">{block.replace("### ", "")}</h3>;
                      }
                      if (block.startsWith("## ")) {
                        return <h2 key={bIdx} className="text-base font-bold text-white font-outfit mt-4">{block.replace("## ", "")}</h2>;
                      }
                      if (block.startsWith("* ")) {
                        return (
                          <ul key={bIdx} className="list-disc list-inside space-y-1 text-slate-450">
                            {block.split("\n").map((li, liIdx) => (
                              <li key={liIdx} className="text-xs">{li.replace("* ", "")}</li>
                            ))}
                          </ul>
                        );
                      }
                      if (block.startsWith("- ")) {
                        return (
                          <ul key={bIdx} className="list-disc list-inside space-y-1 text-slate-450">
                            {block.split("\n").map((li, liIdx) => (
                              <li key={liIdx} className="text-xs">{li.replace("- ", "")}</li>
                            ))}
                          </ul>
                        );
                      }
                      if (block.startsWith("`") || block.startsWith("    ")) {
                        return (
                          <pre key={bIdx} className="bg-slate-950 p-2.5 rounded border border-slate-900 font-mono text-[10px] text-slate-400 overflow-x-auto my-2 leading-relaxed">
                            {block.replace(/`/g, "")}
                          </pre>
                        );
                      }
                      return <p key={bIdx} className="font-normal text-slate-300 text-xs">{block}</p>;
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-4 items-start text-xs font-mono">
                <div className="bg-cyan-950/40 border border-cyan-900/60 text-cyan-400 p-2 rounded-lg shrink-0">
                  <Cpu className="h-3.5 w-3.5 animate-spin" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">AEGIS_ADVISOR_V1 | Processing</span>
                  <span className="text-cyan-400/80 animate-pulse">Running security lookup queries...</span>
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2.5 shrink-0 mt-4 border-t border-slate-900 pt-4">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="px-3.5 py-1.5 bg-[#0b1329]/60 hover:bg-[#0b1329] border border-slate-850 hover:border-cyan-500/20 rounded-full text-xs font-mono text-slate-400 hover:text-cyan-400 transition-all cursor-pointer text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input box */}
          <div className="border-t border-slate-900 pt-4 mt-4 shrink-0">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Terminal className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ask about vulnerabilities, phishing, account security policies..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-200 placeholder-slate-655 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input}
                className="px-5 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm transition-all shadow-md shadow-cyan-500/10 disabled:opacity-50 cursor-pointer flex items-center justify-center"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Diagnostics Side Panel */}
        <div className="lg:col-span-1 space-y-6 h-fit">
          {/* Diagnostics Info Card */}
          <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 font-mono text-xs text-slate-350 space-y-3">
            <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase block border-b border-slate-900 pb-1 font-mono">Advisor Diagnostics</span>
            <div className="space-y-2.5 pt-1 text-[11px]">
              <div className="flex justify-between">
                <span>Gemini Configured:</span>
                <span className={diagnostics.configured ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {diagnostics.configured ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gemini Reachable:</span>
                <span className={diagnostics.reachable ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {diagnostics.reachable ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Current Model:</span>
                <span className="text-cyan-400 font-bold">{diagnostics.modelInUse}</span>
              </div>
              <div className="border-t border-slate-900 pt-2.5">
                <span className="text-slate-550 text-[8px] uppercase block font-semibold">Last Success Timestamp</span>
                <span className="text-slate-200 text-xs mt-0.5 block">
                  {diagnostics.lastSuccessTimestamp || "Never (Running Fallback)"}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Routine Command Center */}
          <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 font-mono text-xs text-slate-355 space-y-4">
            <div>
              <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase block border-b border-slate-900 pb-1 font-mono">AI Core Verification</span>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                Execute a verification test by querying the advisor with &quot;Explain CSP and HSTS&quot; to check for live AI generation.
              </p>
            </div>
            
            <button
              onClick={runVerificationRoutine}
              disabled={isVerifying || isLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all uppercase font-mono"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> Run Verification
                </>
              )}
            </button>

            {verificationResult && (
              <div className={`p-3 rounded-xl border text-[11px] leading-relaxed flex gap-2 items-start ${
                verificationResult === 'success' ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' :
                verificationResult === 'fallback' ? 'bg-amber-950/20 border-amber-900/50 text-amber-400' :
                'bg-rose-950/20 border-rose-900/50 text-rose-400'
              }`}>
                {verificationResult === 'success' && (
                  <>
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                    <div>
                      <span className="font-bold block text-[9px] uppercase tracking-wider mb-0.5">Verification Passed</span>
                      Real live Gemini AI insights generated successfully.
                    </div>
                  </>
                )}
                {verificationResult === 'fallback' && (
                  <>
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <div>
                      <span className="font-bold block text-[9px] uppercase tracking-wider mb-0.5">Verification Warning</span>
                      Offline fallback query response returned (Gemini core is unreachable).
                    </div>
                  </>
                )}
                {verificationResult === 'failed' && (
                  <>
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                    <div>
                      <span className="font-bold block text-[9px] uppercase tracking-wider mb-0.5">Verification Failed</span>
                      Internal server error occurred when submitting test query.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
