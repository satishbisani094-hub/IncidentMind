import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MemoryExplorerEntry } from '../types';
import { Database, Search, Sparkles, Server, CheckCircle2, Bookmark, Code, ShieldCheck } from 'lucide-react';

export const MemoryExplorerPage: React.FC = () => {
  const [memories, setMemories] = useState<MemoryExplorerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const loadMemories = async () => {
    try {
      const data = await api.getMemories();
      setMemories(data);
    } catch (err) {
      console.error('Failed loading memory explorer data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const filteredMemories = memories.filter((m) => {
    const matchesSearch = !search || `${m.service} ${m.title} ${m.errorMessage} ${m.rootCause} ${m.resolution}`.toLowerCase().includes(search.toLowerCase());
    const matchesService = !serviceFilter || m.service === serviceFilter;
    return matchesSearch && matchesService;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 font-mono text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" /> Vectorize Hindsight Engine
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-400" />
          Hindsight Persistent Memory Explorer
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Inspect persistent memories retained in the Hindsight Bank (<code className="text-indigo-300 font-mono">incidentmind-production</code>).
        </p>
      </div>

      {/* Filter bar */}
      <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stored memory content, root causes, resolutions..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
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
      </div>

      {/* Grid of Hindsight Memory Cards */}
      {loading ? (
        <div className="py-12 flex justify-center text-indigo-400 font-mono text-xs">
          Loading Hindsight Memory Bank entries...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMemories.map((mem, idx) => (
            <div
              key={mem.id}
              className="p-5 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-indigo-500/40 transition-all space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                    Memory #{idx + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono uppercase font-bold">
                    {mem.memoryType}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">{new Date(mem.createdAt).toLocaleDateString()}</span>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-gray-300 mb-1">
                  <Server className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Service: {mem.service}</span>
                </div>
                <h3 className="text-sm font-bold text-white font-sans">{mem.title}</h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-gray-950 border border-gray-800 text-rose-300 truncate">
                  <strong className="text-gray-400">Error Pattern:</strong> {mem.errorMessage}
                </div>

                <div className="p-2.5 rounded bg-gray-950 border border-gray-800 text-amber-300">
                  <strong className="text-gray-400 block mb-0.5">Root Cause:</strong>
                  <span className="font-sans text-gray-200">{mem.rootCause}</span>
                </div>

                <div className="p-2.5 rounded bg-gray-950 border border-indigo-500/30 text-emerald-300">
                  <strong className="text-indigo-400 block mb-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Resolution:
                  </strong>
                  <span className="font-sans text-emerald-200">{mem.resolution}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
