import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend or root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  hindsightApiUrl: process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io',
  hindsightApiKey: process.env.HINDSIGHT_API_KEY || '',
  hindsightBankId: process.env.HINDSIGHT_BANK_ID || 'incidentmind-production',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  llmProvider: (process.env.LLM_PROVIDER || 'gemini') as 'gemini' | 'openai' | 'mock',
  databaseUrl: process.env.DATABASE_URL || 'file:./incidentmind.db',
};
