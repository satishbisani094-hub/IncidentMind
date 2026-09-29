import { Router } from 'express';
import { memoryService } from '../hindsight/memoryService.js';
import { runSeed } from '../db/seed.js';

const router = Router();

// GET /api/memories - Fetch all stored Hindsight memory entries for Memory Explorer
router.get('/memories', async (req, res, next) => {
  try {
    const memories = await memoryService.getAllMemories();
    res.json({
      success: true,
      bankId: 'incidentmind-production',
      count: memories.length,
      memories
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/memories/retain - Retain arbitrary memory into Hindsight
router.post('/memories/retain', async (req, res, next) => {
  try {
    const { title, service, errorMessage, rootCause, resolution, outcome } = req.body;
    if (!title || !service || !rootCause || !resolution) {
      return res.status(400).json({ success: false, error: 'title, service, rootCause, and resolution are required' });
    }

    const mockRecord: any = {
      id: `custom_${Date.now()}`,
      title,
      service,
      environment: 'production',
      severity: 'HIGH',
      status: 'RESOLVED',
      errorMessage: errorMessage || 'Manual memory ingestion',
      description: title,
      rootCause,
      resolution,
      outcome: outcome || 'SUCCESS',
      resolvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await memoryService.retainIncident(mockRecord);
    res.status(201).json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

// POST /api/memories/recall - Search raw memory bank via query
router.post('/memories/recall', async (req, res, next) => {
  try {
    const { query, service } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'query parameter is required' });
    }

    const memories = await memoryService.recallMemories(query, service);
    res.json({ success: true, count: memories.length, memories });
  } catch (err) {
    next(err);
  }
});

// POST /api/demo/seed - Reset and run seed dataset
router.post('/demo/seed', async (req, res, next) => {
  try {
    await runSeed();
    res.json({ success: true, message: 'Database & Hindsight Memory Bank successfully re-seeded with 20 realistic incidents!' });
  } catch (err) {
    next(err);
  }
});

export default router;
