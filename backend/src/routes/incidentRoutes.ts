import { Router } from 'express';
import { getDb } from '../db/client.js';
import { agentEngine } from '../agent/agentEngine.js';
import { memoryService } from '../hindsight/memoryService.js';
import { IncidentRecord } from '../types/index.js';
import crypto from 'crypto';

const router = Router();

// GET /api/incidents - List incidents with filtering & pagination
router.get('/incidents', async (req, res, next) => {
  try {
    const { service, severity, status, search } = req.query;
    const db = await getDb();

    let sql = `SELECT * FROM incidents WHERE 1=1`;
    const params: any[] = [];

    if (service) {
      sql += ` AND service = ?`;
      params.push(service);
    }
    if (severity) {
      sql += ` AND severity = ?`;
      params.push(severity);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (title LIKE ? OR errorMessage LIKE ? OR service LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY createdAt DESC`;

    const rows = await db.all<any[]>(sql, params);
    const incidents: IncidentRecord[] = rows.map((r) => ({
      ...r,
      troubleshootingSteps: r.troubleshootingSteps ? JSON.parse(r.troubleshootingSteps) : []
    }));

    res.json({ success: true, count: incidents.length, incidents });
  } catch (err) {
    next(err);
  }
});

// POST /api/incidents - Create a new incident
router.post('/incidents', async (req, res, next) => {
  try {
    const { title, severity, service, environment, errorMessage, logExcerpt, deploymentVersion, description } = req.body;

    if (!title || !service || !errorMessage || !description) {
      return res.status(400).json({ success: false, error: 'Missing required fields: title, service, errorMessage, description' });
    }

    const newIncident: IncidentRecord = {
      id: `inc-${crypto.randomUUID().slice(0, 8)}`,
      title,
      severity: severity || 'HIGH',
      status: 'OPEN',
      service,
      environment: environment || 'production',
      errorMessage,
      logExcerpt: logExcerpt || '',
      deploymentVersion: deploymentVersion || 'v1.0.0',
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const db = await getDb();
    await db.run(
      `INSERT INTO incidents (
        id, title, severity, status, service, environment, errorMessage, logExcerpt, deploymentVersion, description, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newIncident.id,
        newIncident.title,
        newIncident.severity,
        newIncident.status,
        newIncident.service,
        newIncident.environment,
        newIncident.errorMessage,
        newIncident.logExcerpt,
        newIncident.deploymentVersion,
        newIncident.description,
        newIncident.createdAt,
        newIncident.updatedAt
      ]
    );

    res.status(201).json({ success: true, incident: newIncident });
  } catch (err) {
    next(err);
  }
});

// GET /api/incidents/:id - Get incident details + latest analysis
router.get('/incidents/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const row = await db.get<any>(`SELECT * FROM incidents WHERE id = ?`, [id]);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const incident: IncidentRecord = {
      ...row,
      troubleshootingSteps: row.troubleshootingSteps ? JSON.parse(row.troubleshootingSteps) : []
    };

    const analysisRow = await db.get<any>(`SELECT * FROM agent_analyses WHERE incidentId = ? ORDER BY createdAt DESC LIMIT 1`, [id]);
    let latestAnalysis = null;

    if (analysisRow) {
      latestAnalysis = {
        ...analysisRow,
        possibleRootCauses: JSON.parse(analysisRow.possibleRootCauses || '[]'),
        historicalSimilarIncidents: JSON.parse(analysisRow.historicalSimilarIncidents || '[]'),
        recommendedInvestigationSteps: JSON.parse(analysisRow.recommendedInvestigationSteps || '[]'),
        relevantPreviousSolutions: JSON.parse(analysisRow.relevantPreviousSolutions || '[]'),
        recalledMemories: JSON.parse(analysisRow.recalledMemories || '[]'),
        hasHistoricalMatch: Boolean(analysisRow.hasHistoricalMatch)
      };
    }

    res.json({ success: true, incident, latestAnalysis });
  } catch (err) {
    next(err);
  }
});

// POST /api/incidents/:id/analyze - Trigger AI Agent Diagnosis with Hindsight Recall
router.post('/incidents/:id/analyze', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const row = await db.get<any>(`SELECT * FROM incidents WHERE id = ?`, [id]);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const incident: IncidentRecord = {
      ...row,
      troubleshootingSteps: row.troubleshootingSteps ? JSON.parse(row.troubleshootingSteps) : []
    };

    // Update status to INVESTIGATING
    await db.run(`UPDATE incidents SET status = 'INVESTIGATING', updatedAt = ? WHERE id = ?`, [new Date().toISOString(), id]);

    // Run Agent Diagnostics
    const analysis = await agentEngine.analyzeIncident(incident);

    // Save Analysis Record to DB
    await db.run(
      `INSERT INTO agent_analyses (
        id, incidentId, summary, possibleRootCauses, historicalSimilarIncidents, recommendedInvestigationSteps, recommendedResolution, relevantPreviousSolutions, explanation, confidenceScore, hasHistoricalMatch, recalledMemories, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        analysis.id,
        analysis.incidentId,
        analysis.summary,
        JSON.stringify(analysis.possibleRootCauses),
        JSON.stringify(analysis.historicalSimilarIncidents),
        JSON.stringify(analysis.recommendedInvestigationSteps),
        analysis.recommendedResolution,
        JSON.stringify(analysis.relevantPreviousSolutions),
        analysis.explanation,
        analysis.confidenceScore,
        analysis.hasHistoricalMatch ? 1 : 0,
        JSON.stringify(analysis.recalledMemories),
        analysis.createdAt
      ]
    );

    res.json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
});

// POST /api/incidents/:id/resolve - Submit resolution and RETAIN to Hindsight
router.post('/incidents/:id/resolve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rootCause, resolution, outcome, troubleshootingSteps } = req.body;

    if (!rootCause || !resolution) {
      return res.status(400).json({ success: false, error: 'rootCause and resolution are required' });
    }

    const db = await getDb();
    const row = await db.get<any>(`SELECT * FROM incidents WHERE id = ?`, [id]);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const resolvedAt = new Date().toISOString();
    const stepsArray = Array.isArray(troubleshootingSteps) ? troubleshootingSteps : [troubleshootingSteps].filter(Boolean);

    await db.run(
      `UPDATE incidents SET 
        status = 'RESOLVED',
        rootCause = ?,
        resolution = ?,
        outcome = ?,
        troubleshootingSteps = ?,
        resolvedAt = ?,
        updatedAt = ?
      WHERE id = ?`,
      [
        rootCause,
        resolution,
        outcome || 'SUCCESS',
        JSON.stringify(stepsArray),
        resolvedAt,
        resolvedAt,
        id
      ]
    );

    const updatedRow = await db.get<any>(`SELECT * FROM incidents WHERE id = ?`, [id]);
    const incidentRecord: IncidentRecord = {
      ...updatedRow,
      troubleshootingSteps: stepsArray
    };

    // Trigger Hindsight RETAIN operation
    const retainResult = await memoryService.retainIncident(incidentRecord);

    res.json({
      success: true,
      message: 'Incident resolved successfully and retained into Hindsight Memory Bank!',
      incident: incidentRecord,
      hindsightRetain: retainResult
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/incidents/:id/memories - Fetch memories recalled for incident
router.get('/incidents/:id/memories', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const analysisRow = await db.get<any>(`SELECT recalledMemories FROM agent_analyses WHERE incidentId = ? ORDER BY createdAt DESC LIMIT 1`, [id]);
    const memories = analysisRow && analysisRow.recalledMemories ? JSON.parse(analysisRow.recalledMemories) : [];

    res.json({ success: true, count: memories.length, memories });
  } catch (err) {
    next(err);
  }
});

export default router;
