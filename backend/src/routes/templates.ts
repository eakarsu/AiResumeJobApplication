import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all resume templates
router.get('/resumes', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { category, isPremium } = req.query;

    const where: any = { isActive: true };
    if (category) where.category = category;
    if (isPremium !== undefined) where.isPremium = isPremium === 'true';

    const templates = await prisma.resumeTemplate.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// Get single template
router.get('/resumes/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.resumeTemplate.findUnique({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// Get subscription plans
router.get('/plans', async (req, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

export default router;
