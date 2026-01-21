import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all applications for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { userId: req.userId };
    if (status) where.status = status;

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: {
          job: true,
          resume: { select: { id: true, title: true } },
          coverLetter: { select: { id: true, title: true } },
          interviews: true
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { applicationDate: 'desc' }
      }),
      prisma.jobApplication.count({ where })
    ]);

    res.json({
      applications,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// Get single application
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const application = await prisma.jobApplication.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        job: true,
        resume: true,
        coverLetter: true,
        interviews: {
          orderBy: { scheduledDate: 'asc' }
        },
        timeline: {
          orderBy: { eventDate: 'desc' }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to get application' });
  }
});

// Create application
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      jobId,
      resumeId,
      coverLetterId,
      companyName,
      position,
      location,
      salary,
      status = 'applied',
      notes,
      contactPerson,
      contactEmail,
      source,
      priority
    } = req.body;

    const application = await prisma.jobApplication.create({
      data: {
        userId: req.userId!,
        jobId,
        resumeId,
        coverLetterId,
        companyName,
        position,
        location,
        salary,
        status,
        notes,
        contactPerson,
        contactEmail,
        source,
        priority
      },
      include: { job: true }
    });

    // Create timeline entry
    await prisma.applicationTimeline.create({
      data: {
        applicationId: application.id,
        eventType: status === 'applied' ? 'applied' : 'created',
        description: `Application ${status === 'applied' ? 'submitted' : 'created'}`
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'application_created',
        entityType: 'application',
        entityId: application.id
      }
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update application
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.jobApplication.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const {
      status,
      notes,
      contactPerson,
      contactEmail,
      nextAction,
      nextActionDate,
      priority,
      resumeId,
      coverLetterId
    } = req.body;

    // Track status change
    if (status && status !== existing.status) {
      await prisma.applicationTimeline.create({
        data: {
          applicationId: req.params.id,
          eventType: status,
          description: `Status changed from ${existing.status} to ${status}`
        }
      });

      if (status === 'interview') {
        await prisma.applicationTimeline.create({
          data: {
            applicationId: req.params.id,
            eventType: 'interview_scheduled',
            description: 'Interview scheduled'
          }
        });
      }
    }

    const application = await prisma.jobApplication.update({
      where: { id: req.params.id },
      data: {
        status,
        notes,
        contactPerson,
        contactEmail,
        nextAction,
        nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
        priority,
        resumeId,
        coverLetterId,
        responseDate: status && status !== existing.status && status !== 'applied' ? new Date() : undefined
      },
      include: { job: true }
    });

    res.json(application);
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete application
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.jobApplication.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await prisma.jobApplication.delete({ where: { id: req.params.id } });
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Get application statistics
router.get('/stats/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: { userId: req.userId },
      _count: { status: true }
    });

    const totalApplications = await prisma.jobApplication.count({
      where: { userId: req.userId }
    });

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const recentApplications = await prisma.jobApplication.count({
      where: {
        userId: req.userId,
        applicationDate: { gte: thisWeek }
      }
    });

    const upcomingInterviews = await prisma.interview.count({
      where: {
        userId: req.userId,
        scheduledDate: { gte: new Date() },
        status: 'scheduled'
      }
    });

    res.json({
      byStatus: stats.reduce((acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      }, {} as Record<string, number>),
      total: totalApplications,
      recentApplications,
      upcomingInterviews
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Add timeline event
router.post('/:id/timeline', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.jobApplication.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const { eventType, description, eventDate } = req.body;

    const event = await prisma.applicationTimeline.create({
      data: {
        applicationId: req.params.id,
        eventType,
        description,
        eventDate: eventDate ? new Date(eventDate) : new Date()
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Add timeline event error:', error);
    res.status(500).json({ error: 'Failed to add timeline event' });
  }
});

export default router;
