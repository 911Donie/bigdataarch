import React, { useState, useEffect } from 'react';
import { useTelecom } from '../context/TelecomContext';
import { BookOpen, Sparkles, HelpCircle, GraduationCap, ChevronDown, ChevronUp, CheckCircle, ShieldCheck } from 'lucide-react';
import { VivaQuestion, WalkthroughStep } from '../types';

export const LearningExplainabilityPage: React.FC = () => {
  const { summary } = useTelecom();
  const [activeTab, setActiveTab] = useState<'ask-why' | 'viva' | 'walkthrough'>('ask-why');
  
  // Ask why state
  const [selectedQuestionKey, setSelectedQuestionKey] = useState<string>('why_traffic_increased');
  const [askWhyData, setAskWhyData] = useState<any | null>(null);
  const [askWhyLoading, setAskWhyLoading] = useState<boolean>(false);

  // Viva state
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [expandedVivaId, setExpandedVivaId] = useState<number | null>(1);

  // Walkthrough state
  const [walkthroughSteps, setWalkthroughSteps] = useState<WalkthroughStep[]>([]);
  const [walkthroughLoading, setWalkthroughLoading] = useState<boolean>(false);

  const ASK_WHY_QUESTIONS = [
    { key: 'why_traffic_increased', label: 'Why did traffic suddenly increase?' },
    { key: 'why_zone_critical', label: 'Why is this zone marked critical or congested?' },
    { key: 'what_kafka_does', label: 'What does Apache Kafka do here?' },
    { key: 'why_need_spark', label: 'Why do we need Apache Spark / Stream Processing?' },
    { key: 'how_failure_rate_calculated', label: 'How was the failure rate calculated?' },
    { key: 'difference_spike_vs_congestion', label: 'What is the difference between a traffic spike and congestion?' },
    { key: 'why_big_data_telecom', label: 'How can Big Data help a telecom operator?' },
    { key: 'what_if_traffic_doubles', label: 'What would happen if traffic doubled?' }
  ];

  const fetchAskWhy = async (qKey: string) => {
    setSelectedQuestionKey(qKey);
    setAskWhyLoading(true);
    try {
      const res = await fetch(`/api/explain/ask-why?question_key=${qKey}`);
      if (res.ok) {
        const data = await res.json();
        setAskWhyData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAskWhyLoading(false);
    }
  };

  const fetchViva = async () => {
    try {
      const res = await fetch('/api/viva/questions');
      if (res.ok) {
        const data = await res.json();
        setVivaQuestions(data.questions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWalkthrough = async () => {
    setWalkthroughLoading(true);
    try {
      const res = await fetch('/api/viva/walkthrough');
      if (res.ok) {
        const data = await res.json();
        setWalkthroughSteps(data.steps || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWalkthroughLoading(false);
    }
  };

  useEffect(() => {
    fetchAskWhy('why_traffic_increased');
    fetchViva();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="bg-[#111c30] border border-slate-800 rounded-xl p-3 shadow-md flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('ask-why')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ask-why'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Interactive "Ask Why?" Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('viva')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'viva'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Jury Viva Mode (16+ Questions)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('walkthrough');
              fetchWalkthrough();
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'walkthrough'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Walk Me Through This Run</span>
          </button>
        </div>

        <span className="text-xs font-mono text-cyan-400">
          Educational Big Data Learning Mode
        </span>
      </div>

      {/* TAB 1: ASK WHY ENGINE */}
      {activeTab === 'ask-why' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions Sidebar */}
          <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 shadow-md space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">
              Inquire Current Simulation State
            </h3>

            {ASK_WHY_QUESTIONS.map((q) => {
              const isSelected = selectedQuestionKey === q.key;
              return (
                <button
                  key={q.key}
                  onClick={() => fetchAskWhy(q.key)}
                  className={`w-full text-left p-3 rounded-lg text-xs transition-all border ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/50 text-white font-semibold'
                      : 'border-slate-850 bg-slate-900/60 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>

          {/* Dynamic Live Answer Panel */}
          <div className="lg:col-span-2 bg-[#111c30] border border-cyan-500/40 rounded-xl p-6 shadow-xl">
            {askWhyLoading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-xs">Analyzing current streaming metrics...</p>
              </div>
            ) : askWhyData ? (
              <div className="space-y-5 text-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                    Query Resolution
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1">{askWhyData.question}</h2>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block mb-1">
                    Direct Answer:
                  </span>
                  <p className="text-white text-sm font-medium leading-relaxed">
                    {askWhyData.direct_answer}
                  </p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-amber-500/30">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                    Live Evidence From Current Run:
                  </span>
                  <p className="text-amber-100 text-xs font-mono leading-relaxed">
                    {askWhyData.evidence_from_run}
                  </p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-wider block mb-1">
                    Technical & Architectural Explanation:
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {askWhyData.technical_explanation}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 2: VIVA QUESTIONS & ANSWERS */}
      {activeTab === 'viva' && (
        <div className="space-y-4">
          <div className="bg-[#111c30] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Comprehensive Viva & Defense Repository</h3>
              <p className="text-xs text-slate-400">
                16 rigorous questions with short answers, technical details, and live run demonstrations
              </p>
            </div>
            <span className="text-xs font-mono text-violet-300 bg-violet-950 px-2.5 py-1 rounded border border-violet-500/40">
              16 Jury Q&As
            </span>
          </div>

          <div className="space-y-3">
            {vivaQuestions.map((q) => {
              const isExpanded = expandedVivaId === q.id;
              return (
                <div
                  key={q.id}
                  className="bg-[#111c30] border border-slate-800 rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpandedVivaId(isExpanded ? null : q.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-violet-950 border border-violet-500/40 text-violet-300 flex items-center justify-center font-bold text-xs font-mono">
                        {q.id}
                      </span>
                      <h4 className="font-bold text-white text-sm">{q.question}</h4>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-3 text-xs">
                      <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                        <span className="text-emerald-400 font-bold block mb-1">Concise Viva Answer:</span>
                        <p className="text-slate-200 leading-relaxed">{q.short_answer}</p>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                        <span className="text-violet-400 font-bold block mb-1">Deep Technical Architecture:</span>
                        <p className="text-slate-300 leading-relaxed">{q.technical_answer}</p>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-cyan-500/30">
                        <span className="text-cyan-400 font-bold block mb-1">Live Example from Current Run:</span>
                        <p className="text-cyan-200 font-mono text-[11px]">{q.current_run_example}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: WALK ME THROUGH THIS RUN */}
      {activeTab === 'walkthrough' && (
        <div className="bg-[#111c30] border border-emerald-500/40 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Automated Presentation Narrative
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Current Run Walkthrough & Big Data Audit
              </h2>
            </div>

            <button
              onClick={fetchWalkthrough}
              className="px-3 py-1.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-900 transition-colors"
            >
              Refresh Narrative
            </button>
          </div>

          {walkthroughLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {walkthroughSteps.map((step) => (
                <div key={step.step} className="flex items-start space-x-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm font-mono flex-shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
