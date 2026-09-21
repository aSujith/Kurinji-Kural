import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { ShieldCheck, Database, History, CheckCircle2, Mic, Smartphone } from "lucide-react";

export const AdminView: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    api.getAdminAnalytics().then((res) => setAnalytics(res.stats));
  }, []);

  if (!analytics) return <div className="p-8 text-center text-stone-500">Loading admin audit trail...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm">
        <span className="text-xs font-bold text-green-700 uppercase tracking-wider bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
          Stage 11: Admin & Observability
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
          Platform Governance & Security Audit Trail
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Complete transparency over voice commits, status updates, buyer inquiries, and identity protection.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <span className="text-xs text-stone-400 block font-medium">Produce Batches</span>
          <span className="text-2xl font-black text-stone-900">{analytics.totalProducts}</span>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <span className="text-xs text-stone-400 block font-medium">Tribal Producers</span>
          <span className="text-2xl font-black text-green-700">{analytics.totalProducers}</span>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <span className="text-xs text-stone-400 block font-medium">Wholesale Buyers</span>
          <span className="text-2xl font-black text-blue-700">{analytics.totalBuyers}</span>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <span className="text-xs text-stone-400 block font-medium">Buyer Requirements</span>
          <span className="text-2xl font-black text-purple-700">{analytics.totalRequirements}</span>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <span className="text-xs text-stone-400 block font-medium">Active Enquiries</span>
          <span className="text-2xl font-black text-amber-700">{analytics.totalEnquiries}</span>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <span className="text-xs text-stone-400 block font-medium">Mandi Benchmarks</span>
          <span className="text-2xl font-black text-stone-900">{analytics.totalMarketCommodities}</span>
        </div>
      </div>

      {/* Append-Only Audit Log Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-lg flex items-center space-x-2">
            <History className="w-5 h-5 text-green-700" />
            <span>Append-Only Security Audit Trail</span>
          </h3>
          <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full font-semibold">
            Immutable Log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor ID</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Confirmation Method</th>
                <th className="p-4">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {analytics.recentAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-stone-400 italic">
                    No transactions logged yet. Use the voice assistant or action buttons to trigger audited operations.
                  </td>
                </tr>
              ) : (
                analytics.recentAuditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-stone-50/80 transition">
                    <td className="p-4 text-stone-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-4 font-mono font-bold text-stone-700">{log.actorId}</td>
                    <td className="p-4 font-semibold text-stone-900">{log.action}</td>
                    <td className="p-4 text-stone-600">{log.entityType} ({log.entityId})</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-bold ${
                        log.confirmationMethod === "voice"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {log.confirmationMethod === "voice" ? <Mic className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                        <span>{log.confirmationMethod}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center space-x-1 text-green-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Committed</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
