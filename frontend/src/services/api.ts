import { DashboardStats, IncidentRecord, AgentAnalysisResult, MemoryExplorerEntry, RecalledMemory } from '../types';

const API_BASE = '/api';

export const api = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    const data = await res.json();
    return data.stats;
  },

  // Incidents
  getIncidents: async (filters?: { service?: string; severity?: string; status?: string; search?: string }): Promise<IncidentRecord[]> => {
    const query = new URLSearchParams(filters as any || {}).toString();
    const res = await fetch(`${API_BASE}/incidents?${query}`);
    const data = await res.json();
    return data.incidents;
  },

  getIncidentById: async (id: string): Promise<{ incident: IncidentRecord; latestAnalysis: AgentAnalysisResult | null }> => {
    const res = await fetch(`${API_BASE}/incidents/${id}`);
    const data = await res.json();
    return { incident: data.incident, latestAnalysis: data.latestAnalysis };
  },

  createIncident: async (incidentData: Partial<IncidentRecord>): Promise<IncidentRecord> => {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incidentData)
    });
    const data = await res.json();
    return data.incident;
  },

  analyzeIncident: async (id: string): Promise<AgentAnalysisResult> => {
    const res = await fetch(`${API_BASE}/incidents/${id}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    return data.analysis;
  },

  resolveIncident: async (id: string, resolutionData: { rootCause: string; resolution: string; outcome?: string; troubleshootingSteps?: string[] }): Promise<{ incident: IncidentRecord; hindsightRetain: any }> => {
    const res = await fetch(`${API_BASE}/incidents/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolutionData)
    });
    const data = await res.json();
    return { incident: data.incident, hindsightRetain: data.hindsightRetain };
  },

  // Memories
  getMemories: async (): Promise<MemoryExplorerEntry[]> => {
    const res = await fetch(`${API_BASE}/memories`);
    const data = await res.json();
    return data.memories;
  },

  recallMemories: async (query: string, service?: string): Promise<RecalledMemory[]> => {
    const res = await fetch(`${API_BASE}/memories/recall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, service })
    });
    const data = await res.json();
    return data.memories;
  },

  seedDatabase: async (): Promise<void> => {
    await fetch(`${API_BASE}/demo/seed`, {
      method: 'POST'
    });
  }
};
