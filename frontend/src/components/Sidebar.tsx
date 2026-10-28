import React from 'react';
import { useTelecom } from '../context/TelecomContext';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  GitBranch,
  History,
  ShieldCheck,
  BookOpen,
  Settings,
  BellRing,
  Layers
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { summary, simulationState } = useTelecom();

  const navItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'live-traffic', label: 'Live Traffic Monitor', icon: Activity },
    { id: 'congestion', label: 'Congestion & Anomalies', icon: AlertTriangle, badge: summary?.active_alerts_count },
    { id: 'pipeline', label: 'Big Data Pipeline', icon: GitBranch },
    { id: 'history', label: 'Historical Analytics', icon: History },
    { id: 'response', label: 'Response Simulator', icon: ShieldCheck },
    { id: 'learning', label: 'Learning & Viva Mode', icon: BookOpen },
    { id: 'config', label: 'Data Quality & Config', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0c1424] border-r border-slate-800 flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation menu */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
          NOC Modules
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stream Engine Telemetry Status Box */}
      <div className="p-3 m-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pipeline State</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
            simulationState === 'RUNNING'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
              : simulationState === 'PAUSED'
              ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
          }`}>
            {simulationState}
          </span>
        </div>

        <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
          <div className="flex justify-between">
            <span>Buffer Backlog:</span>
            <span className="text-white font-semibold">
              {summary?.kpis.queue_backlog.current_value || 0} evts
            </span>
          </div>
          <div className="flex justify-between">
            <span>Active Zones:</span>
            <span className="text-cyan-300 font-semibold">
              {summary?.zones.length || 7} Clusters
            </span>
          </div>
          <div className="flex justify-between">
            <span>Window Duration:</span>
            <span className="text-violet-300 font-semibold">
              {summary?.window_duration_s || 30}s sliding
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <span>Big Data Pipeline</span>
          <span className="text-emerald-400 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
