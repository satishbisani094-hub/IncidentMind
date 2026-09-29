import { getDb } from '../db/client.js';
import { memoryService } from '../hindsight/memoryService.js';
import { IncidentRecord, RecalledMemory } from '../types/index.js';

export const agentToolDefinitions = [
  {
    name: 'recallIncidentMemory',
    description: 'Recalls historical memories from Hindsight Memory Bank based on service, symptoms, and error messages.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Search query combining error messages and symptoms' },
        service: { type: 'STRING', description: 'Target microservice name e.g. Payment API' }
      },
      required: ['query']
    }
  },
  {
    name: 'getIncident',
    description: 'Retrieves full metadata and logs of the target incident by ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        incidentId: { type: 'STRING', description: 'Unique identifier of the incident' }
      },
      required: ['incidentId']
    }
  },
  {
    name: 'searchHistoricalIncidents',
    description: 'Searches database records for historical resolved incidents.',
    parameters: {
      type: 'OBJECT',
      properties: {
        service: { type: 'STRING', description: 'Service name' },
        keyword: { type: 'STRING', description: 'Keyword search' }
      }
    }
  }
];

export class AgentToolExecutor {
  async executeTool(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'recallIncidentMemory': {
        const memories = await memoryService.recallMemories(args.query, args.service);
        return { success: true, count: memories.length, memories };
      }

      case 'getIncident': {
        const db = await getDb();
        const incident = await db.get<IncidentRecord>(`SELECT * FROM incidents WHERE id = ?`, [args.incidentId]);
        return incident ? { success: true, incident } : { success: false, error: 'Incident not found' };
      }

      case 'searchHistoricalIncidents': {
        const db = await getDb();
        let query = `SELECT * FROM incidents WHERE status = 'RESOLVED'`;
        const params: any[] = [];

        if (args.service) {
          query += ` AND service LIKE ?`;
          params.push(`%${args.service}%`);
        }
        if (args.keyword) {
          query += ` AND (title LIKE ? OR errorMessage LIKE ? OR rootCause LIKE ?)`;
          params.push(`%${args.keyword}%`, `%${args.keyword}%`, `%${args.keyword}%`);
        }

        query += ` ORDER BY createdAt DESC LIMIT 5`;
        const rows = await db.all<IncidentRecord[]>(query, params);
        return { success: true, count: rows.length, incidents: rows };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }
}
