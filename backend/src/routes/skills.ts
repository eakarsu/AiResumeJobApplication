import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';

const router = Router();

// Get all skills
router.get('/', async (req, res: Response) => {
  try {
    const { category, search } = req.query;

    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Failed to get skills' });
  }
});

// Get user skills
router.get('/user', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: req.userId },
      include: { skill: true },
      orderBy: { skill: { name: 'asc' } }
    });

    res.json(userSkills);
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json({ error: 'Failed to get user skills' });
  }
});

// Add user skill
router.post('/user', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { skillId, skillName, proficiency, yearsExperience, category } = req.body;

    let finalSkillId = skillId;

    // If skillName provided instead of skillId, find or create skill
    if (!skillId && skillName) {
      let skill = await prisma.skill.findUnique({
        where: { name: skillName }
      });

      if (!skill) {
        skill = await prisma.skill.create({
          data: {
            name: skillName,
            category: category || 'technical'
          }
        });
      }
      finalSkillId = skill.id;
    }

    const userSkill = await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: req.userId!,
          skillId: finalSkillId
        }
      },
      update: { proficiency, yearsExperience },
      create: {
        userId: req.userId!,
        skillId: finalSkillId,
        proficiency,
        yearsExperience
      },
      include: { skill: true }
    });

    res.json(userSkill);
  } catch (error) {
    console.error('Add user skill error:', error);
    res.status(500).json({ error: 'Failed to add skill' });
  }
});

// Update user skill
router.put('/user/:skillId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { proficiency, yearsExperience } = req.body;

    const userSkill = await prisma.userSkill.update({
      where: {
        userId_skillId: {
          userId: req.userId!,
          skillId: req.params.skillId
        }
      },
      data: { proficiency, yearsExperience },
      include: { skill: true }
    });

    res.json(userSkill);
  } catch (error) {
    console.error('Update user skill error:', error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// Remove user skill
router.delete('/user/:skillId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.userSkill.delete({
      where: {
        userId_skillId: {
          userId: req.userId!,
          skillId: req.params.skillId
        }
      }
    });

    res.json({ message: 'Skill removed successfully' });
  } catch (error) {
    console.error('Remove user skill error:', error);
    res.status(500).json({ error: 'Failed to remove skill' });
  }
});

// Get saved skills gap analyses for user
router.get('/ai/gap-analyses', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const analyses = await prisma.skillsGapAnalysis.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(analyses);
  } catch (error) {
    console.error('Get skills gap analyses error:', error);
    res.status(500).json({ error: 'Failed to get analyses' });
  }
});

// Delete a saved skills gap analysis
router.delete('/ai/gap-analyses/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.skillsGapAnalysis.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    await prisma.skillsGapAnalysis.delete({ where: { id: req.params.id } });
    res.json({ message: 'Analysis deleted' });
  } catch (error) {
    console.error('Delete skills gap analysis error:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
});

// AI: Analyze skills gap
router.post('/ai/gap-analysis', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { targetRole, industry } = req.body;

    // Get user's current skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: req.userId },
      include: { skill: true }
    });

    const currentSkills = userSkills.map(us => us.skill.name);

    const analysis = await openRouterService.analyzeSkillsGap(currentSkills, targetRole, industry);

    // Save skills gap analysis to DB
    let skillsGapAnalysisId = null;
    try {
      const saved = await prisma.skillsGapAnalysis.create({
        data: {
          userId: req.userId!,
          targetRole,
          industry: industry || null,
          currentSkills: currentSkills || [],
          missingSkills: analysis.missingSkills || [],
          learningPath: analysis.learningPath || [],
          resources: analysis.resources || [],
          timeline: analysis.timeline || null
        }
      });
      skillsGapAnalysisId = saved.id;
    } catch (e) {
      console.error('DB save failed (skills gap analysis):', e);
    }

    try {
      await prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_skills_gap',
          entityType: 'skill',
          entityId: skillsGapAnalysisId || undefined,
          metadata: { targetRole, industry, missingCount: analysis.missingSkills?.length }
        }
      });
    } catch (e) {
      console.error('DB save failed (activity log):', e);
    }

    res.json({
      currentSkills,
      ...analysis,
      skillsGapAnalysisId
    });
  } catch (error) {
    console.error('AI skills gap error:', error);
    res.status(500).json({ error: 'Failed to analyze skills gap' });
  }
});

// Get trending skills
router.get('/trending', async (req, res: Response) => {
  try {
    const skills = await prisma.skill.findMany({
      where: { demandScore: { gte: 70 } },
      orderBy: { demandScore: 'desc' },
      take: 20
    });

    res.json(skills);
  } catch (error) {
    console.error('Get trending skills error:', error);
    res.status(500).json({ error: 'Failed to get trending skills' });
  }
});

// Get skill categories
router.get('/categories', async (req, res: Response) => {
  try {
    const categories = await prisma.skill.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    res.json(categories.map(c => ({
      name: c.category,
      count: c._count.category
    })));
  } catch (error) {
    console.error('Get skill categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

export default router;
