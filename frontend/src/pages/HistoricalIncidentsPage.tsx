import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { IncidentRecord } from '../types';
import { Search, Filter, AlertCircle, ArrowRight } from 'lucide-react';

export const HistoricalIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents({
        service: selectedService || undefined,
        severity: selectedSeverity || undefined,
        search: search || undefined
      });
      setIncidents(data);
    } catch (err) {
      console.error('Failed to load incidents catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [selectedService, selectedSeverity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadIncidents();
  };

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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-indigo-400" />
          Historical Incidents Knowledge Catalog
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Search previous production outages, root cause post-mortems, and resolutions retained in Hindsight memory.
        </p>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search error messages, root causes, services..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto font-mono text-xs">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Services</option>
            <option value="Payment API">Payment API</option>
            <option value="Authentication Service">Authentication Service</option>
            <option value="Order Service">Order Service</option>
            <option value="Notification Service">Notification Service</option>
            <option value="User Service">User Service</option>
            <option value="Database Service">Database Service</option>
            <option value="API Gateway">API Gateway</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-xl bg-gray-900/80 border border-gray-800">
        {loading ? (
          <div className="py-12 flex justify-center text-indigo-400 font-mono text-xs">
            Loading incident records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Incident Title</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Confirmed Root Cause</th>
                  <th className="py-3 px-4">Resolution</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-indigo-400 font-semibold">{inc.id}</td>
                    <td className="py-3.5 px-4 font-medium text-white max-w-xs">{inc.title}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-300">{inc.service}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-gray-400 truncate">{inc.rootCause || 'Under investigation'}</td>
                    <td className="py-3.5 px-4 max-w-xs text-emerald-400 truncate">{inc.resolution || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/incidents/${inc.id}`}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-mono flex items-center gap-1 transition-all"
                      >
                        Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
