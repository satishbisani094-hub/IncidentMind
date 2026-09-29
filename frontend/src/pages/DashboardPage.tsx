import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { AlertTriangle, CheckCircle2, Clock, Database, ArrowRight, Activity, Server, Zap } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed loading dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-indigo-400 font-mono text-sm">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading IncidentMind Dashboard...</span>
        </div>
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            Engineering Ops Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time incident response telemetry powered by Hindsight persistent memory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/learning-demo"
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Launch Learning Demo</span>
          </Link>
          <Link
            to="/create-incident"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white border border-gray-700 rounded-lg text-sm font-medium transition-all"
          >
            Report Incident
          </Link>
        </div>
      </div>

      {/* Primary Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Incidents */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">Active Incidents</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{stats?.activeIncidents || 0}</span>
            <span className="text-xs text-amber-400 font-mono">Requires Attention</span>
          </div>
        </div>

        {/* Resolved Incidents */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">Resolved Incidents</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{stats?.resolvedIncidents || 0}</span>
            <span className="text-xs text-emerald-400 font-mono">Knowledge Retained</span>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">Critical Severity</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{stats?.criticalIncidents || 0}</span>
            <span className="text-xs text-rose-400 font-mono">Priority P0/P1</span>
          </div>
        </div>

        {/* Hindsight Memories Stored */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/30 border border-indigo-500/30 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider font-mono">Hindsight Memories</span>
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{stats?.totalMemoriesStored || 0}</span>
            <span className="text-xs text-indigo-300 font-mono">Experiences Retained</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Frequently Affected Services & Memory Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Affected Services breakdown */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-gray-900/80 border border-gray-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Frequently Affected Microservices
              </h2>
              <p className="text-xs text-gray-400">Services with registered historical incidents and memory traces</p>
            </div>
            <Link to="/incidents" className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.frequentlyAffectedServices.map((item, idx) => {
              const maxCount = stats.frequentlyAffectedServices[0]?.count || 1;
              const percentage = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.service} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-200 font-medium">{item.service}</span>
                    <span className="text-gray-400">{item.count} Incidents ({percentage}% severity index)</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-indigo-500' : idx === 1 ? 'bg-purple-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hindsight Memory Health */}
        <div className="p-6 rounded-xl bg-gray-900/80 border border-gray-800 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Hindsight Memory Architecture
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60 flex items-center justify-between">
              <span className="text-gray-400">Memory Provider</span>
              <span className="text-emerald-400 font-bold">Vectorize Hindsight Engine</span>
            </div>

            <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60 flex items-center justify-between">
              <span className="text-gray-400">Experiences (Incidents)</span>
              <span className="text-indigo-400 font-bold">{stats?.memoryStats.totalExperiences} records</span>
            </div>

            <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60 flex items-center justify-between">
              <span className="text-gray-400">Observations (Root Causes)</span>
              <span className="text-purple-400 font-bold">{stats?.memoryStats.totalObservations} synthesized</span>
            </div>

            <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60 flex items-center justify-between">
              <span className="text-gray-400">Average MTTR</span>
              <span className="text-amber-400 font-bold">{stats?.avgResolutionTimeMinutes} mins (35% faster)</span>
            </div>
          </div>

          <Link
            to="/memory"
            className="w-full mt-2 py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-mono rounded-lg border border-gray-700 flex items-center justify-center gap-2 transition-all"
          >
            Explore Hindsight Bank <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="p-6 rounded-xl bg-gray-900/80 border border-gray-800">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Recent Engineering Incidents</h2>
          <Link to="/incidents" className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1">
            View All Incidents <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 uppercase font-mono tracking-wider">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Incident Title</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {stats?.recentIncidents.slice(0, 5).map((inc) => (
                <tr key={inc.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-indigo-400 font-semibold">{inc.id}</td>
                  <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">{inc.title}</td>
                  <td className="py-3.5 px-4 font-mono text-gray-300">{inc.service}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${getSeverityBadge(inc.severity)}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                      inc.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Link
                      to={`/incidents/${inc.id}`}
                      className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-mono transition-all"
                    >
                      Investigate →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
