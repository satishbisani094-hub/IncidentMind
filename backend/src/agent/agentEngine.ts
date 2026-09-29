import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { memoryService } from '../hindsight/memoryService.js';
import { buildAgentAnalysisPrompt } from './prompts.js';
import { IncidentRecord, AgentAnalysisResult, RecalledMemory } from '../types/index.js';
import crypto from 'crypto';

export class IncidentAgentEngine {
  private aiClient: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      this.aiClient = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  /**
   * Main Diagnostic Workflow:
   * 1. Hindsight RECALL -> retrieve matching memories
   * 2. Construct enriched memory prompt
   * 3. Send to LLM (or fallback structured synthesis)
   * 4. Return structured JSON agent analysis
   */
  async analyzeIncident(incident: IncidentRecord): Promise<AgentAnalysisResult> {
    // Step 1: Hindsight RECALL
    const searchQuery = `${incident.service} ${incident.title} ${incident.errorMessage} ${incident.description}`;
    const recalledMemories = await memoryService.recallMemories(searchQuery, incident.service, incident.id);

    console.log(`[Agent Engine] Recalled ${recalledMemories.length} memories for incident ${incident.id} (${incident.service})`);

    // Step 2: Build Agent Prompt
    const promptText = buildAgentAnalysisPrompt(incident, recalledMemories);

    let analysisJSON: Partial<AgentAnalysisResult> | null = null;

    // Step 3: LLM Inference
    if (this.aiClient) {
      try {
        const model = this.aiClient.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' }
        });
        const result = await model.generateContent(promptText);
        const textResponse = result.response.text();
        if (textResponse) {
          analysisJSON = JSON.parse(textResponse.replace(/```json/g, '').replace(/```/g, '').trim());
        }
      } catch (err) {
        console.warn(`[Agent Engine Warning] LLM API call failed, falling back to deterministic agent synthesis:`, err);
      }
    }

    // Step 4: Deterministic Memory-Aware Fallback (ensures 100% reliable responses)
    if (!analysisJSON) {
      analysisJSON = this.generateDeterministicAnalysis(incident, recalledMemories);
    }

    const hasMatch = recalledMemories.length > 0;

    const result: AgentAnalysisResult = {
      id: `analysis_${crypto.randomUUID()}`,
      incidentId: incident.id,
      summary: analysisJSON.summary || `Analysis of ${incident.severity} incident on ${incident.service}`,
      possibleRootCauses: analysisJSON.possibleRootCauses || [
        hasMatch && recalledMemories[0].metadata?.rootCause
          ? recalledMemories[0].metadata.rootCause
          : `Potential configuration or resource bottleneck in ${incident.service}`
      ],
      historicalSimilarIncidents: analysisJSON.historicalSimilarIncidents || recalledMemories.map((m) => ({
        incidentId: m.incidentId,
        title: m.metadata?.title || 'Historical Incident',
        service: m.service || incident.service,
        rootCause: m.metadata?.rootCause || 'Root Cause recorded in memory',
        resolution: m.metadata?.resolution || 'Resolution recorded in memory',
        relevanceScore: m.similarity,
        explanation: `Recalled from Hindsight Memory Bank based on error pattern match: ${m.errorMessage}`
      })),
      recommendedInvestigationSteps: analysisJSON.recommendedInvestigationSteps || [
        `1. Inspect ${incident.service} logs for: ${incident.errorMessage}`,
        `2. Compare deployment version ${incident.deploymentVersion || 'latest'} against prior stable release`,
        `3. Verify database and upstream connection metrics`
      ],
      recommendedResolution: analysisJSON.recommendedResolution || (
        hasMatch && recalledMemories[0].metadata?.resolution
          ? `[HISTORICAL MEMORY RECOMMENDATION]: ${recalledMemories[0].metadata.resolution}`
          : `Verify configuration parameters and restart the affected ${incident.service} instances.`
      ),
      relevantPreviousSolutions: analysisJSON.relevantPreviousSolutions || (
        hasMatch ? recalledMemories.map((m) => m.metadata?.resolution || m.content).filter(Boolean) : []
      ),
      explanation: analysisJSON.explanation || (
        hasMatch
          ? `Recalled previous incident memory for ${incident.service} with matching error pattern (${recalledMemories[0].metadata?.errorMessage || incident.errorMessage}). Recommendation prioritized historical solution: "${recalledMemories[0].metadata?.resolution}".`
          : `No sufficiently similar historical incident was found in Hindsight Memory Bank. Provided standard diagnostic breakdown based on error pattern.`
      ),
      confidenceScore: hasMatch ? 0.94 : 0.75,
      hasHistoricalMatch: hasMatch,
      recalledMemories: recalledMemories,
      createdAt: new Date().toISOString()
    };

    return result;
  }

  private generateDeterministicAnalysis(incident: IncidentRecord, memories: RecalledMemory[]): Partial<AgentAnalysisResult> {
    const topMemory = memories.length > 0 ? memories[0] : null;

    if (topMemory) {
      return {
        summary: `Incident on ${incident.service} resembles historical incident (${topMemory.metadata?.title || 'Prior Incident'}). Recalled root cause and fix from Hindsight memory.`,
        possibleRootCauses: [
          topMemory.metadata?.rootCause || 'Database connection pool exhaustion',
          'Resource exhaustion post deployment'
        ],
        historicalSimilarIncidents: memories.map((m) => ({
          incidentId: m.incidentId,
          title: m.metadata?.title || `${m.service || incident.service} Incident`,
          service: m.service || incident.service,
          rootCause: m.metadata?.rootCause || 'Root Cause in Memory',
          resolution: m.metadata?.resolution || 'Resolution in Memory',
          relevanceScore: m.similarity,
          explanation: `Hindsight Memory Match: Recalled matching symptoms and fix (${m.metadata?.errorMessage || m.errorMessage || ''})`
        })),
        recommendedInvestigationSteps: [
          `1. Check ${incident.service} active connections and pool exhaustion metrics.`,
          `2. Verify configuration changes in deployment tag ${incident.deploymentVersion || 'latest'}.`,
          `3. Execute verified historical resolution.`
        ],
        recommendedResolution: `I found a previous incident with similar symptoms involving ${incident.service}. The previous root cause was "${topMemory.metadata?.rootCause}". The successful resolution was: "${topMemory.metadata?.resolution}".`,
        relevantPreviousSolutions: memories.map((m) => m.metadata?.resolution || m.content),
        explanation: `I found a previous incident with similar symptoms involving ${incident.service}. The previous root cause was ${topMemory.metadata?.rootCause}. The successful resolution was ${topMemory.metadata?.resolution}.`,
        confidenceScore: 0.95,
        hasHistoricalMatch: true
      };
    }

    return {
      summary: `Initial diagnosis for ${incident.title} on ${incident.service}. No prior incident memories matched.`,
      possibleRootCauses: [
        'Unexpected service exception or unhandled promise rejection',
        'Downstream API timeout or resource limit reached'
      ],
      historicalSimilarIncidents: [],
      recommendedInvestigationSteps: [
        `1. Review live log output for ${incident.service}.`,
        `2. Check CPU / Memory metrics around timestamp ${incident.createdAt}.`,
        `3. Verify network gateway latency.`
      ],
      recommendedResolution: `Investigate service logs and restart ${incident.service} after adjusting environment configuration.`,
      relevantPreviousSolutions: [],
      explanation: 'No sufficiently similar historical incident was found in Hindsight Memory Bank. Generated generic initial diagnostic plan.',
      confidenceScore: 0.72,
      hasHistoricalMatch: false
    };
  }
}

export const agentEngine = new IncidentAgentEngine();
