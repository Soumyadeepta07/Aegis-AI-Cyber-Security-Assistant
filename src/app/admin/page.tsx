"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  UserCheck, 
  UserX,
  ShieldAlert,
  RefreshCw,
  Clock
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface UserRecord {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  createdAt: string;
  isBlocked?: boolean;
}

interface Stats {
  totalScans: number;
  threatsDetected: number;
  safeScans: number;
  suspiciousScans: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalScans: 0,
    threatsDetected: 0,
    safeScans: 0,
    suspiciousScans: 0
  });
  const [trends, setTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchAdminData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin");
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
        setStats(data.stats || { totalScans: 0, threatsDetected: 0, safeScans: 0, suspiciousScans: 0 });
        setTrends(data.threatTrends || []);
      } else {
        throw new Error(data.error || "Failed to load administrative telemetry.");
      }
    } catch (e: any) {
      console.error("Failed to load admin telemetry:", e);
      setError(e.message || "Failed to load admin telemetry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleModeration = async (userId: string, action: 'block' | 'unblock' | 'make_admin' | 'make_user') => {
    setActionUserId(userId);
    setError("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // Refetch to reflect updates
        await fetchAdminData();
      } else {
        throw new Error(data.error || "Failed to update user authorization.");
      }
    } catch (err: any) {
      console.error("Moderation action failure:", err);
      setError(err.message || "Moderation action failed.");
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white">Security Admin Console</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400">
              Administrator
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1 font-mono uppercase tracking-wider">Aegis SOC Platform Moderation</p>
        </div>
        <button
          onClick={fetchAdminData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 bg-slate-900/40 text-xs font-semibold rounded-lg hover:text-rose-400 hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Telemetry
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex gap-2 items-center">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span>Error: {error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-900/40 border border-slate-800 rounded-2xl" />
            ))}
          </div>
          <div className="h-80 bg-slate-900/40 border border-slate-800 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block">Registered Agents</span>
                <span className="text-2xl font-extrabold text-slate-100 mt-1 block">{users.length}</span>
              </div>
              <Users className="h-8 w-8 text-rose-500/40" />
            </div>

            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block">Total Operations</span>
                <span className="text-2xl font-extrabold text-slate-100 mt-1 block">{stats.totalScans}</span>
              </div>
              <Activity className="h-8 w-8 text-rose-500/40" />
            </div>

            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block">Threat Detections</span>
                <span className="text-2xl font-extrabold text-rose-400 mt-1 block">{stats.threatsDetected}</span>
              </div>
              <ShieldAlert className="h-8 w-8 text-rose-500/40" />
            </div>

            <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block">Platform Health</span>
                <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                  {stats.totalScans > 0 ? Math.round(100 - (stats.threatsDetected / stats.totalScans) * 100) : 100}%
                </span>
              </div>
              <ShieldCheck className="h-8 w-8 text-rose-500/40" />
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 h-80 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-outfit font-bold text-sm text-slate-200">Incident Load Trends</h3>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">Platform-wide threat telemetry</p>
              </div>
            </div>

            <div className="flex-1 min-h-0 w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                  <XAxis dataKey="name" stroke="#475569" />
                  <YAxis stroke="#475569" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#090d1a', borderColor: '#1e293b', color: '#f8fafc' }} />
                  <Bar dataKey="safe" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="dangerous" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Moderation Management Panel */}
          <div className="bg-[#0b1329]/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="border-b border-slate-900 pb-3">
              <h3 className="font-outfit font-bold text-sm text-slate-200">Enrolled Agent Directory</h3>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Authentication & Moderation Controls</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 uppercase text-[9px] tracking-wider">
                    <th className="pb-3 font-bold">Agent Name</th>
                    <th className="pb-3 font-bold">Identifier (Email)</th>
                    <th className="pb-3 font-bold">Clearance (Role)</th>
                    <th className="pb-3 font-bold">Enrolled Date</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs font-mono">
                        No enrolled agents found in directory database.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const uId = user.id || user._id || "";
                      const isSelfLoading = actionUserId === uId;
                      return (
                        <tr key={uId} className="hover:bg-slate-950/40 transition-colors">
                          <td className="py-4 font-semibold text-slate-200">{user.name}</td>
                          <td className="py-4 select-all">{user.email}</td>
                          <td className="py-4">
                            <span className={`px-1.5 py-0.5 rounded border uppercase text-[9px] font-bold tracking-wider ${
                              user.role === 'admin' ? 'bg-rose-950/30 border-rose-900/40 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-4">
                            {user.isBlocked ? (
                              <span className="text-rose-400 font-bold uppercase text-[10px]">BLOCKED</span>
                            ) : (
                              <span className="text-emerald-400 font-bold uppercase text-[10px]">ACTIVE</span>
                            )}
                          </td>
                          <td className="py-4 text-right space-x-2">
                            {/* Role Toggle */}
                            {user.role === 'admin' ? (
                              <button
                                disabled={isSelfLoading}
                                onClick={() => handleModeration(uId, 'make_user')}
                                className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 rounded text-[10px] hover:border-slate-700 transition-colors cursor-pointer"
                              >
                                Demote
                              </button>
                            ) : (
                              <button
                                disabled={isSelfLoading}
                                onClick={() => handleModeration(uId, 'make_admin')}
                                className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-400 rounded text-[10px] hover:border-slate-700 transition-colors cursor-pointer"
                              >
                                Promote
                              </button>
                            )}

                            {/* Block/Unblock Toggle */}
                            {user.isBlocked ? (
                              <button
                                disabled={isSelfLoading}
                                onClick={() => handleModeration(uId, 'unblock')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-350 rounded text-[10px] transition-colors cursor-pointer"
                              >
                                <UserCheck className="h-3.5 w-3.5" /> Unban
                              </button>
                            ) : (
                              <button
                                disabled={isSelfLoading}
                                onClick={() => handleModeration(uId, 'block')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 hover:text-rose-350 rounded text-[10px] transition-colors cursor-pointer"
                              >
                                <UserX className="h-3.5 w-3.5" /> Suspend
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
