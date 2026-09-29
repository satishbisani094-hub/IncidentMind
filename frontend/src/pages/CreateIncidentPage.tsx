import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { PlusCircle, Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react';

export const CreateIncidentPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    service: 'Payment API',
    severity: 'CRITICAL',
    environment: 'production',
    deploymentVersion: 'v2.4.2',
    errorMessage: '',
    logExcerpt: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePresetPayment503 = () => {
    setFormData({
      title: 'Payment API is returning HTTP 503 errors after deployment v2.4.2',
      service: 'Payment API',
      severity: 'CRITICAL',
      environment: 'production',
      deploymentVersion: 'v2.4.2',
      errorMessage: 'HTTP 503 Service Unavailable: PoolTimedOutException connection pool size exhausted',
      logExcerpt: `2026-09-29T14:00:01Z [ERROR] payment-worker-01: ConnectionPoolTimeoutException: Timeout waiting for connection from pool.
2026-09-29T14:00:03Z [WARN] api-gateway: Upstream Payment API returned HTTP 503.`,
      description: 'Payment API is returning HTTP 503 errors after recent deployment v2.4.2 during morning traffic spike.'
    });
  };

  const handlePresetAuth401 = () => {
    setFormData({
      title: 'Authentication Service returning HTTP 401 JWT verification failures',
      service: 'Authentication Service',
      severity: 'HIGH',
      environment: 'production',
      deploymentVersion: 'v1.9.1',
      errorMessage: 'JWTVerificationException: SignatureVerificationException invalid secret key signature',
      logExcerpt: `2026-09-29T14:10:00Z [ERROR] auth-svc-01: RS256 key mismatch with cache.`,
      description: 'Users logged out across mobile and web clients due to JWT signature mismatch.'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const incident = await api.createIncident(formData as any);
      // Automatically navigate to detail page & trigger analysis
      await api.analyzeIncident(incident.id);
      navigate(`/incidents/${incident.id}`);
    } catch (err) {
      console.error('Failed to create incident', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-mono mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-indigo-400" />
            Report Production Incident
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Log an active incident to trigger IncidentMind's Hindsight memory recall and diagnostic engine.
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePresetPayment503}
            className="px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Preset: Payment API 503</span>
          </button>
          <button
            type="button"
            onClick={handlePresetAuth401}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono border border-gray-700 transition-all"
          >
            Preset: Auth API 401
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-gray-900/80 border border-gray-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">Incident Title *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Payment API is returning HTTP 503 errors after deployment"
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Service */}
          <div>
            <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">Affected Microservice *</label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="Payment API">Payment API</option>
              <option value="Authentication Service">Authentication Service</option>
              <option value="Order Service">Order Service</option>
              <option value="Notification Service">Notification Service</option>
              <option value="User Service">User Service</option>
              <option value="Database Service">Database Service</option>
              <option value="API Gateway">API Gateway</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">Severity Level *</label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="CRITICAL">CRITICAL (P0 - Service Down)</option>
              <option value="HIGH">HIGH (P1 - Major Feature Broken)</option>
              <option value="MEDIUM">MEDIUM (P2 - Degraded Performance)</option>
              <option value="LOW">LOW (P3 - Minor Issue)</option>
            </select>
          </div>

          {/* Environment */}
          <div>
            <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">Environment</label>
            <input
              type="text"
              name="environment"
              value={formData.environment}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Deployment Version */}
          <div>
            <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">Deployment Tag / Version</label>
            <input
              type="text"
              name="deploymentVersion"
              value={formData.deploymentVersion}
              onChange={handleChange}
              placeholder="e.g. v2.4.2"
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Error Message */}
          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">Primary Error Message *</label>
            <input
              type="text"
              name="errorMessage"
              required
              value={formData.errorMessage}
              onChange={handleChange}
              placeholder="e.g. HTTP 503 Service Unavailable: PoolTimedOutException connection pool size 10 exhausted"
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">Incident Description & Symptoms *</label>
            <textarea
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what happened, customer impact, error rates..."
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Log Excerpt */}
          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">Stack Trace / Log Snippet</label>
            <textarea
              name="logExcerpt"
              rows={4}
              value={formData.logExcerpt}
              onChange={handleChange}
              placeholder="Paste raw log lines or stack traces..."
              className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={() => navigate('/incidents')}
            className="px-4 py-2 text-xs font-mono text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Hindsight Recall & Agent Diagnostics...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Submit Incident & Analyze with Hindsight</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
