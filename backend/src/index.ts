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

// Routes
app.use('/api/auth', authLimiter, authRoutes);
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
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

export default app;

// AI feature mount: negotiation-coach
import aiNegotiationcoachRoutes from './routes/ai-negotiation-coach';
// === Batch 07 Gaps & Frontend Mounts ===
import _b07_no_rejectionanalysis_why_rejected from './routes/gap-no-rejectionanalysis-why-rejected';
import _b07_no_interviewschedulingoptimizer from './routes/gap-no-interviewschedulingoptimizer';
import _b07_no_offernegotiationsimulator from './routes/gap-no-offernegotiationsimulator';
import _b07_no_careertrajectoryanalyzer_path_prediction from './routes/gap-no-careertrajectoryanalyzer-path-prediction';
import _b07_no_videorecording_analysis_eye_contact_pace from './routes/gap-no-videorecording-analysis-eye-contact-pace';
import _b07_limited_linkedin_integration_stub_only_no_re from './routes/gap-limited-linkedin-integration-stub-only-no-re';
import _b07_no_interview_panel_feedback_collection from './routes/gap-no-interview-panel-feedback-collection';
import _b07_no_offer_comparison_tool_benefits_equity from './routes/gap-no-offer-comparison-tool-benefits-equity';
import _b07_no_background_check_status_tracker from './routes/gap-no-background-check-status-tracker';
import _b07_no_browser_extension_for_oneclick_apply from './routes/gap-no-browser-extension-for-oneclick-apply';
import _b07_no_notificationsemail_automation from './routes/gap-no-notificationsemail-automation';
import _b07_no_public_webhooks from './routes/gap-no-public-webhooks';
// === End Batch 07 imports ===
app.use('/api/ai/negotiation-coach', aiNegotiationcoachRoutes);
// === Batch 07 Gaps & Frontend Mounts === mounts
app.use('/api/gap-no-rejectionanalysis-why-rejected', _b07_no_rejectionanalysis_why_rejected);
app.use('/api/gap-no-interviewschedulingoptimizer', _b07_no_interviewschedulingoptimizer);
app.use('/api/gap-no-offernegotiationsimulator', _b07_no_offernegotiationsimulator);
app.use('/api/gap-no-careertrajectoryanalyzer-path-prediction', _b07_no_careertrajectoryanalyzer_path_prediction);
app.use('/api/gap-no-videorecording-analysis-eye-contact-pace', _b07_no_videorecording_analysis_eye_contact_pace);
app.use('/api/gap-limited-linkedin-integration-stub-only-no-re', _b07_limited_linkedin_integration_stub_only_no_re);
app.use('/api/gap-no-interview-panel-feedback-collection', _b07_no_interview_panel_feedback_collection);
app.use('/api/gap-no-offer-comparison-tool-benefits-equity', _b07_no_offer_comparison_tool_benefits_equity);
app.use('/api/gap-no-background-check-status-tracker', _b07_no_background_check_status_tracker);
app.use('/api/gap-no-browser-extension-for-oneclick-apply', _b07_no_browser_extension_for_oneclick_apply);
app.use('/api/gap-no-notificationsemail-automation', _b07_no_notificationsemail_automation);
app.use('/api/gap-no-public-webhooks', _b07_no_public_webhooks);
// === End Batch 07 mounts ===
