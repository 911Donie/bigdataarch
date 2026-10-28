import React, { useState, useEffect } from 'react';
import { ShieldCheck, Play, ArrowRight, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { MitigationAction, MitigationRecord } from '../types';

export const NetworkResponsePage: React.FC = () => {
  const [actions, setActions] = useState<MitigationAction[]>([]);
  const [history, setHistory] = useState<MitigationRecord[]>([]);
  const [selectedAction, setSelectedAction] = useState<MitigationAction | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [activeRecord, setActiveRecord] = useState<MitigationRecord | null>(null);

  const fetchData = async () => {
    try {
      const [resActs, resHist] = await fetch('/api/responses/available').then((r) => r.json());
      const histData = await fetch('/api/responses/history').then((r) => r.json());
      setActions(resActs?.actions || []);
      setHistory(histData?.history || []);
      if (!selectedAction && resActs?.actions?.length > 0) {
        setSelectedAction(resActs.actions[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyAction = async () => {
    if (!selectedAction) return;
    setIsApplying(true);
    try {
      const res = await fetch('/api/responses/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: selectedAction.id,
          target_zone: selectedAction.default_target
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRecord(data.mitigation);
        
        // Wait 3 seconds for simulation to process under new parameters, then evaluate!
        setTimeout(async () => {
          const evalRes = await fetch(`/api/responses/evaluate/${data.mitigation.id}`, { method: 'POST' });
          if (evalRes.ok) {
            const evalData = await evalRes.json();
            setActiveRecord(evalData.mitigation);
            fetchData();
          }
          setIsApplying(false);
        }, 3000);
      }
    } catch (e) {
      console.error(e);
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Network Response & Congestion Mitigation Simulator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select simulated operator interventions, deploy mitigations, and measure before-and-after KPI recovery
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-500/30">
            Simulated Network Fabric Control
          </span>
        </div>
      </div>

      {/* Selectable Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((act) => {
          const isSelected = selectedAction?.id === act.id;
          return (
            <button
              key={act.id}
              onClick={() => setSelectedAction(act)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-400 bg-emerald-950/30 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400'
                  : 'border-slate-800 bg-[#111c30] hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block mb-1">
                  Target: {act.default_target}
                </span>
                <h3 className="font-bold text-white text-sm mb-2">{act.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{act.problem_addressed}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 w-full flex items-center justify-between text-xs font-semibold">
                <span className={isSelected ? 'text-emerald-300' : 'text-slate-400'}>
                  {isSelected ? 'Selected' : 'Select Action'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Action Preview & Deployment Panel */}
      {selectedAction && (
        <div className="bg-[#111c30] border border-cyan-500/40 rounded-xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-bold text-cyan-400 font-mono">Proposed Intervention</span>
              <h3 className="text-lg font-bold text-white">{selectedAction.name}</h3>
            </div>

            <button
              onClick={handleApplyAction}
              disabled={isApplying}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Applying & Measuring Recovery (3s)...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Simulated Mitigation</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-rose-400 font-bold block mb-1">Problem Being Addressed:</span>
              <p className="text-slate-300 leading-relaxed">{selectedAction.problem_addressed}</p>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">Action Being Executed:</span>
              <p className="text-slate-300 leading-relaxed">{selectedAction.proposed_action}</p>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">Expected Outcome:</span>
              <p className="text-slate-300 leading-relaxed">{selectedAction.expected_outcome}</p>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold block mb-1">Potential Trade-Offs:</span>
              <p className="text-slate-300 leading-relaxed">{selectedAction.trade_offs}</p>
            </div>
          </div>
        </div>
      )}

      {/* Before vs After Impact Comparison Table */}
      {activeRecord && activeRecord.after_metrics && (
        <div className="bg-[#111c30] border border-emerald-500/50 rounded-xl p-5 shadow-xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Empirical Impact Evaluation: {activeRecord.action_name}</span>
            </h3>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
              activeRecord.is_effective
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
            }`}>
              {activeRecord.is_effective ? 'Mitigation Effective' : 'Partial Relief'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mb-4">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">QUEUE BACKLOG</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-slate-400 line-through">{activeRecord.before_metrics.queue_backlog}</span>
                <span className="text-emerald-400 font-bold text-sm">{activeRecord.after_metrics.queue_backlog}</span>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">AVG SMS LATENCY</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-slate-400 line-through">{activeRecord.before_metrics.avg_sms_latency_ms} ms</span>
                <span className="text-emerald-400 font-bold text-sm">{activeRecord.after_metrics.avg_sms_latency_ms} ms</span>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">TARGET ZONE UTIL</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-slate-400 line-through">{activeRecord.before_metrics.target_zone_utilization}%</span>
                <span className="text-emerald-400 font-bold text-sm">{activeRecord.after_metrics.target_zone_utilization}%</span>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">SMS FAILURE RATE</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-slate-400 line-through">{activeRecord.before_metrics.sms_failure_rate}%</span>
                <span className="text-emerald-400 font-bold text-sm">{activeRecord.after_metrics.sms_failure_rate}%</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-cyan-400 block mb-1">Scientific Evaluation Note:</span>
            <p>{activeRecord.evaluation_result}</p>
          </div>
        </div>
      )}
    </div>
  );
};
