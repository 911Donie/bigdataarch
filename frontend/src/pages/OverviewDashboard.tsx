import React from 'react';
import { useTelecom } from '../context/TelecomContext';
import { MetricCard } from '../components/MetricCard';
import { ScenarioBar } from '../components/ScenarioBar';
import { SimulationControls } from '../components/SimulationControls';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const { summary, loading } = useTelecom();

  // Loading state
  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono text-sm">Connecting to Telecom Stream Engine...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const kpis = summary.kpis;
  const timeSeries = summary.throughput_series || [];

  // Compact KPI set to display
  const displayedKpis = [
    { id: 'current_throughput_eps', label: 'Throughput (eps)' },
    { id: 'sms_failure_rate', label: 'SMS Failure %' },
    { id: 'call_failure_rate', label: 'Call Failure %' },
    { id: 'queue_backlog', label: 'Queue Backlog' },
  ];

  return (
    <div className="space-y-6">
      {/* Scenario selector */}
      <ScenarioBar />
      {/* Simulation / playback controls */}
      <SimulationControls />

      {/* Compact KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {displayedKpis.map((k) => (
          <MetricCard
            key={k.id}
            id={k.id}
            data={kpis[k.id]}
            accentColor={k.id.includes('failure') ? 'rose' : 'cyan'}
            isAlert={
              k.id.includes('failure') &&
              (kpis[k.id].current_value as number) > (k.id === 'sms_failure_rate' ? 5 : 6)
            }
          />
        ))}
      </div>

      {/* Live throughput area chart */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Live Event Ingestion Throughput (eps)</span>
            </h3>
            <p className="text-xs text-slate-400">Sliding stream throughput broken down by event category</p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Real-Time</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="smsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="voiceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2e48" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="sms_eps" name="SMS Throughput (eps)" stroke="#06b6d4" fillOpacity={1} fill="url(#smsGradient)" />
              <Area type="monotone" dataKey="voice_eps" name="Voice Calls (eps)" stroke="#8b5cf6" fillOpacity={1} fill="url(#voiceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

import { useTelecom } from '../context/TelecomContext';
import { MetricCard } from '../components/MetricCard';
import { ScenarioBar } from '../components/ScenarioBar';
import { SimulationControls } from '../components/SimulationControls';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const { summary, loading } = useTelecom();

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono text-sm">Connecting to Telecom Stream Engine...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const kpis = summary.kpis;
  const timeSeries = summary.throughput_series || [];

  const displayedKpis = [
    { id: 'current_throughput_eps', label: 'Throughput (eps)' },
    { id: 'sms_failure_rate', label: 'SMS Failure %' },
    { id: 'call_failure_rate', label: 'Call Failure %' },
    { id: 'queue_backlog', label: 'Queue Backlog' },
  ];

  return (
    <div className="space-y-6">
      <ScenarioBar />
      <SimulationControls />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {displayedKpis.map((k) => (
          <MetricCard
            key={k.id}
            id={k.id}
            data={kpis[k.id]}
            accentColor={k.id.includes('failure') ? 'rose' : 'cyan'}
            isAlert={
              k.id.includes('failure') &&
              (kpis[k.id].current_value as number) > (k.id === 'sms_failure_rate' ? 5 : 6)
            }
          />
        ))}
      </div>
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Live Event Ingestion Throughput (eps)</span>
            </h3>
            <p className="text-xs text-slate-400">Sliding stream throughput broken down by event category</p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Real-Time</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="smsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="voiceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2e48" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="sms_eps" name="SMS Throughput (eps)" stroke="#06b6d4" fillOpacity={1} fill="url(#smsGradient)" />
              <Area type="monotone" dataKey="voice_eps" name="Voice Calls (eps)" stroke="#8b5cf6" fillOpacity={1} fill="url(#voiceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

import { useTelecom } from '../context/TelecomContext';
import { MetricCard } from '../components/MetricCard';
import { ScenarioBar } from '../components/ScenarioBar';
import { SimulationControls } from '../components/SimulationControls';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const { summary, loading } = useTelecom();

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono text-sm">Connecting to Telecom Stream Engine...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const kpis = summary.kpis;
  const timeSeries = summary.throughput_series || [];

  const displayedKpis = [
    { id: 'current_throughput_eps', label: 'Throughput (eps)' },
    { id: 'sms_failure_rate', label: 'SMS Failure %' },
    { id: 'call_failure_rate', label: 'Call Failure %' },
    { id: 'queue_backlog', label: 'Queue Backlog' },
  ];

  return (
    <div className="space-y-6">
      <ScenarioBar />
      <SimulationControls />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {displayedKpis.map((k) => (
          <MetricCard
            key={k.id}
            id={k.id}
            data={kpis[k.id]}
            accentColor={k.id.includes('failure') ? 'rose' : 'cyan'}
            isAlert={
              k.id.includes('failure') &&
              (kpis[k.id].current_value as number) > (k.id === 'sms_failure_rate' ? 5 : 6)
            }
          />
        ))}
      </div>
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Live Event Ingestion Throughput (eps)</span>
            </h3>
            <p className="text-xs text-slate-400">Sliding stream throughput broken down by event category</p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Real-Time</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="smsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="voiceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2e48" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="sms_eps" name="SMS Throughput (eps)" stroke="#06b6d4" fillOpacity={1} fill="url(#smsGradient)" />
              <Area type="monotone" dataKey="voice_eps" name="Voice Calls (eps)" stroke="#8b5cf6" fillOpacity={1} fill="url(#voiceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

import { useTelecom } from '../context/TelecomContext';
import { MetricCard } from '../components/MetricCard';
import { ScenarioBar } from '../components/ScenarioBar';
import { SimulationControls } from '../components/SimulationControls';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const { summary, loading } = useTelecom();

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono text-sm">Connecting to Telecom Stream Engine...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const kpis = summary.kpis;
  const timeSeries = summary.throughput_series || [];

  // Compact KPI set to display
  const displayedKpis = [
    { id: 'current_throughput_eps', label: 'Throughput (eps)' },
    { id: 'sms_failure_rate', label: 'SMS Failure %' },
    { id: 'call_failure_rate', label: 'Call Failure %' },
    { id: 'queue_backlog', label: 'Queue Backlog' },
  ];

  return (
    <div className="space-y-6">
      {/* Scenario selector */}
      <ScenarioBar />
      {/* Playback / simulation controls */}
      <SimulationControls />

      {/* Compact KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {displayedKpis.map((k) => (
          <MetricCard
            key={k.id}
            id={k.id}
            data={kpis[k.id]}
            accentColor={k.id.includes('failure') ? 'rose' : 'cyan'}
            isAlert={
              k.id.includes('failure') &&
              (kpis[k.id].current_value as number) > (k.id === 'sms_failure_rate' ? 5 : 6)
            }
          />
        ))}
      </div>

      {/* Live throughput area chart */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Live Event Ingestion Throughput (eps)</span>
            </h3>
            <p className="text-xs text-slate-400">Sliding stream throughput broken down by event category</p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Real-Time</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="smsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="voiceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2e48" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="sms_eps" name="SMS Throughput (eps)" stroke="#06b6d4" fillOpacity={1} fill="url(#smsGradient)" />
              <Area type="monotone" dataKey="voice_eps" name="Voice Calls (eps)" stroke="#8b5cf6" fillOpacity={1} fill="url(#voiceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

import { useTelecom } from '../context/TelecomContext';
import { MetricCard } from '../components/MetricCard';
import { ScenarioBar } from '../components/ScenarioBar';
import { SimulationControls } from '../components/SimulationControls';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const { summary, loading } = useTelecom();

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono text-sm">Connecting to Telecom Stream Engine...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const kpis = summary.kpis;
  const timeSeries = summary.throughput_series || [];

  // Compact KPI set
  const displayedKpis = [
    { id: 'current_throughput_eps', label: 'Throughput (eps)' },
    { id: 'sms_failure_rate', label: 'SMS Failure %' },
    { id: 'call_failure_rate', label: 'Call Failure %' },
    { id: 'queue_backlog', label: 'Queue Backlog' },
  ];

  return (
    <div className="space-y-6">
      <ScenarioBar />
      <SimulationControls />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {displayedKpis.map((k) => (
          <MetricCard
            key={k.id}
            id={k.id}
            data={kpis[k.id]}
            accentColor={k.id.includes('failure') ? 'rose' : 'cyan'}
            isAlert={k.id.includes('failure') && (kpis[k.id].current_value as number) > (k.id === 'sms_failure_rate' ? 5 : 6)}
          />
        ))}
      </div>
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Live Event Ingestion Throughput (eps)</span>
            </h3>
            <p className="text-xs text-slate-400">Sliding stream throughput broken down by event category</p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Real-Time</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="smsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="voiceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2e48" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="sms_eps" name="SMS Throughput (eps)" stroke="#06b6d4" fillOpacity={1} fill="url(#smsGradient)" />
              <Area type="monotone" dataKey="voice_eps" name="Voice Calls (eps)" stroke="#8b5cf6" fillOpacity={1} fill="url(#voiceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

import { useTelecom } from '../context/TelecomContext';
import { MetricCard } from '../components/MetricCard';
import { ScenarioBar } from '../components/ScenarioBar';
import { SimulationControls } from '../components/SimulationControls';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const { summary, loading } = useTelecom();

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono text-sm">Connecting to Telecom Stream Engine...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const kpis = summary.kpis;
  const timeSeries = summary.throughput_series || [];

  // key KPIs to display in compact view
  const displayedKpis = [
    { id: 'current_throughput_eps', label: 'Throughput (eps)' },
    { id: 'sms_failure_rate', label: 'SMS Failure %' },
    { id: 'call_failure_rate', label: 'Call Failure %' },
    { id: 'queue_backlog', label: 'Queue Backlog' },
  ];

  return (
    <div className="space-y-6">
      <ScenarioBar />
      <SimulationControls />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {displayedKpis.map((k) => (
          <MetricCard
            key={k.id}
            id={k.id}
            data={kpis[k.id]}
            accentColor={k.id.includes('failure') ? 'rose' : 'cyan'}
            isAlert={k.id.includes('failure') && (kpis[k.id].current_value as number) > (k.id === 'sms_failure_rate' ? 5 : 6)}
          />
        ))}
      </div>
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Live Event Ingestion Throughput (eps)</span>
            </h3>
            <p className="text-xs text-slate-400">Sliding stream throughput broken down by event category</p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Real-Time</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="smsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="voiceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2e48" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="sms_eps" name="SMS Throughput (eps)" stroke="#06b6d4" fillOpacity={1} fill="url(#smsGradient)" />
              <Area type="monotone" dataKey="voice_eps" name="Voice Calls (eps)" stroke="#8b5cf6" fillOpacity={1} fill="url(#voiceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

import { useTelecom } from '../context/TelecomContext';
import { MetricCard } from '../components/MetricCard';
import { ScenarioBar } from '../components/ScenarioBar';
import { SimulationControls } from '../components/SimulationControls';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Activity, Radio, AlertOctagon, CheckCircle2, AlertTriangle, Layers, Clock } from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const { summary, loading } = useTelecom();

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-mono text-sm">Connecting to Telecom Stream Engine...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const kpis = summary.kpis;
  const timeSeries = summary.throughput_series || [];
  const regionalData = summary.regional_distribution || [];
  const zones = summary.zones || [];

  const pieColors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* 1-Click Scenario Bar */}
      <ScenarioBar />

      {/* Playback Controls & Window Duration */}
      <SimulationControls />

      {/* KPI Metric Grid - All 12 Telecom KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Network Operations Telemetry KPIs</span>
            <span className="text-[11px] font-mono text-slate-500 font-normal">
              ({summary.window_duration_s}s sliding window)
            </span>
          </h2>
          <span className="text-xs text-slate-400">
            Click <strong>Why?</strong> on any metric for 5-part mathematical breakdown
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <MetricCard
            id="current_throughput_eps"
            data={kpis.current_throughput_eps}
            accentColor="cyan"
          />
          <MetricCard
            id="total_events_processed"
            data={kpis.total_events_processed}
            accentColor="violet"
          />
          <MetricCard
            id="total_sms_processed"
            data={kpis.total_sms_processed}
            accentColor="cyan"
          />
          <MetricCard
            id="total_call_attempts"
            data={kpis.total_call_attempts}
            accentColor="violet"
          />
          <MetricCard
            id="sms_failure_rate"
            data={kpis.sms_failure_rate}
            accentColor={kpis.sms_failure_rate.current_value as number > 5 ? "rose" : "amber"}
            isAlert={kpis.sms_failure_rate.current_value as number > 5}
          />
          <MetricCard
            id="call_failure_rate"
            data={kpis.call_failure_rate}
            accentColor={kpis.call_failure_rate.current_value as number > 6 ? "rose" : "amber"}
            isAlert={kpis.call_failure_rate.current_value as number > 6}
          />
          <MetricCard
            id="avg_sms_latency"
            data={kpis.avg_sms_latency}
            accentColor={kpis.avg_sms_latency.current_value as number > 200 ? "amber" : "emerald"}
          />
          <MetricCard
            id="dropped_call_rate"
            data={kpis.dropped_call_rate}
            accentColor={kpis.dropped_call_rate.current_value as number > 4 ? "rose" : "emerald"}
          />
          <MetricCard
            id="successful_sms_deliveries"
            data={kpis.successful_sms_deliveries}
            accentColor="emerald"
          />
          <MetricCard
            id="successful_calls"
            data={kpis.successful_calls}
            accentColor="emerald"
          />
          <MetricCard
            id="avg_call_setup_ms"
            data={kpis.avg_call_setup_ms}
            accentColor="violet"
          />
          <MetricCard
            id="queue_backlog"
            data={kpis.queue_backlog}
            accentColor={kpis.queue_backlog.current_value as number > 100 ? "rose" : "amber"}
            isAlert={kpis.queue_backlog.current_value as number > 100}
          />
        </div>
      </div>

      {/* Real-Time Live Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: SMS vs Voice Ingestion Rate */}
        <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Live Event Ingestion Throughput (eps)</span>
              </h3>
              <p className="text-xs text-slate-400">Sliding stream throughput broken down by event category</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Real-Time</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="smsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="voiceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2e48" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="sms_eps" name="SMS Throughput (eps)" stroke="#06b6d4" fillOpacity={1} fill="url(#smsGradient)" />
                <Area type="monotone" dataKey="voice_eps" name="Voice Calls (eps)" stroke="#8b5cf6" fillOpacity={1} fill="url(#voiceGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Success vs Failure Stream Trends */}
        <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Service Quality & Delivery Failures</span>
              </h3>
              <p className="text-xs text-slate-400">Successful completions vs failures and dropped calls</p>
            </div>
            <span className="text-xs font-mono text-rose-400">QoS Health</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2e48" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="sms_delivered" name="SMS Delivered" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="voice_connected" name="Voice Connected" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sms_failed" name="SMS Failed" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="voice_failed" name="Voice Failed" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Regional Distribution & Zone Utilization Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regional Distribution */}
        <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Traffic by Region ({summary.window_duration_s}s)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">Volume distribution across simulated telecom sectors</p>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2e48" />
                <XAxis dataKey="region" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="sms" name="SMS" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="voice" name="Voice" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Zones Utilization Matrix */}
        <div className="lg:col-span-2 bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Radio className="w-4 h-4 text-violet-400" />
                <span>Simulated Cell Clusters (Capacity vs Load)</span>
              </h3>
              <p className="text-xs text-slate-400">Current load against provisioned capacity with explainable evidence</p>
            </div>
            <span className="text-xs font-mono text-slate-400">7 Clusters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {zones.map((zone) => {
              const isCongested = zone.status === 'CONGESTED';
              const isWarning = zone.status === 'WARNING';
              const badgeClass = isCongested
                ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                : isWarning
                ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500/50';

              return (
                <div
                  key={zone.zone_id}
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    isCongested
                      ? 'border-rose-500/60 bg-rose-950/20 shadow-md shadow-rose-950/40 ring-1 ring-rose-500'
                      : isWarning
                      ? 'border-amber-500/50 bg-amber-950/10'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white">{zone.zone_id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase font-mono ${badgeClass}`}>
                      {zone.status}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-[11px] text-slate-300 mb-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Load / Cap:</span>
                      <span>{zone.current_load_eps} / {zone.configured_capacity_eps} eps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Utilization:</span>
                      <span className={`font-bold ${zone.utilization_pct > 85 ? 'text-rose-400' : zone.utilization_pct > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {zone.utilization_pct}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Latency:</span>
                      <span>{zone.avg_sms_latency_ms} ms</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        zone.utilization_pct > 85
                          ? 'bg-rose-500'
                          : zone.utilization_pct > 70
                          ? 'bg-amber-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, zone.utilization_pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
