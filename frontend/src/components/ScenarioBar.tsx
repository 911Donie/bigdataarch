import React, { useState } from 'react';
import { useTelecom } from '../context/TelecomContext';
import { Zap, Play, CheckCircle2, ChevronDown, ChevronUp, AlertOctagon, RefreshCw } from 'lucide-react';

const SCENARIOS = [
  {
    id: 'NORMAL',
    name: '1. Normal Traffic',
    tag: 'Baseline',
    color: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20',
    desc: 'Stable Poisson arrival (~40 eps, 80-120ms latency, <2% failures). Baseline operational state.',
    expected: 'All zones stay <70% utilization. Zero congestion alerts.'
  },
  {
    id: 'SMS_SPIKE',
    name: '2. SMS Spike',
    tag: 'Surge',
    color: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/20',
    desc: '4x surge in SMS (120 eps, 90% SMS mix). Flash OTP/promotional blast.',
    expected: 'Method A (Relative Spike) flags throughput burst; latency climbs.'
  },
  {
    id: 'VOICE_SURGE',
    name: '3. Voice Surge',
    tag: 'Emergency',
    color: 'border-amber-500/50 text-amber-400 bg-amber-950/20',
    desc: 'Voice calls surge to 85% of volume (110 eps). Breaking news/incident.',
    expected: 'Call setup delays rise; circuit channel warnings emitted.'
  },
  {
    id: 'SMS_RETRY_STORM',
    name: '4. Retry Storm',
    tag: 'Cascade',
    color: 'border-rose-500/50 text-rose-400 bg-rose-950/20',
    desc: 'Aggressive zero-backoff retries amplify traffic load and queue backlog.',
    expected: 'SMS failure rate >12%; Method C and D detect failure surge & queue backlog.'
  },
  {
    id: 'REGIONAL_CONGESTION',
    name: '5. Regional Congestion',
    tag: 'Imbalance',
    color: 'border-violet-500/50 text-violet-400 bg-violet-950/20',
    desc: 'Traffic heavily directed into South-02 (stadium/concert). Adjacent South-01 is idle.',
    expected: 'South-02 utilization hits >95% into CONGESTED status; South-01 has spare headroom.'
  },
  {
    id: 'PROCESSING_BOTTLENECK',
    name: '6. Pipeline Bottleneck',
    tag: 'Backpressure',
    color: 'border-amber-500/50 text-amber-400 bg-amber-950/20',
    desc: 'High ingestion rate but stream consumer processing capacity is choked to 25%.',
    expected: 'Queue backlog swells >200 events; Method D flags sustained queue growth.'
  },
  {
    id: 'RECOVERY',
    name: '7. Recovery Phase',
    tag: 'Resolution',
    color: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20',
    desc: 'Restores consumer throughput to 120% and stabilizes traffic to baseline.',
    expected: 'In-flight queues drain, latency returns to <100ms, alerts resolve.'
  }
];

export const ScenarioBar: React.FC = () => {
  const { activeScenario, triggerScenario } = useTelecom();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#111c30] border border-slate-800 rounded-xl p-3.5 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              Demonstration Scenarios
              <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-full font-mono normal-case">
                1-Click Simulation Triggers
              </span>
            </h3>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-cyan-400 flex items-center space-x-1"
        >
          <span>{expanded ? 'Collapse Details' : 'View Expected Behaviors'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Scenario Pill Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {SCENARIOS.map((scen) => {
          const isActive = activeScenario === scen.id;
          return (
            <button
              key={scen.id}
              onClick={() => triggerScenario(scen.id)}
              className={`p-2 rounded-lg border text-left transition-all text-xs flex flex-col justify-between ${
                isActive
                  ? 'border-cyan-400 bg-cyan-950/60 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${scen.color}`}>
                  {scen.tag}
                </span>
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
              <span className={`font-semibold line-clamp-1 ${isActive ? 'text-white' : 'text-slate-200'}`}>
                {scen.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expanded detailed preview table */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {SCENARIOS.map((s) => (
            <div
              key={s.id}
              className={`p-2.5 rounded-lg border ${
                activeScenario === s.id ? 'border-cyan-500/40 bg-cyan-950/20' : 'border-slate-850 bg-slate-950/40'
              }`}
            >
              <div className="flex items-center justify-between font-semibold mb-1">
                <span className="text-white">{s.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.color}`}>{s.tag}</span>
              </div>
              <p className="text-slate-400 mb-1">{s.desc}</p>
              <p className="text-cyan-300 font-mono text-[11px]">Expected: {s.expected}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
