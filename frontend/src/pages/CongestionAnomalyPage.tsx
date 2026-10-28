import React, { useState, useEffect } from 'react';
import { useTelecom } from '../context/TelecomContext';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  Info,
  Radio,
  Clock,
  Layers
} from 'lucide-react';
import { Anomaly, Alert } from '../types';

export const CongestionAnomalyPage: React.FC = () => {
  const { summary } = useTelecom();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAlertsAndAnomalies = async () => {
    try {
      const res = await fetch('/api/alerts?include_resolved=true');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setAnomalies(data.anomalies || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsAndAnomalies();
    const interval = setInterval(fetchAlertsAndAnomalies, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id: string) => {
    await fetch(`/api/alerts/${id}/acknowledge`, { method: 'POST' });
    fetchAlertsAndAnomalies();
  };

  const handleResolve = async (id: string) => {
    await fetch(`/api/alerts/${id}/resolve`, { method: 'POST' });
    fetchAlertsAndAnomalies();
  };

  const zones = summary?.zones || [];

  return (
    <div className="space-y-6">
      {/* Educational Banner: Traffic Spike vs Network Congestion */}
      <div className="bg-gradient-to-r from-slate-900 to-[#162038] border border-cyan-500/40 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Big Data Engineering Concept: Spike vs Congestion
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              <strong>Traffic Spike:</strong> An unusual increase in subscriber demand (e.g. OTP surge, breaking news). If capacity is sufficient, the system absorbs it without service degradation.<br />
              <strong>Network Congestion:</strong> A condition where resource constraints impair service performance (queue backlog growth, SMS latency &gt; 250ms, call drops &gt; 5%). A spike is not automatically classified as congestion unless service impairment is proven.
            </p>
          </div>
        </div>
      </div>

      {/* Network Zones Utilization & Evidence Grid */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-3 flex items-center space-x-2">
          <Radio className="w-4 h-4 text-violet-400" />
          <span>Cell Cluster Congestion & Evidence Analyzer</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {zones.map((z) => {
            const isCongested = z.status === 'CONGESTED';
            const isWarning = z.status === 'WARNING';
            return (
              <div
                key={z.zone_id}
                className={`p-4 rounded-xl border transition-all ${
                  isCongested
                    ? 'border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-950/40'
                    : isWarning
                    ? 'border-amber-500/60 bg-amber-950/15'
                    : 'border-slate-800 bg-[#111c30]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{z.zone_id}</span>
                    <span className="text-xs text-slate-400 font-mono">({z.region})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${
                      isCongested
                        ? 'bg-rose-950 text-rose-300 border-rose-500'
                        : isWarning
                        ? 'bg-amber-950 text-amber-300 border-amber-500'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {z.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 my-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                  <div>
                    <span className="text-slate-500 block text-[10px]">CURRENT LOAD</span>
                    <span className="font-bold">{z.current_load_eps} eps</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CAPACITY</span>
                    <span className="font-bold">{z.configured_capacity_eps} eps</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">UTILIZATION</span>
                    <span className={`font-bold ${z.utilization_pct > 85 ? 'text-rose-400' : z.utilization_pct > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {z.utilization_pct}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">QUEUE DEPTH</span>
                    <span className="font-bold">{z.queue_length} evts</span>
                  </div>
                </div>

                {/* Evidence explanation */}
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                  <span className="text-cyan-400 font-semibold block mb-0.5">Observed Evidence:</span>
                  <p className="leading-snug text-slate-300">{z.status_evidence}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Alerts Center */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>NOC Alert Center (Deduplication & Lifecycle)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cooldown-enforced operational alerts with acknowledgment and resolution tracking
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {alerts.filter((a) => !a.resolved).length} Active Alerts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Title & Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Affected Entity</th>
                <th className="py-2.5 px-3">Suggested Response</th>
                <th className="py-2.5 px-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No active or historical alerts generated yet.
                  </td>
                </tr>
              ) : (
                alerts.slice(0, 15).map((alt) => {
                  const isCrit = alt.severity === 'CRITICAL';
                  const isWarn = alt.severity === 'WARNING';
                  return (
                    <tr key={alt.id} className={`hover:bg-slate-800/40 ${alt.resolved ? 'opacity-50' : ''}`}>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            isCrit
                              ? 'bg-rose-950 text-rose-300 border-rose-500'
                              : isWarn
                              ? 'bg-amber-950 text-amber-300 border-amber-500'
                              : 'bg-cyan-950 text-cyan-300 border-cyan-500'
                          }`}
                        >
                          {alt.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{alt.title}</div>
                        <div className="text-[10px] text-slate-400">{alt.category}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs font-sans text-[11px] text-slate-300">
                        {alt.description}
                      </td>
                      <td className="py-2.5 px-3 text-cyan-300 font-bold">
                        {alt.affected_zone || alt.affected_region || 'GLOBAL'}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs font-sans text-[11px] text-emerald-300">
                        {alt.suggested_action || 'Monitor rolling trends.'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2 font-sans">
                          {!alt.acknowledged && !alt.resolved && (
                            <button
                              onClick={() => handleAcknowledge(alt.id)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-medium"
                            >
                              Ack
                            </button>
                          )}
                          {!alt.resolved ? (
                            <button
                              onClick={() => handleResolve(alt.id)}
                              className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded text-[10px] font-medium"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Resolved</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Method Anomaly Detection Engine Feed */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Multi-Method Anomaly Detection Audit Trail (Methods A through E)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Statistical baseline comparisons, Z-scores, and Scikit-Learn Isolation Forest classifications
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">5 Complementary Detectors</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">Observed vs Baseline</th>
                <th className="py-2.5 px-3">Deviation (%)</th>
                <th className="py-2.5 px-3">Confidence Score</th>
                <th className="py-2.5 px-3">Suggested Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {anomalies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No anomalies flagged in recent window. Trigger an SMS Spike or Retry Storm scenario to observe detectors!
                  </td>
                </tr>
              ) : (
                anomalies.slice(0, 15).map((ano) => (
                  <tr key={ano.anomaly_id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-violet-300">{ano.detection_method}</span>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">{ano.region}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-white font-bold">{ano.current_traffic_rate}</span> vs{' '}
                      <span className="text-slate-400">{ano.historical_baseline}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-amber-400">
                      +{ano.percentage_change}%
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      {Math.round(ano.confidence_score * 100)}%
                    </td>
                    <td className="py-2.5 px-3 max-w-sm font-sans text-[11px] text-slate-300">
                      {ano.suggested_investigation}
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
