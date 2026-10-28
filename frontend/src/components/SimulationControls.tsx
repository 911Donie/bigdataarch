import React, { useState } from 'react';
import { useTelecom } from '../context/TelecomContext';
import { Play, Pause, Square, RotateCcw, Sliders, Clock, Activity, MessageSquare } from 'lucide-react';

export const SimulationControls: React.FC = () => {
  const {
    summary,
    simulationState,
    activeWindow,
    setActiveWindow,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    resetSimulation,
    setSimulationRate,
    setTrafficMix
  } = useTelecom();

  const [sliderRate, setSliderRate] = useState<number>(40);
  const [sliderMix, setSliderMix] = useState<number>(65);

  const handleRateChange = (val: number) => {
    setSliderRate(val);
    setSimulationRate(val);
  };

  const handleMixChange = (val: number) => {
    setSliderMix(val);
    setTrafficMix(val);
  };

  return (
    <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
      {/* Simulation playback state buttons */}
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Controls:</span>
        
        {simulationState === 'PAUSED' ? (
          <button
            onClick={resumeSimulation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/40 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume</span>
          </button>
        ) : simulationState === 'RUNNING' ? (
          <button
            onClick={pauseSimulation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-900/40 transition-colors"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={startSimulation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-900/40 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start</span>
          </button>
        )}

        <button
          onClick={stopSimulation}
          disabled={simulationState === 'STOPPED'}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold transition-colors"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop</span>
        </button>

        <button
          onClick={resetSimulation}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 text-slate-300 text-xs font-semibold transition-colors"
          title="Reset event counters and clear queue"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Window Duration Selector */}
      <div className="flex items-center space-x-2">
        <Clock className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Window:</span>
        <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs font-mono">
          {[10, 30, 60, 300].map((w) => (
            <button
              key={w}
              onClick={() => setActiveWindow(w)}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeWindow === w
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {w < 60 ? `${w}s` : `${w / 60}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders: Rate & Mix */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {/* Rate slider */}
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-violet-400" />
          <span className="text-slate-400">Rate:</span>
          <input
            type="range"
            min="10"
            max="250"
            step="5"
            value={sliderRate}
            onChange={(e) => handleRateChange(Number(e.target.value))}
            className="w-24 accent-violet-500 cursor-pointer"
          />
          <span className="font-mono text-violet-300 w-12">{sliderRate} eps</span>
        </div>

        {/* SMS / Voice Traffic Mix slider */}
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">SMS Mix:</span>
          <input
            type="range"
            min="10"
            max="95"
            step="5"
            value={sliderMix}
            onChange={(e) => handleMixChange(Number(e.target.value))}
            className="w-20 accent-cyan-500 cursor-pointer"
          />
          <span className="font-mono text-cyan-300 w-8">{sliderMix}%</span>
        </div>
      </div>
    </div>
  );
};
