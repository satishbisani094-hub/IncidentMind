import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { IncidentRecord, AgentAnalysisResult } from '../types';
import { ShieldCheck, Database, Brain, Sparkles, CheckCircle2, Clock, AlertTriangle, Terminal, ArrowLeft, RefreshCw, Send } from 'lucide-react';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<IncidentRecord | null>(null);
  const [analysis, setAnalysis] = useState<AgentAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Resolve Modal State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveForm, setResolveForm] = useState({
    rootCause: '',
    resolution: '',
    outcome: 'SUCCESS',
    troubleshootingSteps: ''
  });

  const loadDetails = async () => {
    if (!id) return;
    try {
      const data = await api.getIncidentById(id);
      setIncident(data.incident);
      setAnalysis(data.latestAnalysis);

      // Pre-fill resolve modal if analysis exists
      if (data.latestAnalysis) {
        setResolveForm({
          rootCause: data.latestAnalysis.possibleRootCauses[0] || '',
          resolution: data.latestAnalysis.recommendedResolution.replace(/\[HISTORICAL MEMORY RECOMMENDATION\]:\s*/, ''),
          outcome: 'SUCCESS',
          troubleshootingSteps: data.latestAnalysis.recommendedInvestigationSteps.join('\n')
        });
      }
    } catch (err) {
      console.error('Failed to load incident detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleReanalyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      const result = await api.analyzeIncident(id);
      setAnalysis(result);
    } catch (err) {
      console.error('Re-analysis failed', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setResolving(true);
    try {
      const stepsArray = resolveForm.troubleshootingSteps.split('\n').filter(Boolean);
      await api.resolveIncident(id, {
        rootCause: resolveForm.rootCause,
        resolution: resolveForm.resolution,
        outcome: resolveForm.outcome,
        troubleshootingSteps: stepsArray
      });
      setShowResolveModal(false);
      await loadDetails();
    } catch (err) {
      console.error('Resolution submission failed', err);
    } finally {
      setResolving(false);
    }
  };

  if (loading || !incident) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-indigo-400 font-mono text-sm">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Fetching Incident & Recalled Memories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <button
            onClick={() => navigate('/incidents')}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-mono mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
          </button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-indigo-400">{incident.id}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              incident.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {incident.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">{incident.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReanalyze}
            disabled={analyzing}
            className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-mono rounded-lg border border-gray-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>Re-run Agent Diagnosis</span>
          </button>

          {incident.status !== 'RESOLVED' && (
            <button
              onClick={() => setShowResolveModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-lg shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolve & Retain in Hindsight</span>
            </button>
          )}
        </div>
      </div>

      {/* Incident Metadata & Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Metadata Details */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-4">
          <h2 className="text-xs font-mono uppercase text-gray-400 font-semibold tracking-wider">Telemetry Metadata</h2>
          
          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between border-b border-gray-800/60 pb-2">
              <span className="text-gray-400">Microservice</span>
              <span className="text-white font-bold">{incident.service}</span>
            </div>
            <div className="flex justify-between border-b border-gray-800/60 pb-2">
              <span className="text-gray-400">Severity</span>
              <span className="text-amber-400 font-bold">{incident.severity}</span>
            </div>
            <div className="flex justify-between border-b border-gray-800/60 pb-2">
              <span className="text-gray-400">Deployment Version</span>
              <span className="text-indigo-400 font-bold">{incident.deploymentVersion || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-800/60 pb-2">
              <span className="text-gray-400">Environment</span>
              <span className="text-gray-300">{incident.environment}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-gray-400">Reported At</span>
              <span className="text-gray-300">{new Date(incident.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-mono text-gray-400 block mb-1">Error Message</span>
            <div className="p-2.5 rounded bg-gray-950 border border-gray-800 text-rose-400 font-mono text-xs break-all">
              {incident.errorMessage}
            </div>
          </div>
        </div>

        {/* Right: Raw Logs & Description */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase text-gray-400 font-semibold tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" /> Log Excerpt & Stack Trace
            </h2>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{incident.description}</p>
          <div className="p-3.5 rounded-lg bg-gray-950 border border-gray-800 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56">
            {incident.logExcerpt || '// No explicit log excerpt attached.'}
          </div>
        </div>
      </div>

      {/* AI AGENT ANALYSIS & HINDSIGHT RECALL PANEL */}
      {analysis && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-950/40 via-gray-900 to-purple-950/20 border border-indigo-500/30 space-y-6 shadow-2xl">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  IncidentMind AI Diagnostic Analysis
                </h2>
                <p className="text-xs text-gray-400">
                  Powered by Hindsight Memory Recall & Agent Reasoning Engine
                </p>
              </div>
            </div>

            {/* Hindsight Match Status Indicator */}
            <div className="flex items-center gap-3 font-mono text-xs">
              <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                analysis.hasHistoricalMatch
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
              }`}>
                <Database className="w-3.5 h-3.5" />
                <span>{analysis.hasHistoricalMatch ? 'HINDSIGHT MEMORY MATCH FOUND' : 'NO PRIOR MEMORY MATCH'}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/40">
                Confidence: {(analysis.confidenceScore * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Recalled Memory Highlights Banner (VISIBLY SHOWS RECALL FROM HINDSIGHT) */}
          {analysis.hasHistoricalMatch && analysis.recalledMemories.length > 0 ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Recalled Historical Memory Citations</span>
              </div>
              <div className="space-y-2">
                {analysis.recalledMemories.map((mem, idx) => (
                  <div key={mem.id} className="p-3 rounded-lg bg-gray-900/90 border border-emerald-500/20 text-xs font-mono space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-300 font-bold">Memory #{idx + 1}: {mem.metadata?.title || mem.metadata?.service || mem.service || 'Microservice'}</span>
                      <span className="text-emerald-400 font-bold">Relevance: {(mem.similarity * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-gray-300"><strong className="text-gray-400">Previous Root Cause:</strong> {mem.metadata?.rootCause}</div>
                    <div className="text-indigo-300"><strong className="text-gray-400">Verified Resolution:</strong> {mem.metadata?.resolution}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 font-mono">
              Notice: No sufficiently similar historical incident was found in Hindsight Memory Bank. Generating standard diagnostic troubleshooting path.
            </div>
          )}

          {/* Explanation Rationale */}
          <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-gray-200 leading-relaxed font-sans">
            <span className="font-mono text-indigo-400 font-bold uppercase block mb-1">Agent Rationale & Context</span>
            {analysis.explanation}
          </div>

          {/* Recommended Resolution Box */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <h3 className="text-xs font-mono uppercase text-indigo-300 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Recommended Resolution Strategy
            </h3>
            <p className="text-sm font-medium text-white leading-relaxed">{analysis.recommendedResolution}</p>
          </div>

          {/* Investigation Steps & Root Causes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
              <h3 className="text-xs font-mono uppercase text-gray-400 font-semibold">Possible Root Causes</h3>
              <ul className="space-y-2 text-xs text-gray-300 font-sans">
                {analysis.possibleRootCauses.map((cause, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-mono font-bold">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
              <h3 className="text-xs font-mono uppercase text-gray-400 font-semibold">Recommended Investigation Steps</h3>
              <ol className="space-y-2 text-xs text-gray-300 font-sans">
                {analysis.recommendedInvestigationSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-mono font-bold">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION WORKFLOW DISPLAY (IF ALREADY RESOLVED) */}
      {incident.status === 'RESOLVED' && (
        <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-mono font-bold">
            <CheckCircle2 className="w-5 h-5" />
            <span>INCIDENT RESOLVED & RETAINED IN HINDSIGHT</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-gray-900/90 border border-gray-800">
              <span className="text-gray-400 block mb-1">Confirmed Root Cause</span>
              <span className="text-white font-sans">{incident.rootCause}</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-900/90 border border-gray-800">
              <span className="text-gray-400 block mb-1">Executed Resolution</span>
              <span className="text-emerald-300 font-sans">{incident.resolution}</span>
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL (RETAIN TO HINDSIGHT) */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" /> Resolve & Retain in Hindsight
              </h2>
              <button onClick={() => setShowResolveModal(false)} className="text-gray-400 hover:text-white font-mono text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-300 mb-1">Confirmed Root Cause *</label>
                <input
                  type="text"
                  required
                  value={resolveForm.rootCause}
                  onChange={(e) => setResolveForm({ ...resolveForm, rootCause: e.target.value })}
                  placeholder="e.g. Database connection pool exhaustion under high concurrency"
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-300 mb-1">Successful Resolution *</label>
                <textarea
                  required
                  rows={3}
                  value={resolveForm.resolution}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}
                  placeholder="e.g. Increased database connection pool size from 10 to 50 in deployment config and restarted service."
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 text-xs font-mono text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {resolving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Retaining to Hindsight Memory...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Retain Resolution to Memory Bank</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
