import React, { useState, useEffect } from 'react';
import { useTelecom } from '../context/TelecomContext';
import { Activity, Pause, Play, RefreshCw, Filter, Clock, Server, ArrowDown } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const LiveTrafficMonitor: React.FC = () => {
  const { summary } = useTelecom();
  const [events, setEvents] = useState<any[]>([]);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    let interval = setInterval(async () => {
      try {
        const res = await fetch('/api/traffic/live');
        if (res.ok) {
          const data = await res.json();
          setEvents(data.recent_events || []);
        }
      } catch (e) {
        console.error(e);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filterType !== 'ALL' && e.event_type !== filterType) return false;
    if (filterStatus !== 'ALL' && e.status !== filterStatus) return false;
    return true;
  });

  const timeSeries = summary?.throughput_series || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Real-Time Telecom Stream Ingestion Monitor</span>
          </h2>
          <p className="text-xs text-slate-400">
            Inspect individual 3GPP event arrivals, latency signatures, and buffer queue depth
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Filter Type */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="SMS">SMS Only</option>
              <option value="VOICE">Voice Only</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CONNECTED">Connected</option>
              <option value="FAILED">Failed</option>
              <option value="DROPPED">Dropped</option>
            </select>
          </div>

          {/* Auto scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              autoScroll
                ? 'bg-cyan-950 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoScroll ? 'Auto-Refresh ON' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Latency & Queue Dynamics Chart */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <span>SMS Delivery Latency & Ingestion Queue Backlog</span>
            </h3>
            <p className="text-xs text-slate-400">Leading indicators of downstream buffer saturation</p>
          </div>
          <span className="text-xs font-mono text-violet-400">Dual-Axis Telemetry</span>
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2e48" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#8b5cf6" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="sms_latency_ms" name="SMS Latency (ms)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="call_setup_ms" name="Call Setup Delay (ms)" stroke="#06b6d4" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="queue_backlog" name="Queue Backlog (evts)" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Event Stream Table */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Arriving Event Stream Feed</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono font-normal">
              Latest {filteredEvents.length} events
            </span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Bounded Ring Buffer (5000)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">Zone ID</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Latency / Duration</th>
                <th className="py-2.5 px-3">Scenario</th>
                <th className="py-2.5 px-3">Failure Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No matching events in the current streaming buffer.
                  </td>
                </tr>
              ) : (
                filteredEvents.slice().reverse().map((evt) => {
                  const isFailed = evt.status === 'FAILED' || evt.status === 'DROPPED';
                  const dateStr = new Date(evt.timestamp * 1000).toLocaleTimeString();
                  
                  return (
                    <tr
                      key={evt.event_id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isFailed ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-cyan-300 font-bold">{evt.event_id}</td>
                      <td className="py-2 px-3 text-slate-400">{dateStr}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          evt.event_type === 'SMS' ? 'bg-cyan-950 text-cyan-400' : 'bg-violet-950 text-violet-400'
                        }`}>
                          {evt.event_type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-200">{evt.source_region}</td>
                      <td className="py-2 px-3 text-slate-300">{evt.zone_id}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          evt.status === 'DELIVERED' || evt.status === 'CONNECTED'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-rose-950 text-rose-400'
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {evt.event_type === 'SMS' ? `${evt.latency_ms} ms` : `${evt.call_duration_s}s (Setup: ${evt.call_setup_ms}ms)`}
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">{evt.scenario_id}</td>
                      <td className="py-2 px-3 text-rose-400 text-[11px]">
                        {evt.failure_reason || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
