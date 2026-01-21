import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';

const router = Router();

// Get all resumes for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(resumes);
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ error: 'Failed to get resumes' });
  }
});

// Get single resume
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    res.json(resume);
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to get resume' });
  }
});

// Create resume
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, summary, experience, education, skills, certifications, languages, projects, templateId } = req.body;

    const resume = await prisma.resume.create({
      data: {
        userId: req.userId!,
        title,
        summary,
        experience: experience || [],
        education: education || [],
        skills: skills || [],
        certifications,
        languages,
        projects,
        templateId
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'resume_created',
        entityType: 'resume',
        entityId: resume.id
      }
    });

    res.status(201).json(resume);
  } catch (error) {
    console.error('Create resume error:', error);
    res.status(500).json({ error: 'Failed to create resume' });
  }
});

// Update resume
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.resume.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const { title, summary, experience, education, skills, certifications, languages, projects, templateId, isActive } = req.body;

    const resume = await prisma.resume.update({
      where: { id: req.params.id },
      data: {
        title,
        summary,
        experience,
        education,
        skills,
        certifications,
        languages,
        projects,
        templateId,
        isActive
      }
    });

    res.json(resume);
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

// Delete resume
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.resume.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    await prisma.resume.delete({ where: { id: req.params.id } });
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// AI: Generate summary
router.post('/:id/ai/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const { targetRole } = req.body;
    const summary = await openRouterService.generateResumeSummary(
      resume.experience as any[],
      resume.skills,
      targetRole
    );

    const updated = await prisma.resume.update({
      where: { id: req.params.id },
      data: { summary, isAiGenerated: true }
    });

    res.json({ summary, resume: updated });
  } catch (error) {
    console.error('AI summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// AI: Optimize resume
router.post('/:id/ai/optimize', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const { jobDescription } = req.body;
    const analysis = await openRouterService.optimizeResume(resume, jobDescription);

    await prisma.resume.update({
      where: { id: req.params.id },
      data: {
        atsScore: analysis.score,
        keywords: analysis.keywords
      }
    });

    res.json(analysis);
  } catch (error) {
    console.error('AI optimize error:', error);
    res.status(500).json({ error: 'Failed to optimize resume' });
  }
});

// AI: Enhance experience bullets
router.post('/:id/ai/enhance-bullets', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { bullets, role, company } = req.body;

    const enhanced = await openRouterService.enhanceExperienceBullets(bullets, role, company);
    res.json({ enhanced });
  } catch (error) {
    console.error('AI enhance bullets error:', error);
    res.status(500).json({ error: 'Failed to enhance bullets' });
  }
});

export default router;
