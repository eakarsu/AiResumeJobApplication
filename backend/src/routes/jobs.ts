import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';

const router = Router();

// Get all jobs with filters
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      location,
      locationType,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      industry,
      page = '1',
      limit = '20'
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    if (location) where.location = { contains: location as string, mode: 'insensitive' };
    if (locationType) where.locationType = locationType;
    if (employmentType) where.employmentType = employmentType;
    if (experienceLevel) where.experienceLevel = experienceLevel;
    if (industry) where.industry = industry;
    if (salaryMin) where.salaryMin = { gte: parseInt(salaryMin as string) };
    if (salaryMax) where.salaryMax = { lte: parseInt(salaryMax as string) };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { postedDate: 'desc' }
      }),
      prisma.job.count({ where })
    ]);

    res.json({
      jobs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to get jobs' });
  }
});

// Get single job
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id }
    });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user has saved this job
    let isSaved = false;
    if (req.userId) {
      const savedJob = await prisma.savedJob.findUnique({
        where: {
          userId_jobId: {
            userId: req.userId,
            jobId: req.params.id
          }
        }
      });
      isSaved = !!savedJob;
    }

    res.json({ ...job, isSaved });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to get job' });
  }
});

// Save job
router.post('/:id/save', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const savedJob = await prisma.savedJob.upsert({
      where: {
        userId_jobId: {
          userId: req.userId!,
          jobId: req.params.id
        }
      },
      update: { notes: req.body.notes },
      create: {
        userId: req.userId!,
        jobId: req.params.id,
        notes: req.body.notes
      }
    });

    res.json(savedJob);
  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({ error: 'Failed to save job' });
  }
});

// Unsave job
router.delete('/:id/save', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.savedJob.delete({
      where: {
        userId_jobId: {
          userId: req.userId!,
          jobId: req.params.id
        }
      }
    });
    res.json({ message: 'Job unsaved successfully' });
  } catch (error) {
    console.error('Unsave job error:', error);
    res.status(500).json({ error: 'Failed to unsave job' });
  }
});

// Get saved jobs
router.get('/user/saved', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: req.userId },
      include: { job: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(savedJobs);
  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({ error: 'Failed to get saved jobs' });
  }
});

// AI: Analyze job match
router.post('/:id/ai/match', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { resumeId } = req.body;

    const [job, resume] = await Promise.all([
      prisma.job.findUnique({ where: { id: req.params.id } }),
      prisma.resume.findFirst({ where: { id: resumeId, userId: req.userId } })
    ]);

    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const analysis = await openRouterService.analyzeJobMatch(resume, job);

    // Save match score
    await prisma.jobMatchScore.upsert({
      where: {
        jobId_userId: {
          jobId: job.id,
          userId: req.userId!
        }
      },
      update: {
        overallScore: analysis.overallScore,
        skillsMatch: analysis.skillsMatch,
        experienceMatch: analysis.experienceMatch,
        educationMatch: analysis.educationMatch,
        locationMatch: 80,
        salaryMatch: 80,
        reasoning: analysis.reasoning,
        missingSkills: analysis.missingSkills,
        matchingSkills: analysis.matchingSkills
      },
      create: {
        jobId: job.id,
        userId: req.userId!,
        overallScore: analysis.overallScore,
        skillsMatch: analysis.skillsMatch,
        experienceMatch: analysis.experienceMatch,
        educationMatch: analysis.educationMatch,
        locationMatch: 80,
        salaryMatch: 80,
        reasoning: analysis.reasoning,
        missingSkills: analysis.missingSkills,
        matchingSkills: analysis.matchingSkills
      }
    });

    res.json(analysis);
  } catch (error) {
    console.error('AI match error:', error);
    res.status(500).json({ error: 'Failed to analyze job match' });
  }
});

// Get recommended jobs for user
router.get('/user/recommended', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Get user's skills from their resumes
    const resumes = await prisma.resume.findMany({
      where: { userId: req.userId, isActive: true },
      select: { skills: true }
    });

    const allSkills = [...new Set(resumes.flatMap(r => r.skills))];

    // Find jobs matching user skills
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true,
        skills: { hasSome: allSkills }
      },
      orderBy: { postedDate: 'desc' },
      take: 20
    });

    res.json(jobs);
  } catch (error) {
    console.error('Get recommended jobs error:', error);
    res.status(500).json({ error: 'Failed to get recommended jobs' });
  }
});

export default router;
