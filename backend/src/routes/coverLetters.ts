import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';

const router = Router();

// Get all cover letters for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const coverLetters = await prisma.coverLetter.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(coverLetters);
  } catch (error) {
    console.error('Get cover letters error:', error);
    res.status(500).json({ error: 'Failed to get cover letters' });
  }
});

// Get single cover letter
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const coverLetter = await prisma.coverLetter.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!coverLetter) {
      return res.status(404).json({ error: 'Cover letter not found' });
    }
    res.json(coverLetter);
  } catch (error) {
    console.error('Get cover letter error:', error);
    res.status(500).json({ error: 'Failed to get cover letter' });
  }
});

// Create cover letter
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, targetCompany, targetPosition, tone, templateId } = req.body;

    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: req.userId!,
        title,
        content,
        targetCompany,
        targetPosition,
        tone,
        templateId
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'cover_letter_created',
        entityType: 'coverLetter',
        entityId: coverLetter.id
      }
    });

    res.status(201).json(coverLetter);
  } catch (error) {
    console.error('Create cover letter error:', error);
    res.status(500).json({ error: 'Failed to create cover letter' });
  }
});

// Update cover letter
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.coverLetter.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Cover letter not found' });
    }

    const { title, content, targetCompany, targetPosition, tone, templateId } = req.body;

    const coverLetter = await prisma.coverLetter.update({
      where: { id: req.params.id },
      data: { title, content, targetCompany, targetPosition, tone, templateId }
    });

    res.json(coverLetter);
  } catch (error) {
    console.error('Update cover letter error:', error);
    res.status(500).json({ error: 'Failed to update cover letter' });
  }
});

// Delete cover letter
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.coverLetter.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Cover letter not found' });
    }

    await prisma.coverLetter.delete({ where: { id: req.params.id } });
    res.json({ message: 'Cover letter deleted successfully' });
  } catch (error) {
    console.error('Delete cover letter error:', error);
    res.status(500).json({ error: 'Failed to delete cover letter' });
  }
});

// AI: Generate cover letter
router.post('/ai/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, company, jobDescription, resumeId, tone } = req.body;

    let resume = null;
    if (resumeId) {
      resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId: req.userId }
      });
    }

    const content = await openRouterService.generateCoverLetter({
      jobTitle,
      company,
      jobDescription,
      resume,
      tone
    });

    // Save the generated cover letter
    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: req.userId!,
        title: `Cover Letter - ${company} - ${jobTitle}`,
        content,
        targetCompany: company,
        targetPosition: jobTitle,
        tone,
        isAiGenerated: true
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'cover_letter_ai_generated',
        entityType: 'coverLetter',
        entityId: coverLetter.id
      }
    });

    res.json(coverLetter);
  } catch (error) {
    console.error('AI generate cover letter error:', error);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

export default router;
