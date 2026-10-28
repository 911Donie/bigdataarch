import React, { useState, useEffect } from 'react';
import { GitBranch, Layers, Cpu, Database, CheckCircle2, ArrowRight, Info, ShieldCheck } from 'lucide-react';
import { PipelineStatusData, PipelineStage } from '../types';

export const BigDataPipelinePage: React.FC = () => {
  const [pipelineData, setPipelineData] = useState<PipelineStatusData | null>(null);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);

  const fetchPipeline = async () => {
    try {
      const res = await fetch('/api/pipeline/status');
      if (res.ok) {
        const data = await res.json();
        setPipelineData(data);
        if (!selectedStage && data.stages && data.stages.length > 0) {
          setSelectedStage(data.stages[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPipeline();
    const interval = setInterval(fetchPipeline, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!pipelineData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { stages, big_data_5vs, is_distributed, mode } = pipelineData;

  return (
    <div className="space-y-6">
      {/* Top Architecture Banner */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-cyan-400" />
              <span>Big Data Stream Processing Architecture</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end event streaming pipeline with low-latency windowed state management and real-time inference
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">Architecture Mode:</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-cyan-500/40 text-cyan-300 font-bold">
              {is_distributed ? 'Distributed Cluster (Kafka + Spark)' : 'Local Stream Processing Engine'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Pipeline Diagram */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-5 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2 font-mono">
          <span>Click any pipeline node to inspect ingress/egress data and processing internals</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {stages.map((stage, idx) => {
            const isSelected = selectedStage?.id === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between relative group ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      {stage.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-xs mb-1 group-hover:text-cyan-300 transition-colors">
                    {stage.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono line-clamp-1">{stage.tech}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 font-mono text-[10px] text-slate-400 flex justify-between">
                  <span>Processed:</span>
                  <span className="text-white font-bold">{stage.events_out.toLocaleString()}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Pipeline Stage Inspector */}
      {selectedStage && (
        <div className="bg-[#111c30] border border-cyan-500/40 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono">Stage Inspector</span>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{selectedStage.name}</span>
                <span className="text-xs font-mono text-slate-400 font-normal">({selectedStage.tech})</span>
              </h3>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 mr-1.5">Processing Latency:</span>
                <span className="text-emerald-400 font-bold">{selectedStage.latency_ms} ms</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">What does this stage do?</span>
              <p className="text-slate-300 leading-relaxed">{selectedStage.what_it_does}</p>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-violet-400 font-bold block mb-1">Why does it exist in the Big Data pipeline?</span>
              <p className="text-slate-300 leading-relaxed">{selectedStage.why_it_exists}</p>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold block mb-1">Data Ingress (Input):</span>
              <p className="text-slate-300 font-mono text-[11px]">{selectedStage.input_data}</p>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">Data Egress (Output):</span>
              <p className="text-slate-300 font-mono text-[11px]">{selectedStage.output_data}</p>
            </div>

            <div className="md:col-span-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-cyan-300 font-bold font-mono text-[11px] block mb-1.5">
                Live Data Transformation / Output Example:
              </span>
              <pre className="text-emerald-300 font-mono text-xs overflow-x-auto p-2 bg-slate-900/90 rounded border border-slate-850">
                {selectedStage.processing_example}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* The 5 Vs of Big Data Live Breakdown */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>The 5 Vs of Big Data Demonstrated in TelecomPulse AI</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live telemetry evidence proving every core dimension of Big Data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(big_data_5vs).map(([vName, vData]) => (
            <div key={vName} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase font-mono text-cyan-400 block mb-1">
                  {vData.title}
                </span>
                <div className="font-mono text-sm font-bold text-white mb-2 pb-2 border-b border-slate-800">
                  {vData.current_metric}
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {vData.live_explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
