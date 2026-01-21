import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';

const router = Router();

// Get all company research
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { search, industry, size, page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.companyName = { contains: search as string, mode: 'insensitive' };
    }
    if (industry) where.industry = industry;
    if (size) where.size = size;

    const [companies, total] = await Promise.all([
      prisma.companyResearch.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.companyResearch.count({ where })
    ]);

    res.json({
      companies,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to get companies' });
  }
});

// Get single company
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const company = await prisma.companyResearch.findUnique({
      where: { id: req.params.id }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to get company' });
  }
});

// Save company research
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      companyName,
      industry,
      size,
      founded,
      headquarters,
      website,
      linkedinUrl,
      glassdoorRating,
      employeeCount,
      revenue,
      description,
      culture,
      benefits,
      techStack,
      interviewProcess,
      prosNotes,
      consNotes
    } = req.body;

    const company = await prisma.companyResearch.create({
      data: {
        userId: req.userId,
        companyName,
        industry,
        size,
        founded,
        headquarters,
        website,
        linkedinUrl,
        glassdoorRating,
        employeeCount,
        revenue,
        description,
        culture,
        benefits: benefits || [],
        techStack: techStack || [],
        interviewProcess,
        prosNotes,
        consNotes
      }
    });

    res.status(201).json(company);
  } catch (error) {
    console.error('Save company research error:', error);
    res.status(500).json({ error: 'Failed to save company research' });
  }
});

// Update company research
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.companyResearch.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Company research not found' });
    }

    const company = await prisma.companyResearch.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(company);
  } catch (error) {
    console.error('Update company research error:', error);
    res.status(500).json({ error: 'Failed to update company research' });
  }
});

// Toggle bookmark
router.post('/:id/bookmark', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const company = await prisma.companyResearch.findUnique({
      where: { id: req.params.id }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const updated = await prisma.companyResearch.update({
      where: { id: req.params.id },
      data: { isBookmarked: !company.isBookmarked }
    });

    res.json(updated);
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

// Delete company research
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.companyResearch.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Company research not found' });
    }

    await prisma.companyResearch.delete({ where: { id: req.params.id } });
    res.json({ message: 'Company research deleted successfully' });
  } catch (error) {
    console.error('Delete company research error:', error);
    res.status(500).json({ error: 'Failed to delete company research' });
  }
});

// Get user's bookmarked companies
router.get('/user/bookmarked', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const companies = await prisma.companyResearch.findMany({
      where: {
        OR: [
          { userId: req.userId, isBookmarked: true },
          { isBookmarked: true }
        ]
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(companies);
  } catch (error) {
    console.error('Get bookmarked companies error:', error);
    res.status(500).json({ error: 'Failed to get bookmarked companies' });
  }
});

// AI: Analyze company
router.post('/ai/analyze', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, role } = req.body;

    const analysis = await openRouterService.analyzeCompany(companyName, role);

    // Optionally save to database
    const company = await prisma.companyResearch.create({
      data: {
        userId: req.userId,
        companyName,
        description: analysis.overview,
        culture: analysis.culture,
        interviewProcess: analysis.interviewTips.join('\n'),
        prosNotes: analysis.prosAndCons.pros.join('\n'),
        consNotes: analysis.prosAndCons.cons.join('\n')
      }
    });

    res.json({
      ...analysis,
      savedCompany: company
    });
  } catch (error) {
    console.error('AI analyze company error:', error);
    res.status(500).json({ error: 'Failed to analyze company' });
  }
});

export default router;
