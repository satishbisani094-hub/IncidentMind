import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, PlusCircle, Database, Sparkles, BookOpen } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/incidents', label: 'Incidents Catalog', icon: AlertCircle },
    { to: '/create-incident', label: 'Report Incident', icon: PlusCircle },
    { to: '/memory', label: 'Memory Explorer', icon: Database },
    { to: '/learning-demo', label: 'Memory Learning Demo', icon: Sparkles, badge: 'KEY DEMO' },
  ];

  return (
    <aside className="w-64 bg-[#0B0F19] border-r border-gray-800 flex flex-col justify-between p-4 shrink-0 font-sans">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider font-mono mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500 text-white rounded font-mono animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Persistent Hindsight Callout Card */}
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-indigo-950/40 to-purple-950/20 border border-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Hindsight Agentic Memory</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Stores past resolutions, root causes & operational outcomes. Automatically recalls historical fixes on recurring incidents.
          </p>
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-4 border-t border-gray-800/80 text-[11px] text-gray-500 font-mono flex flex-col gap-1">
        <div>IncidentMind v1.0.0</div>
        <div className="text-gray-600">Vectorize Hindsight SDK</div>
      </div>
    </aside>
  );
};
