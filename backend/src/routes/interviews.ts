import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';

const router = Router();

// Get all interviews for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, upcoming } = req.query;

    const where: any = { userId: req.userId };
    if (status) where.status = status;
    if (upcoming === 'true') {
      where.scheduledDate = { gte: new Date() };
      where.status = 'scheduled';
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        application: {
          select: { id: true, companyName: true, position: true }
        },
        prepQuestions: true
      },
      orderBy: { scheduledDate: 'asc' }
    });

    res.json(interviews);
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: 'Failed to get interviews' });
  }
});

// Get single interview
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const interview = await prisma.interview.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        application: true,
        prepQuestions: {
          orderBy: { difficulty: 'asc' }
        }
      }
    });

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json(interview);
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ error: 'Failed to get interview' });
  }
});

// Create interview
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      applicationId,
      companyName,
      position,
      interviewType,
      scheduledDate,
      duration,
      interviewerName,
      interviewerRole,
      location,
      meetingLink,
      notes
    } = req.body;

    const interview = await prisma.interview.create({
      data: {
        userId: req.userId!,
        applicationId,
        companyName,
        position,
        interviewType,
        scheduledDate: new Date(scheduledDate),
        duration,
        interviewerName,
        interviewerRole,
        location,
        meetingLink,
        notes
      }
    });

    // Update application status if linked
    if (applicationId) {
      await prisma.jobApplication.update({
        where: { id: applicationId },
        data: { status: 'interview' }
      });

      await prisma.applicationTimeline.create({
        data: {
          applicationId,
          eventType: 'interview_scheduled',
          description: `${interviewType} interview scheduled for ${new Date(scheduledDate).toLocaleDateString()}`
        }
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'interview_scheduled',
        entityType: 'interview',
        entityId: interview.id
      }
    });

    res.status(201).json(interview);
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

// Update interview
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.interview.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const {
      interviewType,
      scheduledDate,
      duration,
      interviewerName,
      interviewerRole,
      location,
      meetingLink,
      status,
      notes,
      feedback,
      rating
    } = req.body;

    const interview = await prisma.interview.update({
      where: { id: req.params.id },
      data: {
        interviewType,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        duration,
        interviewerName,
        interviewerRole,
        location,
        meetingLink,
        status,
        notes,
        feedback,
        rating
      }
    });

    res.json(interview);
  } catch (error) {
    console.error('Update interview error:', error);
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// Delete interview
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.interview.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    await prisma.interview.delete({ where: { id: req.params.id } });
    res.json({ message: 'Interview deleted successfully' });
  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

// AI: Generate prep questions
router.post('/:id/ai/prep-questions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const interview = await prisma.interview.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const { skills, experienceLevel, count = 10 } = req.body;

    const questions = await openRouterService.generateInterviewQuestions({
      jobTitle: interview.position,
      company: interview.companyName,
      interviewType: interview.interviewType,
      skills,
      experienceLevel,
      count
    });

    // Save questions to database
    const savedQuestions = await Promise.all(
      questions.map(q =>
        prisma.interviewPrepQuestion.create({
          data: {
            interviewId: req.params.id,
            category: q.category,
            question: q.question,
            suggestedAnswer: q.suggestedAnswer,
            tips: q.tips,
            difficulty: q.difficulty,
            isAiGenerated: true
          }
        })
      )
    );

    res.json(savedQuestions);
  } catch (error) {
    console.error('AI prep questions error:', error);
    res.status(500).json({ error: 'Failed to generate prep questions' });
  }
});

// AI: Evaluate answer
router.post('/ai/evaluate-answer', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { question, answer, context } = req.body;

    const evaluation = await openRouterService.evaluateInterviewAnswer(question, answer, context);
    res.json(evaluation);
  } catch (error) {
    console.error('AI evaluate answer error:', error);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// Get all prep questions (standalone, not linked to interview)
router.get('/prep/questions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { category, difficulty } = req.query;

    const where: any = {};
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;

    const questions = await prisma.interviewPrepQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(questions);
  } catch (error) {
    console.error('Get prep questions error:', error);
    res.status(500).json({ error: 'Failed to get prep questions' });
  }
});

// AI: Generate standalone prep questions (not linked to interview)
router.post('/ai/generate-questions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, company, interviewType, skills, experienceLevel, count = 10 } = req.body;

    const questions = await openRouterService.generateInterviewQuestions({
      jobTitle,
      company,
      interviewType,
      skills,
      experienceLevel,
      count
    });

    res.json(questions);
  } catch (error) {
    console.error('AI generate questions error:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

export default router;
