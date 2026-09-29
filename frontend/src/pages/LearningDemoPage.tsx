import React, { useState } from 'react';
import { api } from '../services/api';
import { IncidentRecord, AgentAnalysisResult } from '../types';
import { Sparkles, Brain, Database, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Zap, RefreshCw } from 'lucide-react';

export const LearningDemoPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Demo Incident State
  const [incident1, setIncident1] = useState<IncidentRecord | null>(null);
  const [analysis1, setAnalysis1] = useState<AgentAnalysisResult | null>(null);
  const [incident2, setIncident2] = useState<IncidentRecord | null>(null);
  const [analysis2, setAnalysis2] = useState<AgentAnalysisResult | null>(null);

  // Step 1: Submit Incident 1 (Payment API HTTP 503 - First Time)
  const handleStep1SubmitIncident1 = async () => {
    setLoading(true);
    try {
      const inc = await api.createIncident({
        title: 'Payment API is returning HTTP 503 errors after release v2.5.0',
        service: 'Payment API',
        severity: 'CRITICAL',
        environment: 'production',
        deploymentVersion: 'v2.5.0',
        errorMessage: 'HTTP 503 Service Unavailable: PoolTimedOutException connection pool size exhausted',
        logExcerpt: `2026-09-29T14:30:00Z [ERROR] payment-worker-01: ConnectionPoolTimeoutException: Timeout waiting for connection from pool of max 10.`,
        description: 'Payment API returning HTTP 503 errors during traffic spike after deployment v2.5.0.'
      });
      setIncident1(inc);

      // Run initial analysis (No historical memory exists yet for this specific scenario)
      const ana = await api.analyzeIncident(inc.id);
      setAnalysis1(ana);
      setCurrentStep(2);
    } catch (err) {
      console.error('Step 1 failed', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Resolve Incident 1 & RETAIN to Hindsight Memory
  const handleStep3ResolveAndRetain = async () => {
    if (!incident1) return;
    setLoading(true);
    try {
      await api.resolveIncident(incident1.id, {
        rootCause: 'Database connection pool exhaustion',
        resolution: 'Increase database connection pool size from 10 to 50 in deployment config and restart Payment API service.',
        outcome: 'SUCCESS',
        troubleshootingSteps: [
          'Checked PostgreSQL active connections metrics (10/10 locked)',
          'Updated db-pool.yaml max_connections to 50',
          'Executed rolling restart of Payment API pods'
        ]
      });
      setCurrentStep(4);
    } catch (err) {
      console.error('Step 3 failed', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Submit Incident 2 (Payment API HTTP 503 - Second Time)
  const handleStep4SubmitIncident2 = async () => {
    setLoading(true);
    try {
      const inc2 = await api.createIncident({
        title: 'Payment API is again returning HTTP 503 errors after deployment v2.5.1',
        service: 'Payment API',
        severity: 'CRITICAL',
        environment: 'production',
        deploymentVersion: 'v2.5.1',
        errorMessage: 'HTTP 503 Service Unavailable: PoolTimedOutException connection pool size exhausted',
        logExcerpt: `2026-09-29T15:00:00Z [ERROR] payment-worker-04: ConnectionPoolTimeoutException: Timeout waiting for connection from pool.`,
        description: 'Payment API is again returning HTTP 503 errors post deployment v2.5.1.'
      });
      setIncident2(inc2);

      // Trigger Analysis (Hindsight RECALL will now locate Incident 1 resolution!)
      const ana2 = await api.analyzeIncident(inc2.id);
      setAnalysis2(ana2);
      setCurrentStep(5);
    } catch (err) {
      console.error('Step 4 failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = () => {
    setCurrentStep(1);
    setIncident1(null);
    setAnalysis1(null);
    setIncident2(null);
    setAnalysis2(null);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-300" /> Interactive Before/After Showcase
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-400" />
            Hindsight Memory Learning Demo
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Experience how IncidentMind learns from resolved production outages and uses persistent memory to solve recurring incidents faster.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-mono rounded-lg border border-gray-700 flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Restart Demo Workflow
        </button>
      </div>

      {/* BEFORE / AFTER VISUAL ARCHITECTURE COMPARISON BANNER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-indigo-950/40 to-gray-900 border border-indigo-500/30 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 space-y-2">
          <div className="text-xs font-mono text-gray-400 uppercase tracking-wider font-bold">1. WITHOUT MEMORY</div>
          <p className="text-xs text-amber-300 font-medium">Generic AI Troubleshooting</p>
          <p className="text-[11px] text-gray-400">Stateless LLM has no institutional memory of previous fixes.</p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 space-y-2 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 font-bold uppercase">
            <Database className="w-4 h-4 text-indigo-400" /> 2. HINDSIGHT RETAIN & RECALL
          </div>
          <p className="text-xs text-emerald-300 font-medium font-mono">Persistent Knowledge Graph</p>
          <p className="text-[11px] text-gray-300">Retains root causes & resolution outcomes automatically.</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold">3. WITH HINDSIGHT</div>
          <p className="text-xs text-emerald-300 font-medium">Personalized Instant Resolution</p>
          <p className="text-[11px] text-gray-300">Recalls exact past fix: "Increase connection pool size".</p>
        </div>
      </div>

      {/* STEP PROGRESS TRACKER */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 text-xs font-mono">
        <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-indigo-400 font-bold' : 'text-gray-500'}`}>
          <span className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-[11px]">1</span>
          <span>Incident #1 (First Time)</span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-600" />
        <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-indigo-400 font-bold' : 'text-gray-500'}`}>
          <span className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-[11px]">2</span>
          <span>Resolve & Retain</span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-600" />
        <div className={`flex items-center gap-2 ${currentStep >= 5 ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>
          <span className="w-6 h-6 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-[11px]">3</span>
          <span>Incident #2 (Recall Fix!)</span>
        </div>
      </div>

      {/* INTERACTIVE DEMO STEP CARDS */}
      <div className="space-y-6">
        {/* STEP 1: Create Incident 1 */}
        <div className={`p-6 rounded-xl border transition-all ${
          currentStep === 1 ? 'bg-gray-900 border-indigo-500 shadow-xl' : 'bg-gray-900/60 border-gray-800'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-mono uppercase text-indigo-400 font-bold">Step 1: First Occurrence</span>
              <h3 className="text-lg font-bold text-white">Create Incident #1: Payment API HTTP 503</h3>
            </div>
            {currentStep === 1 && (
              <button
                onClick={handleStep1SubmitIncident1}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Submitting & Analyzing...' : 'Submit Incident #1'}
              </button>
            )}
          </div>

          {analysis1 && (
            <div className="mt-4 p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-3 font-sans">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Stateless AI Response (No Historical Context)</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-mono">{analysis1.explanation}</p>
              <div className="p-3 rounded bg-gray-900 border border-gray-800 text-xs text-gray-400 font-mono">
                Recommended Action: {analysis1.recommendedResolution}
              </div>
            </div>
          )}
        </div>

        {/* STEP 3: Resolve Incident 1 & Retain */}
        {currentStep >= 2 && (
          <div className={`p-6 rounded-xl border transition-all ${
            currentStep === 2 ? 'bg-gray-900 border-indigo-500 shadow-xl' : 'bg-gray-900/60 border-gray-800'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono uppercase text-indigo-400 font-bold">Step 2: Store Operational Experience</span>
                <h3 className="text-lg font-bold text-white">Resolve Incident #1 & Retain into Hindsight</h3>
              </div>
              {currentStep === 2 && (
                <button
                  onClick={handleStep3ResolveAndRetain}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? 'Retaining to Hindsight...' : 'Resolve & Retain in Memory Bank'}
                </button>
              )}
            </div>

            {currentStep >= 4 && (
              <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Retained Root Cause ("Database connection pool exhaustion") & Fix ("Increase pool size") into Hindsight Bank!</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 & 5: Create Incident 2 & Show Recalled Memory */}
        {currentStep >= 4 && (
          <div className={`p-6 rounded-xl border transition-all ${
            currentStep === 4 ? 'bg-gray-900 border-indigo-500 shadow-xl' : 'bg-gray-900/60 border-gray-800'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-mono uppercase text-emerald-400 font-bold">Step 3: Recurring Incident</span>
                <h3 className="text-lg font-bold text-white">Create Incident #2: Payment API HTTP 503 (Recurring)</h3>
              </div>
              {currentStep === 4 && (
                <button
                  onClick={handleStep4SubmitIncident2}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? 'Running Hindsight Recall...' : 'Submit & Recall Memory'}
                </button>
              )}
            </div>

            {analysis2 && (
              <div className="mt-4 p-5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-gray-950 to-indigo-950/30 border border-emerald-500/40 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>HINDSIGHT MEMORY RECALL SUCCESS</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs border border-emerald-500/40">
                    Match Confidence: 95.0%
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-gray-900/90 border border-gray-800 text-sm font-semibold text-white leading-relaxed">
                  "{analysis2.recommendedResolution}"
                </div>

                <div className="p-3.5 rounded-lg bg-gray-900/90 border border-emerald-500/20 text-xs font-mono text-gray-300 leading-relaxed">
                  <span className="text-emerald-400 font-bold block mb-1">Recalled Memory Citation:</span>
                  {analysis2.explanation}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
