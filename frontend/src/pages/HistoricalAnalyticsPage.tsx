import React, { useState, useEffect } from 'react';
import { History, Download, Filter, Play, CheckCircle2, RotateCcw, Search } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const HistoricalAnalyticsPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Replay feature states
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayIdx, setReplayIdx] = useState<number>(0);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        region: regionFilter,
        event_type: typeFilter,
        status: statusFilter,
        limit: '200'
      });
      const res = await fetch(`/api/traffic/history?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [regionFilter, typeFilter, statusFilter]);

  // Replay tick simulation
  useEffect(() => {
    let timer: any = null;
    if (isReplaying && events.length > 0) {
      timer = setInterval(() => {
        setReplayIdx((prev) => {
          if (prev >= events.length - 1) {
            setIsReplaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 300);
    }
    return () => clearInterval(timer);
  }, [isReplaying, events.length]);

  const handleExportCsv = () => {
    const query = new URLSearchParams({
      region: regionFilter,
      event_type: typeFilter,
      status: statusFilter
    });
    window.open(`/api/traffic/export-csv?${query.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Historical Telecom Analytics & Session Replay</span>
          </h2>
          <p className="text-xs text-slate-400">
            Multi-dimensional queries over persisted window aggregates and individual CDRs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Region filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400">Region:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">All Regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
              <option value="Central">Central</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="SMS">SMS</option>
              <option value="VOICE">VOICE</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CONNECTED">Connected</option>
              <option value="FAILED">Failed</option>
              <option value="DROPPED">Dropped</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-md shadow-cyan-950/40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Historical Simulation Replay Player */}
      <div className="bg-[#111c30] border border-cyan-500/40 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Play className="w-4 h-4 text-cyan-400" />
              <span>Historical Session Replay Player</span>
            </h3>
            <p className="text-xs text-slate-400">
              Step through recorded historical event sequences to observe traffic pattern evolution
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => {
                if (isReplaying) {
                  setIsReplaying(false);
                } else {
                  setIsReplaying(true);
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isReplaying ? 'Pause Replay' : 'Watch Replay'}</span>
            </button>

            <button
              onClick={() => {
                setIsReplaying(false);
                setReplayIdx(0);
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Reset replay to beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-2 border border-slate-800">
          <div
            className="h-full bg-cyan-500 transition-all duration-150"
            style={{ width: `${events.length > 0 ? (replayIdx / events.length) * 100 : 0}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>Replaying Frame: {replayIdx} / {events.length}</span>
          <span>
            {events[replayIdx] ? `Event: ${events[replayIdx].event_id} (${events[replayIdx].status})` : 'Replay Ready'}
          </span>
        </div>
      </div>

      {/* Queried Historical Records Table */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            Persisted Event Records ({events.length} rows loaded)
          </h3>
          <span className="text-xs font-mono text-slate-500">PostgreSQL / SQLite Index</span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">Zone</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Latency (ms)</th>
                <th className="py-2.5 px-3">Scenario</th>
                <th className="py-2.5 px-3">Failure Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {events.slice(0, 50).map((e) => (
                <tr key={e.event_id} className="hover:bg-slate-800/40">
                  <td className="py-2 px-3 text-cyan-300 font-bold">{e.event_id}</td>
                  <td className="py-2 px-3 text-slate-400">
                    {new Date(e.timestamp * 1000).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      e.event_type === 'SMS' ? 'bg-cyan-950 text-cyan-400' : 'bg-violet-950 text-violet-400'
                    }`}>
                      {e.event_type}
                    </span>
                  </td>
                  <td className="py-2 px-3">{e.source_region}</td>
                  <td className="py-2 px-3 text-slate-400">{e.zone_id}</td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      e.status === 'DELIVERED' || e.status === 'CONNECTED'
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-rose-950 text-rose-400'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">{e.latency_ms || 0} ms</td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">{e.scenario_id}</td>
                  <td className="py-2 px-3 text-rose-400 text-[11px]">{e.failure_reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
