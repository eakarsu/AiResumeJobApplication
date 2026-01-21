import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get dashboard analytics
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalApplications,
      applicationsByStatus,
      recentApplications,
      upcomingInterviews,
      totalResumes,
      totalCoverLetters,
      totalContacts,
      recentActivity
    ] = await Promise.all([
      // Total applications
      prisma.jobApplication.count({ where: { userId: req.userId } }),

      // Applications by status
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: { userId: req.userId },
        _count: { status: true }
      }),

      // Applications in last 7 days
      prisma.jobApplication.count({
        where: {
          userId: req.userId,
          applicationDate: { gte: sevenDaysAgo }
        }
      }),

      // Upcoming interviews
      prisma.interview.count({
        where: {
          userId: req.userId,
          scheduledDate: { gte: now },
          status: 'scheduled'
        }
      }),

      // Total resumes
      prisma.resume.count({ where: { userId: req.userId } }),

      // Total cover letters
      prisma.coverLetter.count({ where: { userId: req.userId } }),

      // Total contacts
      prisma.networkContact.count({
        where: { userId: req.userId, isActive: true }
      }),

      // Recent activity
      prisma.activityLog.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    res.json({
      overview: {
        totalApplications,
        recentApplications,
        upcomingInterviews,
        totalResumes,
        totalCoverLetters,
        totalContacts
      },
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to get dashboard analytics' });
  }
});

// Get application trends
router.get('/applications/trends', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const applications = await prisma.jobApplication.findMany({
      where: {
        userId: req.userId,
        applicationDate: { gte: startDate }
      },
      select: {
        applicationDate: true,
        status: true
      },
      orderBy: { applicationDate: 'asc' }
    });

    // Group by date
    const byDate: Record<string, { applied: number; responses: number }> = {};
    applications.forEach(app => {
      const date = app.applicationDate.toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { applied: 0, responses: 0 };
      }
      byDate[date].applied++;
      if (app.status !== 'applied') {
        byDate[date].responses++;
      }
    });

    res.json(byDate);
  } catch (error) {
    console.error('Application trends error:', error);
    res.status(500).json({ error: 'Failed to get application trends' });
  }
});

// Get response rate analytics
router.get('/response-rate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: { userId: req.userId },
      select: { status: true }
    });

    const total = applications.length;
    const responded = applications.filter(a =>
      !['applied', 'saved'].includes(a.status)
    ).length;
    const interviews = applications.filter(a =>
      ['interview', 'offer', 'accepted'].includes(a.status)
    ).length;
    const offers = applications.filter(a =>
      ['offer', 'accepted'].includes(a.status)
    ).length;

    res.json({
      total,
      responded,
      interviews,
      offers,
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
      interviewRate: total > 0 ? Math.round((interviews / total) * 100) : 0,
      offerRate: total > 0 ? Math.round((offers / total) * 100) : 0
    });
  } catch (error) {
    console.error('Response rate error:', error);
    res.status(500).json({ error: 'Failed to get response rate analytics' });
  }
});

// Get skills analytics
router.get('/skills', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: req.userId },
      include: { skill: true }
    });

    // Get job requirements from applied jobs
    const applications = await prisma.jobApplication.findMany({
      where: { userId: req.userId },
      include: { job: { select: { skills: true } } }
    });

    const requiredSkills: Record<string, number> = {};
    applications.forEach(app => {
      if (app.job?.skills) {
        app.job.skills.forEach(skill => {
          requiredSkills[skill] = (requiredSkills[skill] || 0) + 1;
        });
      }
    });

    // Find skill gaps
    const userSkillNames = userSkills.map(us => us.skill.name.toLowerCase());
    const gaps = Object.entries(requiredSkills)
      .filter(([skill]) => !userSkillNames.includes(skill.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    res.json({
      userSkills: userSkills.map(us => ({
        name: us.skill.name,
        category: us.skill.category,
        proficiency: us.proficiency
      })),
      mostRequestedSkills: Object.entries(requiredSkills)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      skillGaps: gaps
    });
  } catch (error) {
    console.error('Skills analytics error:', error);
    res.status(500).json({ error: 'Failed to get skills analytics' });
  }
});

// Get activity log
router.get('/activity', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId: req.userId },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.activityLog.count({ where: { userId: req.userId } })
    ]);

    res.json({
      activities,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({ error: 'Failed to get activity log' });
  }
});

// Get weekly summary
router.get('/weekly-summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [applications, interviews, contacts, resumes] = await Promise.all([
      prisma.jobApplication.count({
        where: {
          userId: req.userId,
          applicationDate: { gte: weekStart }
        }
      }),
      prisma.interview.count({
        where: {
          userId: req.userId,
          scheduledDate: { gte: weekStart, lte: now }
        }
      }),
      prisma.contactInteraction.count({
        where: {
          contact: { userId: req.userId },
          date: { gte: weekStart }
        }
      }),
      prisma.resume.count({
        where: {
          userId: req.userId,
          createdAt: { gte: weekStart }
        }
      })
    ]);

    res.json({
      weekStart: weekStart.toISOString(),
      weekEnd: now.toISOString(),
      applications,
      interviews,
      networkingActivities: contacts,
      resumesCreated: resumes
    });
  } catch (error) {
    console.error('Weekly summary error:', error);
    res.status(500).json({ error: 'Failed to get weekly summary' });
  }
});

export default router;
