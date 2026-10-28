import React from 'react';
import { useTelecom } from '../context/TelecomContext';
import { X, HelpCircle, AlertTriangle, Calculator, Search, ShieldCheck } from 'lucide-react';

export const ExplainModal: React.FC = () => {
  const { selectedMetric, explainData, explainLoading, closeExplainModal } = useTelecom();

  if (!selectedMetric) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#111c30] border border-cyan-500/40 rounded-xl max-w-3xl w-full shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-gradient-to-r from-slate-900 to-[#13223f]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30 text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Explainable Big Data Telemetry</span>
              <h2 className="text-lg font-bold text-white">
                {explainLoading ? 'Loading Analysis...' : (explainData?.title || selectedMetric)}
              </h2>
            </div>
          </div>
          <button
            onClick={closeExplainModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {explainLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400">Aggregating stream metrics & statistical baselines...</p>
            </div>
          ) : explainData ? (
            <>
              {/* Section 1 */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-xs">1</span>
                  <h4>What am I looking at?</h4>
                </div>
                <p className="text-slate-300 leading-relaxed pl-7">{explainData.what_is_it}</p>
              </div>

              {/* Section 2 */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-violet-400 font-semibold mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-violet-950 border border-violet-500/40 text-violet-400 flex items-center justify-center text-xs">2</span>
                  <h4>Why does this metric matter?</h4>
                </div>
                <p className="text-slate-300 leading-relaxed pl-7">{explainData.why_it_matters}</p>
              </div>

              {/* Section 3 */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1.5">
                  <Calculator className="w-4 h-4" />
                  <h4>How is it calculated?</h4>
                </div>
                <div className="pl-6 space-y-2">
                  <p className="text-slate-300 font-mono text-xs bg-slate-950/80 p-2.5 rounded border border-slate-800 text-emerald-300">
                    {explainData.how_calculated}
                  </p>
                </div>
              </div>

              {/* Section 4 */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <h4>What is happening in the current simulation?</h4>
                </div>
                <div className="pl-6">
                  <div className="bg-amber-950/20 border border-amber-500/30 rounded p-3 text-amber-200">
                    {explainData.current_simulation_state}
                  </div>
                </div>
              </div>

              {/* Section 5 */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-1.5">
                  <Search className="w-4 h-4" />
                  <h4>What would a telecom operator investigate next?</h4>
                </div>
                <p className="text-slate-300 leading-relaxed pl-6">{explainData.operator_next_steps}</p>
              </div>

              {/* Technical Disclaimer banner */}
              <div className="flex items-start space-x-2 p-3 bg-slate-950/80 rounded border border-slate-800 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Academic & Operational Rigor:</strong> All explanations are derived strictly from active stream processing windows and transparent statistical formulas. Metrics reflect simulated 3GPP telecom events.
                </p>
              </div>
            </>
          ) : (
            <p className="text-slate-400">No explanation available for this metric.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={closeExplainModal}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
