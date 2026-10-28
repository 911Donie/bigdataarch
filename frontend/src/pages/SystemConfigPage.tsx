import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, AlertTriangle, RefreshCw, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { DataQualityMetrics } from '../types';

export const SystemConfigPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DataQualityMetrics | null>(null);
  const [injectDupes, setInjectDupes] = useState<boolean>(false);
  const [injectDelay, setInjectDelay] = useState<boolean>(false);
  const [injectSchema, setInjectSchema] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/data-quality/metrics');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setInjectDupes(data.injection_status.duplicates);
        setInjectDelay(data.injection_status.delay);
        setInjectSchema(data.injection_status.schema_errors);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateInjections = async (newDupes: boolean, newDelay: boolean, newSchema: boolean) => {
    setIsUpdating(true);
    setInjectDupes(newDupes);
    setInjectDelay(newDelay);
    setInjectSchema(newSchema);
    try {
      await fetch('/api/data-quality/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duplicates: newDupes,
          delay: newDelay,
          schema_errors: newSchema
        })
      });
      fetchMetrics();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = async () => {
    await fetch('/api/data-quality/reset', { method: 'POST' });
    fetchMetrics();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              <span>Data Quality, Schema Validation & Reliability Architecture</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Test streaming resilience against out-of-order packets, corrupted schemas, and network duplicates
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Data Quality Audit</span>
          </button>
        </div>
      </div>

      {/* Live Data Quality Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#111c30] border border-slate-800 p-3.5 rounded-xl text-xs font-mono">
            <span className="text-slate-400 text-[10px] block mb-1">TOTAL RECEIVED</span>
            <span className="text-lg font-bold text-white">{metrics.events_received.toLocaleString()}</span>
          </div>

          <div className="bg-[#111c30] border border-emerald-500/40 p-3.5 rounded-xl text-xs font-mono">
            <span className="text-emerald-400 text-[10px] block mb-1">ACCEPTED & PROCESSED</span>
            <span className="text-lg font-bold text-emerald-400">{metrics.events_accepted.toLocaleString()}</span>
          </div>

          <div className="bg-[#111c30] border border-rose-500/40 p-3.5 rounded-xl text-xs font-mono">
            <span className="text-rose-400 text-[10px] block mb-1">REJECTED / DROPPED</span>
            <span className="text-lg font-bold text-rose-400">{metrics.events_rejected.toLocaleString()}</span>
          </div>

          <div className="bg-[#111c30] border border-slate-800 p-3.5 rounded-xl text-xs font-mono">
            <span className="text-amber-400 text-[10px] block mb-1">DUPLICATES FILTERED</span>
            <span className="text-lg font-bold text-amber-300">{metrics.duplicates_detected}</span>
          </div>

          <div className="bg-[#111c30] border border-slate-800 p-3.5 rounded-xl text-xs font-mono">
            <span className="text-violet-400 text-[10px] block mb-1">LATE / OUT-OF-ORDER</span>
            <span className="text-lg font-bold text-violet-300">{metrics.late_events_detected}</span>
          </div>

          <div className="bg-[#111c30] border border-slate-800 p-3.5 rounded-xl text-xs font-mono">
            <span className="text-cyan-400 text-[10px] block mb-1">DATA ACCEPTANCE RATE</span>
            <span className="text-lg font-bold text-cyan-300">{metrics.acceptance_rate_pct}%</span>
          </div>
        </div>
      )}

      {/* Controlled Chaos Injection Controls */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-5 shadow-md">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Controlled Data Quality Challenge Injection</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Deliberately inject real-world network transmission defects to demonstrate stream filtering and watermarking
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Challenge 1: Duplicates */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm">Duplicate Packet Injection</span>
                <input
                  type="checkbox"
                  checked={injectDupes}
                  onChange={(e) => handleUpdateInjections(e.target.checked, injectDelay, injectSchema)}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>
              <p className="text-slate-400 leading-relaxed">
                Injects duplicate identical 3GPP CDR event IDs to test the bounded LRU deduplication cache.
              </p>
            </div>
            <span className={`mt-3 text-[10px] font-mono font-bold ${injectDupes ? 'text-amber-400' : 'text-slate-500'}`}>
              Status: {injectDupes ? 'INJECTING (~7% duplicates)' : 'NORMAL'}
            </span>
          </div>

          {/* Challenge 2: Delayed Timestamps */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm">Delayed / Out-of-Order Packets</span>
                <input
                  type="checkbox"
                  checked={injectDelay}
                  onChange={(e) => handleUpdateInjections(injectDupes, e.target.checked, injectSchema)}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>
              <p className="text-slate-400 leading-relaxed">
                Skews event timestamps in the past to test stream watermarks and event-time window adjustments.
              </p>
            </div>
            <span className={`mt-3 text-[10px] font-mono font-bold ${injectDelay ? 'text-amber-400' : 'text-slate-500'}`}>
              Status: {injectDelay ? 'INJECTING (8-25s skew)' : 'NORMAL'}
            </span>
          </div>

          {/* Challenge 3: Schema Errors */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-sm">Corrupted Schema Records</span>
                <input
                  type="checkbox"
                  checked={injectSchema}
                  onChange={(e) => handleUpdateInjections(injectDupes, injectDelay, e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>
              <p className="text-slate-400 leading-relaxed">
                Strips mandatory 3GPP fields (e.g. event status) to test schema rejection before KPI corruption.
              </p>
            </div>
            <span className={`mt-3 text-[10px] font-mono font-bold ${injectSchema ? 'text-rose-400' : 'text-slate-500'}`}>
              Status: {injectSchema ? 'INJECTING (Corrupted payloads)' : 'NORMAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Deployment & Environment Setup Guide */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-5 shadow-md text-xs space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>System Environment & Infrastructure Specifications</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="text-cyan-400 font-bold">Active Runtime Stack:</div>
            <div className="text-slate-300">Backend: Python 3.13 + FastAPI + Pydantic v2</div>
            <div className="text-slate-300">Analytics: Pandas 3.0 + NumPy 2.3 + Scikit-Learn</div>
            <div className="text-slate-300">Storage: SQLite 3 (Out of the box) / PostgreSQL Configurable</div>
            <div className="text-slate-300">Frontend: React 18 + Vite 5 + Tailwind CSS + Recharts</div>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="text-violet-400 font-bold">Big Data Engine Integration:</div>
            <div className="text-slate-300">Current Mode: Local Simulation Mode (Zero Docker requirement)</div>
            <div className="text-slate-300">Docker Mode: docker-compose up (PostgreSQL + Kafka + Spark)</div>
            <div className="text-slate-300">Watermark Delay: 5.0 seconds allowed lateness</div>
            <div className="text-slate-300">In-Memory Buffer: 5,000 bounded sliding event window</div>
          </div>
        </div>
      </div>
    </div>
  );
};
