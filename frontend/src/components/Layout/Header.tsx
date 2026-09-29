import React from 'react';
import { ShieldAlert, Database, Cpu, RefreshCw, Zap } from 'lucide-react';
import { api } from '../../services/api';

interface HeaderProps {
  onSeedReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSeedReset }) => {
  const [resetting, setResetting] = React.useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.seedDatabase();
      if (onSeedReset) onSeedReset();
    } catch (err) {
      console.error('Seed reset failed', err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white font-mono">IncidentMind</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full uppercase">
              Hindsight AI Agent
            </span>
          </div>
          <p className="text-xs text-gray-400">Autonomous Incident Response with Persistent Memory</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Hindsight Status Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>HINDSIGHT BANK: ACTIVE</span>
        </div>

        {/* Quick Seed Button */}
        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white border border-gray-700 rounded-lg transition-all disabled:opacity-50"
          title="Reset and populate 20+ realistic incident dataset"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Seeding...' : 'Reset Seed Data'}</span>
        </button>

        {/* Demo Tag */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg font-mono">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Hackathon Demo Mode</span>
        </div>
      </div>
    </header>
  );
};
