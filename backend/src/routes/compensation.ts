import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../services/prisma';

const router = Router();

/**
 * POST /api/compensation
 * Submit a compensation offer (anonymously by default).
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      jobTitle,
      company,
      location,
      experienceYears,
      baseSalary,
      bonus,
      equity,
      signOnBonus,
      totalComp,
      notes,
      isAnonymous,
    } = req.body || {};

    if (!jobTitle || !company || !location || !baseSalary) {
      return res.status(400).json({ error: 'jobTitle, company, location, baseSalary are required' });
    }

    const offer = await prisma.compensationOffer.create({
      data: {
        userId: isAnonymous ? null : req.userId!,
        jobTitle,
        company,
        location,
        experienceYears: experienceYears != null ? Number(experienceYears) : null,
        baseSalary: Number(baseSalary),
        bonus: bonus != null ? Number(bonus) : null,
        equity: equity || null,
        signOnBonus: signOnBonus != null ? Number(signOnBonus) : null,
        totalComp: totalComp != null ? Number(totalComp) : null,
        notes: notes || null,
        isAnonymous: !!isAnonymous,
      },
    });
    res.json(offer);
  } catch (err) {
    console.error('compensation submit error:', err);
    res.status(500).json({ error: 'Failed to submit offer' });
  }
});

/**
 * GET /api/compensation/aggregate?jobTitle=&location=
 * Returns aggregate stats (count, min/max/median/p25/p75) for matching offers.
 * Hides per-row details — privacy-preserving anonymous dataset.
 */
router.get('/aggregate', async (req: AuthRequest, res: Response) => {
  try {
    const jobTitle = (req.query.jobTitle as string) || '';
    const location = (req.query.location as string) || '';

    const where: any = {};
    if (jobTitle) where.jobTitle = { contains: jobTitle, mode: 'insensitive' };
    if (location) where.location = { contains: location, mode: 'insensitive' };

    const rows = await prisma.compensationOffer.findMany({
      where,
      select: { baseSalary: true, totalComp: true, location: true, experienceYears: true },
      take: 1000,
    });
    const sorted = rows.map((r) => r.baseSalary).sort((a, b) => a - b);
    const total = sorted.length;
    const pct = (p: number) => (total === 0 ? 0 : sorted[Math.floor(p * (total - 1))]);

    res.json({
      sampleSize: total,
      base: {
        min: sorted[0] || 0,
        max: sorted[total - 1] || 0,
        median: pct(0.5),
        p25: pct(0.25),
        p75: pct(0.75),
        avg: total === 0 ? 0 : Math.round(sorted.reduce((a, b) => a + b, 0) / total),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute aggregate' });
  }
});

/**
 * GET /api/compensation/mine — paginated list of the current user's submissions
 */
router.get('/mine', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20')));
    const where = { userId: req.userId };
    const [items, total] = await Promise.all([
      prisma.compensationOffer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.compensationOffer.count({ where }),
    ]);
    res.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your offers' });
  }
});

export default router;
