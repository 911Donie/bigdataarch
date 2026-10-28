import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DashboardSummary } from '../types';

interface TelecomContextType {
  summary: DashboardSummary | null;
  loading: boolean;
  activeWindow: number;
  setActiveWindow: (w: number) => void;
  selectedMetric: string | null;
  explainData: any | null;
  explainLoading: boolean;
  openExplainModal: (metricId: string) => void;
  closeExplainModal: () => void;
  simulationState: 'RUNNING' | 'PAUSED' | 'STOPPED';
  activeScenario: string;
  startSimulation: () => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resumeSimulation: () => Promise<void>;
  stopSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  triggerScenario: (scenarioId: string) => Promise<void>;
  setSimulationRate: (eps: number) => Promise<void>;
  setTrafficMix: (mixSms: number) => Promise<void>;
  refreshSummary: () => Promise<void>;
  wsConnected: boolean;
}

const TelecomContext = createContext<TelecomContextType | undefined>(undefined);

export const TelecomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeWindow, setActiveWindow] = useState<number>(30);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [explainData, setExplainData] = useState<any | null>(null);
  const [explainLoading, setExplainLoading] = useState<boolean>(false);
  const [simulationState, setSimulationState] = useState<'RUNNING' | 'PAUSED' | 'STOPPED'>('RUNNING');
  const [activeScenario, setActiveScenario] = useState<string>('NORMAL');
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/summary?window_seconds=${activeWindow}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
        setSimulationState(data.simulation_state);
        setActiveScenario(data.scenario);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard summary', err);
    } finally {
      setLoading(false);
    }
  }, [activeWindow]);

  // WebSocket live feed setup with auto-reconnect and polling fallback
  useEffect(() => {
    let ws: WebSocket | null = null;
    let pollInterval: any = null;

    const connectWs = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/telecom`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (_event) => {
          // Whenever socket ticks, pull fresh summary for rich KPIs
          fetchSummary();
        };

        ws.onclose = () => {
          setWsConnected(false);
          // Retry connecting in 3s
          setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (e) {
        setWsConnected(false);
      }
    };

    connectWs();

    // Fallback polling every 1.5 seconds
    pollInterval = setInterval(fetchSummary, 1500);

    return () => {
      if (ws) ws.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchSummary]);

  const openExplainModal = async (metricId: string) => {
    setSelectedMetric(metricId);
    setExplainLoading(true);
    try {
      const res = await fetch(`/api/explain/metric/${metricId}`);
      if (res.ok) {
        const data = await res.json();
        setExplainData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExplainLoading(false);
    }
  };

  const closeExplainModal = () => {
    setSelectedMetric(null);
    setExplainData(null);
  };

  const startSimulation = async () => {
    await fetch('/api/simulation/start', { method: 'POST' });
    setSimulationState('RUNNING');
    fetchSummary();
  };

  const pauseSimulation = async () => {
    await fetch('/api/simulation/pause', { method: 'POST' });
    setSimulationState('PAUSED');
    fetchSummary();
  };

  const resumeSimulation = async () => {
    await fetch('/api/simulation/resume', { method: 'POST' });
    setSimulationState('RUNNING');
    fetchSummary();
  };

  const stopSimulation = async () => {
    await fetch('/api/simulation/stop', { method: 'POST' });
    setSimulationState('STOPPED');
    fetchSummary();
  };

  const resetSimulation = async () => {
    await fetch('/api/simulation/reset', { method: 'POST' });
    setSimulationState('STOPPED');
    setActiveScenario('NORMAL');
    fetchSummary();
  };

  const triggerScenario = async (scenarioId: string) => {
    await fetch('/api/simulation/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId })
    });
    setActiveScenario(scenarioId);
    setSimulationState('RUNNING');
    fetchSummary();
  };

  const setSimulationRate = async (rateEps: number) => {
    await fetch('/api/simulation/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'configure', rate_eps: rateEps })
    });
    fetchSummary();
  };

  const setTrafficMix = async (mixSms: number) => {
    await fetch('/api/simulation/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'configure', mix_sms_pct: mixSms })
    });
    fetchSummary();
  };

  return (
    <TelecomContext.Provider
      value={{
        summary,
        loading,
        activeWindow,
        setActiveWindow,
        selectedMetric,
        explainData,
        explainLoading,
        openExplainModal,
        closeExplainModal,
        simulationState,
        activeScenario,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        stopSimulation,
        resetSimulation,
        triggerScenario,
        setSimulationRate,
        setTrafficMix,
        refreshSummary: fetchSummary,
        wsConnected
      }}
    >
      {children}
    </TelecomContext.Provider>
  );
};

export const useTelecom = () => {
  const context = useContext(TelecomContext);
  if (!context) {
    throw new Error('useTelecom must be used within a TelecomProvider');
  }
  return context;
};
