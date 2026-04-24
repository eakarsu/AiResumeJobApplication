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
import { generalLimiter, authLimiter, aiLimiter } from './middleware/rateLimiter';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
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
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/templates', templateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
