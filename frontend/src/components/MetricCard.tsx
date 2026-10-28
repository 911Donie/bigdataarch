import React, { useState } from 'react';
import { MetricExplanation } from '../types';
import { useTelecom } from '../context/TelecomContext';
import { HelpCircle, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  id: string;
  data: MetricExplanation;
  accentColor?: 'cyan' | 'violet' | 'amber' | 'rose' | 'emerald';
  isAlert?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  data,
  accentColor = 'cyan',
  isAlert = false
}) => {
  const { openExplainModal } = useTelecom();
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);

  const colorStyles = {
    cyan: 'border-slate-800 hover:border-cyan-500/50 bg-[#121d33]',
    violet: 'border-slate-800 hover:border-violet-500/50 bg-[#141d35]',
    amber: 'border-slate-800 hover:border-amber-500/50 bg-[#171d2e]',
    rose: 'border-rose-900/60 bg-rose-950/20 hover:border-rose-500/60',
    emerald: 'border-slate-800 hover:border-emerald-500/50 bg-[#11202e]'
  };

  const delta = data.delta_previous || 0;
  const isPositive = delta > 0;
  const isZero = delta === 0;

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all duration-200 shadow-lg ${
        colorStyles[accentColor]
      } ${isAlert ? 'ring-1 ring-rose-500/50' : ''}`}
    >
      {/* Top row: Label + Tooltip + Why Button */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center space-x-1.5 min-w-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
            {data.metric_name}
          </span>
          
          {/* Formula calculation tooltip */}
          <div className="relative inline-block">
            <button
              onMouseEnter={() => setShowFormulaTooltip(true)}
              onMouseLeave={() => setShowFormulaTooltip(false)}
              className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
              title="View mathematical calculation"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            {showFormulaTooltip && (
              <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 bg-slate-900 text-slate-200 text-xs rounded-lg shadow-xl border border-cyan-500/40 z-30 pointer-events-none">
                <p className="font-semibold text-cyan-400 mb-1">Calculation Formula:</p>
                <p className="font-mono text-[11px] text-slate-300">{data.calculation_tooltip}</p>
                {data.measurement_window && (
                  <p className="mt-1 text-[10px] text-slate-400">Window: {data.measurement_window}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Explain / Why action */}
        <button
          onClick={() => openExplainModal(id)}
          className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition-all flex-shrink-0"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Why?</span>
        </button>
      </div>

      {/* Main value display */}
      <div className="flex items-baseline space-x-2 my-1.5">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">
          {typeof data.current_value === 'number'
            ? data.current_value.toLocaleString()
            : data.current_value}
        </span>
        <span className="text-xs font-medium text-slate-400">{data.unit}</span>
      </div>

      {/* Delta trend row */}
      <div className="flex items-center justify-between text-xs my-2">
        <div className="flex items-center space-x-1">
          {isZero ? (
            <span className="text-slate-400 flex items-center">
              <Minus className="w-3 h-3 mr-0.5" /> Stable
            </span>
          ) : isPositive ? (
            <span className="text-amber-400 flex items-center font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{delta}
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center font-medium">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {delta}
            </span>
          )}
          <span className="text-[11px] text-slate-500">vs prev</span>
        </div>

        {data.measurement_window && (
          <span className="text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-400 font-mono">
            {data.measurement_window}
          </span>
        )}
      </div>

      {/* Plain language explanation snippet */}
      <div className="pt-2 border-t border-slate-800/80">
        <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
          {data.plain_language_explanation}
        </p>
      </div>
    </div>
  );
};
