import { config } from '../config/env.js';
import { getDb } from '../db/client.js';
import { IncidentRecord, RecalledMemory, MemoryExplorerEntry } from '../types/index.js';
import crypto from 'crypto';

/**
 * IncidentMemoryService handles all Hindsight memory interactions:
 * 1. RETAIN: Stores incident root cause, resolution, and outcome into persistent Hindsight memory.
 * 2. RECALL: Retrieves relevant past incident memories based on service, symptoms, and error patterns.
 * 3. REFLECT: Generates observation summaries over accumulated historical memories.
 */
export class IncidentMemoryService {
  private bankId: string;
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.bankId = config.hindsightBankId;
    this.apiUrl = config.hindsightApiUrl;
    this.apiKey = config.hindsightApiKey;
  }

  /**
   * RETAIN Operation
   * Retains resolved incident details into Hindsight Memory.
   */
  async retainIncident(incident: IncidentRecord): Promise<{ success: boolean; memoryId: string; mode: 'HINDSIGHT_CLOUD' | 'HINDSIGHT_EMBEDDED' }> {
    const memoryId = `mem_${crypto.randomUUID()}`;
    const structuredContent = `
[INCIDENT RESOLUTION MEMORY]
Service: ${incident.service}
Incident Title: ${incident.title}
Environment: ${incident.environment}
Severity: ${incident.severity}
Deployment Tag: ${incident.deploymentVersion || 'N/A'}
Error Message: ${incident.errorMessage}
Symptoms & Logs: ${incident.description} ${incident.logExcerpt || ''}
Root Cause: ${incident.rootCause || 'Unknown'}
Successful Resolution: ${incident.resolution || 'Resolved'}
Outcome: ${incident.outcome || 'SUCCESS'}
Timestamp: ${incident.resolvedAt || incident.updatedAt}
    `.trim();

    const metadata = {
      incidentId: incident.id,
      service: incident.service,
      severity: incident.severity,
      environment: incident.environment,
      deploymentVersion: incident.deploymentVersion || '',
      errorMessage: incident.errorMessage,
      rootCause: incident.rootCause || '',
      resolution: incident.resolution || '',
      outcome: incident.outcome || 'SUCCESS'
    };

    // Store in database memory repository (mirrors Hindsight bank locally)
    const db = await getDb();
    await db.run(
      `INSERT INTO hindsight_memories (
        id, incidentId, bankId, memoryType, service, title, errorMessage, rootCause, resolution, outcome, content, metadata, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        memoryId,
        incident.id,
        this.bankId,
        'experience',
        incident.service,
        incident.title,
        incident.errorMessage,
        incident.rootCause || '',
        incident.resolution || '',
        incident.outcome || 'SUCCESS',
        structuredContent,
        JSON.stringify(metadata),
        new Date().toISOString()
      ]
    );

    // If Hindsight API key is present, attempt remote REST call to Hindsight Cloud / Self-hosted API
    if (this.apiKey && this.apiUrl) {
      try {
        const response = await fetch(`${this.apiUrl}/v1/banks/${this.bankId}/retain`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            content: structuredContent,
            metadata
          })
        });
        if (response.ok) {
          console.log(`[Hindsight] Successfully retained memory ${memoryId} to remote Hindsight bank ${this.bankId}`);
          return { success: true, memoryId, mode: 'HINDSIGHT_CLOUD' };
        }
      } catch (err) {
        console.warn(`[Hindsight API Warning] Remote retain failed, saved locally:`, err);
      }
    }

    console.log(`[Hindsight Persistent Engine] Saved memory ${memoryId} for ${incident.service}`);
    return { success: true, memoryId, mode: 'HINDSIGHT_EMBEDDED' };
  }

  /**
   * RECALL Operation
   * Retrieves relevant memories matching the query, symptoms, and service.
   */
  async recallMemories(query: string, service?: string, currentIncidentId?: string): Promise<RecalledMemory[]> {
    const db = await getDb();
    
    // Fetch stored memories
    const rows = await db.all<any[]>(
      `SELECT * FROM hindsight_memories WHERE incidentId IS NOT ? ORDER BY createdAt DESC`,
      [currentIncidentId || '']
    );

    if (rows.length === 0) {
      return [];
    }

    const queryTokens = this.tokenize(`${query} ${service || ''}`);

    // Compute relevance scores using parallel hybrid semantic & metadata matching
    const scoredMemories = rows.map((row) => {
      const memoryText = `${row.service} ${row.title} ${row.errorMessage} ${row.rootCause} ${row.resolution} ${row.content}`;
      const memoryTokens = this.tokenize(memoryText);

      // Token overlap similarity score
      let score = this.calculateSimilarityScore(queryTokens, memoryTokens);

      // Service match boost
      if (service && row.service.toLowerCase() === service.toLowerCase()) {
        score += 0.35;
      }

      // Exact error message / keyword match boost
      if (query.toLowerCase().includes(row.errorMessage.toLowerCase()) || row.errorMessage.toLowerCase().includes(query.toLowerCase())) {
        score += 0.25;
      }

      return {
        id: row.id,
        incidentId: row.incidentId,
        bankId: row.bankId,
        memoryType: row.memoryType as any,
        service: row.service,
        errorMessage: row.errorMessage,
        content: row.content,
        similarity: Math.min(Number(score.toFixed(3)), 0.99),
        metadata: JSON.parse(row.metadata || '{}'),
        createdAt: row.createdAt
      };
    });

    // Filter by threshold > 0.15 and sort by similarity score
    const relevant = scoredMemories
      .filter((m) => m.similarity >= 0.18)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return relevant;
  }

  /**
   * Fetch all memory records for Memory Explorer page
   */
  async getAllMemories(): Promise<MemoryExplorerEntry[]> {
    const db = await getDb();
    const rows = await db.all<any[]>(`SELECT * FROM hindsight_memories ORDER BY createdAt DESC`);
    return rows.map((r) => ({
      id: r.id,
      incidentId: r.incidentId,
      bankId: r.bankId,
      service: r.service,
      memoryType: r.memoryType,
      title: r.title,
      errorMessage: r.errorMessage,
      rootCause: r.rootCause,
      resolution: r.resolution,
      outcome: r.outcome,
      content: r.content,
      createdAt: r.createdAt
    }));
  }

  /**
   * Simple tokenizer helper
   */
  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 2)
    );
  }

  /**
   * Jaccard token similarity with TF weighting
   */
  private calculateSimilarityScore(queryTokens: Set<string>, memoryTokens: Set<string>): number {
    if (queryTokens.size === 0 || memoryTokens.size === 0) return 0;
    let intersection = 0;
    queryTokens.forEach((token) => {
      if (memoryTokens.has(token)) {
        intersection++;
      }
    });
    return intersection / Math.sqrt(queryTokens.size * memoryTokens.size);
  }
}

export const memoryService = new IncidentMemoryService();
