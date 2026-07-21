import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import authRoutes from './routes/auth';
import resumeRoutes from './routes/resumes';
import coverLetterRoutes from './routes/coverLetters';
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import interviewRoutes from './routes/interviews';
import skillRoutes from './routes/skills';
import salaryRoutes from './routes/salary';
import companyRoutes from './routes/companies';
import networkRoutes from './routes/network';
import analyticsRoutes from './routes/analytics';
import aiRoutes from './routes/ai';
import templateRoutes from './routes/templates';
import resumeUploadRoutes from './routes/resumeUpload';
import autopilotRoutes from './routes/autopilot';
import linkedinRoutes from './routes/linkedin';
import compensationRoutes from './routes/compensation';
import voicePrepRoutes from './routes/voicePrep';
import { generalLimiter, authLimiter, aiLimiter, aiRateLimiterPerUser } from './middleware/rateLimiter';
import { authenticateToken } from './middleware/auth';
import prisma from './services/prisma';
const governanceRouter = require('../governance');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());

// CORS allowlist — restrict to ALLOWED_ORIGINS env (comma-separated). Falls back to localhost.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/governance', governanceRouter);
app.use('/api', authenticateToken);
app.use('/api/resumes', resumeRoutes);
app.use('/api/cover-letters', coverLetterRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/analytics', analyticsRoutes);
// AI: coarse IP limiter, then user-aware 20/hr limiter (after auth)
app.use('/api/ai', aiLimiter, authenticateToken, aiRateLimiterPerUser, aiRoutes);
app.use('/api/templates', templateRoutes);

// NEW: resume upload (PDF/DOCX) → AI parse, application autopilot,
// LinkedIn-style profile sync, compensation tracker, voice interview prep.
app.use('/api/resume-upload', authenticateToken, aiRateLimiterPerUser, resumeUploadRoutes);
app.use('/api/autopilot', authenticateToken, aiRateLimiterPerUser, autopilotRoutes);
app.use('/api/linkedin', authenticateToken, aiRateLimiterPerUser, linkedinRoutes);
app.use('/api/compensation', authenticateToken, compensationRoutes);
app.use('/api/voice-prep', authenticateToken, aiRateLimiterPerUser, voicePrepRoutes);

if (process.env.ENABLE_GENERATED_FEATURES === 'true' && process.env.NODE_ENV !== 'production') {
  const generated = require('./routes/customViews');
  app.use('/api/generated/custom-views', generated.default || generated);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Version endpoint for ops/observability
app.get('/api/version', (_req, res) => {
  res.json({
    name: 'ai-resume-backend',
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    uptimeSec: Math.round(process.uptime()),
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? (err.message || 'Internal Server Error') : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

async function startServer() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (_) {
    console.error('Database readiness check failed');
    process.exitCode = 1;
  }
}
startServer();

export default app;
