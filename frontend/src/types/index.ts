export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
export type ResolutionOutcome = 'SUCCESS' | 'PARTIAL' | 'WORKAROUND' | 'FAILED';

export interface IncidentRecord {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  service: string;
  environment: string;
  errorMessage: string;
  logExcerpt?: string;
  deploymentVersion?: string;
  description: string;
  rootCause?: string;
  troubleshootingSteps?: string[];
  resolution?: string;
  outcome?: ResolutionOutcome;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecalledMemory {
  id: string;
  incidentId?: string;
  bankId: string;
  memoryType: 'experience' | 'observation' | 'fact' | 'mental_model';
  content: string;
  similarity: number;
  service?: string;
  errorMessage?: string;
  metadata: {
    service?: string;
    severity?: string;
    rootCause?: string;
    resolution?: string;
    outcome?: string;
    errorMessage?: string;
    title?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export interface AgentAnalysisResult {
  id: string;
  incidentId: string;
  summary: string;
  possibleRootCauses: string[];
  historicalSimilarIncidents: Array<{
    incidentId?: string;
    title: string;
    service: string;
    rootCause: string;
    resolution: string;
    relevanceScore: number;
    explanation: string;
  }>;
  recommendedInvestigationSteps: string[];
  recommendedResolution: string;
  relevantPreviousSolutions: string[];
  explanation: string;
  confidenceScore: number;
  hasHistoricalMatch: boolean;
  recalledMemories: RecalledMemory[];
  createdAt: string;
}

export interface MemoryExplorerEntry {
  id: string;
  incidentId?: string;
  bankId: string;
  service: string;
  memoryType: string;
  title: string;
  errorMessage: string;
  rootCause: string;
  resolution: string;
  outcome: string;
  content: string;
  createdAt: string;
}

export interface DashboardStats {
  activeIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  avgResolutionTimeMinutes: number;
  totalMemoriesStored: number;
  frequentlyAffectedServices: Array<{ service: string; count: number }>;
  recentIncidents: IncidentRecord[];
  memoryStats: {
    totalExperiences: number;
    totalObservations: number;
    totalFacts: number;
    hindsightStatus: 'CONNECTED' | 'FALLBACK_EMBEDDED';
  };
}
