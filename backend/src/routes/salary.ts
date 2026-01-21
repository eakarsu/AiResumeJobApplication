import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';

const router = Router();

// Get salary data
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, location, experienceLevel, industry, page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (jobTitle) where.jobTitle = { contains: jobTitle as string, mode: 'insensitive' };
    if (location) where.location = { contains: location as string, mode: 'insensitive' };
    if (experienceLevel) where.experienceLevel = experienceLevel;
    if (industry) where.industry = industry;

    const [salaries, total] = await Promise.all([
      prisma.salaryResearch.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { lastUpdated: 'desc' }
      }),
      prisma.salaryResearch.count({ where })
    ]);

    res.json({
      salaries,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get salary data error:', error);
    res.status(500).json({ error: 'Failed to get salary data' });
  }
});

// Get single salary entry
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const salary = await prisma.salaryResearch.findUnique({
      where: { id: req.params.id }
    });

    if (!salary) {
      return res.status(404).json({ error: 'Salary data not found' });
    }

    res.json(salary);
  } catch (error) {
    console.error('Get salary entry error:', error);
    res.status(500).json({ error: 'Failed to get salary data' });
  }
});

// Save salary research (user's own research)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      jobTitle,
      location,
      experienceLevel,
      industry,
      company,
      salaryMin,
      salaryMax,
      salaryMedian,
      bonusMin,
      bonusMax,
      totalCompMin,
      totalCompMax,
      dataSource
    } = req.body;

    const salary = await prisma.salaryResearch.create({
      data: {
        userId: req.userId,
        jobTitle,
        location,
        experienceLevel,
        industry,
        company,
        salaryMin,
        salaryMax,
        salaryMedian,
        bonusMin,
        bonusMax,
        totalCompMin,
        totalCompMax,
        dataSource
      }
    });

    res.status(201).json(salary);
  } catch (error) {
    console.error('Save salary research error:', error);
    res.status(500).json({ error: 'Failed to save salary research' });
  }
});

// Get user's saved salary research
router.get('/user/saved', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const salaries = await prisma.salaryResearch.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(salaries);
  } catch (error) {
    console.error('Get user salary research error:', error);
    res.status(500).json({ error: 'Failed to get salary research' });
  }
});

// Delete salary research
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.salaryResearch.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Salary research not found' });
    }

    await prisma.salaryResearch.delete({ where: { id: req.params.id } });
    res.json({ message: 'Salary research deleted successfully' });
  } catch (error) {
    console.error('Delete salary research error:', error);
    res.status(500).json({ error: 'Failed to delete salary research' });
  }
});

// AI: Get salary insights
router.post('/ai/insights', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, location, experienceLevel, skills, industry } = req.body;

    const insights = await openRouterService.getSalaryInsights({
      jobTitle,
      location,
      experienceLevel,
      skills,
      industry
    });

    res.json(insights);
  } catch (error) {
    console.error('AI salary insights error:', error);
    res.status(500).json({ error: 'Failed to get salary insights' });
  }
});

// Get salary comparison
router.post('/compare', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, locations, experienceLevel } = req.body;

    const comparisons = await prisma.salaryResearch.findMany({
      where: {
        jobTitle: { contains: jobTitle, mode: 'insensitive' },
        location: { in: locations },
        experienceLevel
      }
    });

    // Group by location
    const byLocation = locations.reduce((acc: any, loc: string) => {
      const data = comparisons.filter(c =>
        c.location.toLowerCase().includes(loc.toLowerCase())
      );
      if (data.length > 0) {
        acc[loc] = {
          min: Math.min(...data.map(d => d.salaryMin)),
          max: Math.max(...data.map(d => d.salaryMax)),
          median: Math.round(data.reduce((sum, d) => sum + d.salaryMedian, 0) / data.length)
        };
      }
      return acc;
    }, {});

    res.json(byLocation);
  } catch (error) {
    console.error('Salary comparison error:', error);
    res.status(500).json({ error: 'Failed to compare salaries' });
  }
});

export default router;
