import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dbPath = path.resolve(process.cwd(), 'incidentmind.db');

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await initDbSchema(dbInstance);
  return dbInstance;
}

async function initDbSchema(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      service TEXT NOT NULL,
      environment TEXT NOT NULL DEFAULT 'production',
      errorMessage TEXT NOT NULL,
      logExcerpt TEXT,
      deploymentVersion TEXT,
      description TEXT NOT NULL,
      rootCause TEXT,
      troubleshootingSteps TEXT,
      resolution TEXT,
      outcome TEXT,
      resolvedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_analyses (
      id TEXT PRIMARY KEY,
      incidentId TEXT NOT NULL,
      summary TEXT,
      possibleRootCauses TEXT,
      historicalSimilarIncidents TEXT,
      recommendedInvestigationSteps TEXT,
      recommendedResolution TEXT,
      relevantPreviousSolutions TEXT,
      explanation TEXT,
      confidenceScore REAL,
      hasHistoricalMatch INTEGER,
      recalledMemories TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (incidentId) REFERENCES incidents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hindsight_memories (
      id TEXT PRIMARY KEY,
      incidentId TEXT,
      bankId TEXT NOT NULL,
      memoryType TEXT NOT NULL,
      service TEXT NOT NULL,
      title TEXT NOT NULL,
      errorMessage TEXT NOT NULL,
      rootCause TEXT NOT NULL,
      resolution TEXT NOT NULL,
      outcome TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      createdAt TEXT NOT NULL
    );
  `);
}
