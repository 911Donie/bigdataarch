import React, { useState, useEffect } from 'react';
import { useTelecom } from '../context/TelecomContext';
import { Radio, Database, ShieldAlert, Cpu, Sparkles, HelpCircle, Activity } from 'lucide-react';

interface NavbarProps {
  onOpenViva: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenViva }) => {
  const { summary, simulationState, activeScenario, wsConnected } = useTelecom();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      setTimeStr(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const mode = summary?.mode || 'LOCAL_SIMULATION';
  const isDistributed = mode === 'KAFKA_SPARK';

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0c1424] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-lg">
      {/* Brand & Network Operations Center Title */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 shadow-md shadow-cyan-900/50">
          <Radio className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full radar-glow"></span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-extrabold text-white tracking-tight">
              TelecomPulse <span className="text-cyan-400">AI</span>
            </h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 uppercase tracking-widest font-mono">
              NOC
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden sm:block">
            Real-Time SMS & Voice Traffic Monitoring Pipeline
          </p>
        </div>
      </div>

      {/* Center Operational Badges (Honest Transparency) */}
      <div className="hidden md:flex items-center space-x-2.5 text-xs font-mono">
        {/* Processing Mode */}
        <div 
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300"
          title={isDistributed ? "Running on distributed Kafka & Spark cluster" : "Running on local sliding-window stream processing engine"}
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mode:</span>
          <span className="font-bold text-cyan-300">
            {isDistributed ? 'Distributed (Kafka+Spark)' : 'Local Simulation Mode'}
          </span>
        </div>

        {/* Data Source Badge (Never pretend to monitor private real telco) */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300">
          <Database className="w-3.5 h-3.5 text-violet-400" />
          <span>Source:</span>
          <span className="font-bold text-violet-300">Simulated 3GPP Stream</span>
        </div>

        {/* Active Scenario Indicator */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Scenario:</span>
          <span className="font-bold text-amber-300">{activeScenario}</span>
        </div>
      </div>

      {/* Right Telemetry Indicators & Quick Actions */}
      <div className="flex items-center space-x-3">
        {/* Live Throughput Pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#13223f] border border-cyan-500/30 text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-white font-bold">
            {summary?.kpis.current_throughput_eps.current_value || 0}
          </span>
          <span className="text-[10px] text-slate-400">eps</span>
        </div>

        {/* WebSocket Live Indicator */}
        <div 
          className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono"
          title={wsConnected ? 'Connected to live WebSocket stream' : 'Polling stream API fallback active'}
        >
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <span className="text-slate-400 hidden xl:inline">{wsConnected ? 'LIVE WS' : 'POLL'}</span>
        </div>

        {/* Walk Me Through This Run / Viva Button */}
        <button
          onClick={onOpenViva}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-900/40 transition-all border border-violet-400/30"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span className="hidden sm:inline">Walk Me Through Run</span>
          <span className="sm:hidden">Viva</span>
        </button>

        {/* Clock */}
        <div className="hidden lg:block text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
          {timeStr}
        </div>
      </div>
    </header>
  );
};
