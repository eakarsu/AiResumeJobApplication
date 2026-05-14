import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../services/prisma';
import { ingestJobs } from '../services/jobIngestion';
import { openRouterService } from '../services/openrouter';

const router = Router();

/**
 * GET /api/autopilot/config — fetch the user's autopilot config (or null)
 */
router.get('/config', async (req: AuthRequest, res: Response) => {
  try {
    const cfg = await prisma.autopilotConfig.findUnique({ where: { userId: req.userId! } });
    res.json(cfg);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch autopilot config' });
  }
});

/**
 * PUT /api/autopilot/config — create or update the user's autopilot config
 */
router.put('/config', async (req: AuthRequest, res: Response) => {
  try {
    const { enabled, query, location, minSalary, experienceLevel, resumeId, maxPerDay } = req.body;
    if (!query || !location) return res.status(400).json({ error: 'query and location are required' });

    const cfg = await prisma.autopilotConfig.upsert({
      where: { userId: req.userId! },
      update: {
        enabled: !!enabled,
        query,
        location,
        minSalary: minSalary != null ? Number(minSalary) : null,
        experienceLevel: experienceLevel || null,
        resumeId: resumeId || null,
        maxPerDay: maxPerDay ? Math.max(1, Math.min(20, Number(maxPerDay))) : 5,
      },
      create: {
        userId: req.userId!,
        enabled: !!enabled,
        query,
        location,
        minSalary: minSalary != null ? Number(minSalary) : null,
        experienceLevel: experienceLevel || null,
        resumeId: resumeId || null,
        maxPerDay: maxPerDay ? Math.max(1, Math.min(20, Number(maxPerDay))) : 5,
      },
    });
    res.json(cfg);
  } catch (err) {
    console.error('autopilot config error:', err);
    res.status(500).json({ error: 'Failed to save autopilot config' });
  }
});

/**
 * POST /api/autopilot/run — manually trigger one autopilot pass for the user.
 * Steps:
 *   1. ingest jobs from Adzuna (if env keys set)
 *   2. score the user's resume against the latest jobs (top maxPerDay matches)
 *   3. for each top match, generate tailored bullets + cover letter via tailorForJob
 *   4. persist as AutopilotDraft with status=pending_review
 */
router.post('/run', async (req: AuthRequest, res: Response) => {
  try {
    const cfg = await prisma.autopilotConfig.findUnique({ where: { userId: req.userId! } });
    if (!cfg || !cfg.enabled) return res.status(400).json({ error: 'Autopilot is not enabled' });

    // 1. Pull jobs (best-effort; ignore Adzuna failure if no keys configured)
    let ingested = { ingested: 0, skipped: 0 };
    try {
      ingested = await ingestJobs(cfg.query, cfg.location, 1);
    } catch (e: any) {
      console.warn('autopilot ingest skipped:', e?.message);
    }

    // 2. Get the user's chosen resume (or most recent one)
    const resume = cfg.resumeId
      ? await prisma.resume.findFirst({ where: { id: cfg.resumeId, userId: req.userId } })
      : await prisma.resume.findFirst({
          where: { userId: req.userId },
          orderBy: { updatedAt: 'desc' },
        });
    if (!resume) return res.status(400).json({ error: 'No resume available — create one first' });

    // 3. Find recent jobs matching the query, exclude jobs already drafted
    const existingDrafts = await prisma.autopilotDraft.findMany({
      where: { userId: req.userId },
      select: { jobId: true },
    });
    const draftedJobIds = new Set(existingDrafts.map((d) => d.jobId));

    const candidateJobs = await prisma.job.findMany({
      where: {
        isActive: true,
        ...(cfg.experienceLevel ? { experienceLevel: cfg.experienceLevel } : {}),
        ...(cfg.minSalary ? { OR: [{ salaryMin: { gte: cfg.minSalary } }, { salaryMax: { gte: cfg.minSalary } }] } : {}),
      },
      orderBy: { postedDate: 'desc' },
      take: 50,
    });
    const newJobs = candidateJobs.filter((j) => !draftedJobIds.has(j.id));

    const scored: Array<{ job: typeof newJobs[number]; score: number }> = [];
    for (const job of newJobs.slice(0, 15)) {
      try {
        const m = await openRouterService.analyzeJobMatch(resume, job);
        scored.push({ job, score: m.overallScore });
      } catch (e) {
        console.warn('autopilot score failed for job', job.id, e);
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, cfg.maxPerDay);

    // 4. Tailor each top match
    const drafts: any[] = [];
    for (const { job, score } of top) {
      try {
        const { tailoredBullets, coverLetter } = await openRouterService.tailorForJob(resume, job);

        const cl = await prisma.coverLetter.create({
          data: {
            userId: req.userId!,
            title: `[Autopilot] ${job.title} at ${job.company}`,
            content: coverLetter,
            targetCompany: job.company,
            targetPosition: job.title,
            tone: 'professional',
            isAiGenerated: true,
          },
        });

        const draft = await prisma.autopilotDraft.upsert({
          where: { userId_jobId: { userId: req.userId!, jobId: job.id } },
          update: {
            matchScore: score,
            resumeId: resume.id,
            coverLetterId: cl.id,
            bulletEdits: tailoredBullets,
            status: 'pending_review',
            aiResults: { score },
          },
          create: {
            userId: req.userId!,
            jobId: job.id,
            matchScore: score,
            resumeId: resume.id,
            coverLetterId: cl.id,
            bulletEdits: tailoredBullets,
            status: 'pending_review',
            aiResults: { score },
          },
        });
        drafts.push({ draft, jobTitle: job.title, company: job.company, score });
      } catch (e) {
        console.warn('autopilot tailor failed for job', job.id, e);
      }
    }

    await prisma.autopilotConfig.update({
      where: { userId: req.userId! },
      data: { lastRunAt: new Date() },
    });

    res.json({
      ingested,
      candidatesScored: scored.length,
      draftsCreated: drafts.length,
      drafts,
    });
  } catch (err: any) {
    console.error('autopilot run error:', err);
    res.status(500).json({ error: err?.message || 'Autopilot run failed' });
  }
});

/**
 * GET /api/autopilot/drafts — paginated drafts for the user
 */
router.get('/drafts', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20')));
    const status = (req.query.status as string) || undefined;
    const where = { userId: req.userId, ...(status ? { status } : {}) };
    const [items, total] = await Promise.all([
      prisma.autopilotDraft.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.autopilotDraft.count({ where }),
    ]);
    res.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list drafts' });
  }
});

/**
 * PATCH /api/autopilot/drafts/:id — change status (approved | dismissed | applied)
 */
router.patch('/drafts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['approved', 'dismissed', 'applied'];
    const status = req.body?.status as string;
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const updated = await prisma.autopilotDraft.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update draft' });
  }
});

export default router;
