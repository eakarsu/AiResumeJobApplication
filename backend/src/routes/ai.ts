import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';
import prisma from '../services/prisma';

const router = Router();

// Helper: attempt a DB save without blocking the response
async function saveToDb<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    console.error(`DB save failed (${label}):`, e);
    return null;
  }
}

// Generic AI chat endpoint
router.post('/chat', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { messages, temperature, maxTokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await openRouterService.chat(messages, { temperature, maxTokens });
    res.json({ response });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'AI service error' });
  }
});

// Generate resume summary
router.post('/resume/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { experience, skills, targetRole, resumeId } = req.body;

    const summary = await openRouterService.generateResumeSummary(
      experience || [],
      skills || [],
      targetRole
    );

    // Save summary to resume if resumeId provided
    if (resumeId) {
      await saveToDb('resume summary', () =>
        prisma.resume.update({
          where: { id: resumeId },
          data: { summary, isAiGenerated: true }
        })
      );
    }

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_resume_summary',
          entityType: 'resume',
          entityId: resumeId || undefined,
          metadata: { targetRole }
        }
      })
    );

    res.json({ summary });
  } catch (error) {
    console.error('AI resume summary error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Optimize resume
router.post('/resume/optimize', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { resume, jobDescription } = req.body;

    const analysis = await openRouterService.optimizeResume(resume, jobDescription);

    // Save ATS score and keywords back to the resume if it has an ID
    if (resume?.id) {
      await saveToDb('resume optimize', () =>
        prisma.resume.update({
          where: { id: resume.id },
          data: {
            atsScore: analysis.score,
            keywords: analysis.keywords
          }
        })
      );
    }

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_resume_optimize',
          entityType: 'resume',
          entityId: resume?.id || undefined,
          metadata: { score: analysis.score, keywordCount: analysis.keywords?.length }
        }
      })
    );

    res.json(analysis);
  } catch (error) {
    console.error('AI optimize resume error:', error);
    res.status(500).json({ error: 'Failed to optimize resume' });
  }
});

// Enhance bullet points
router.post('/resume/enhance-bullets', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { bullets, role, company } = req.body;

    const enhanced = await openRouterService.enhanceExperienceBullets(
      bullets,
      role,
      company
    );

    // Save enhanced bullets to DB
    const savedBullets = await saveToDb('enhanced bullets', () =>
      prisma.enhancedBullets.create({
        data: {
          userId: req.userId!,
          resumeId: req.body.resumeId || null,
          role,
          company,
          originalBullets: bullets || [],
          enhancedBullets: enhanced || []
        }
      })
    );

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_enhance_bullets',
          entityType: 'resume',
          entityId: savedBullets?.id || undefined,
          metadata: { role, company, bulletCount: bullets?.length }
        }
      })
    );

    res.json({ enhanced, enhancedBulletsId: savedBullets?.id || null });
  } catch (error) {
    console.error('AI enhance bullets error:', error);
    res.status(500).json({ error: 'Failed to enhance bullets' });
  }
});

// Generate cover letter
router.post('/cover-letter/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, company, jobDescription, resume, tone } = req.body;

    const content = await openRouterService.generateCoverLetter({
      jobTitle,
      company,
      jobDescription,
      resume,
      tone
    });

    // Auto-save the generated cover letter to DB
    const coverLetter = await saveToDb('cover letter', () =>
      prisma.coverLetter.create({
        data: {
          userId: req.userId!,
          title: `Cover Letter - ${jobTitle} at ${company}`,
          content,
          targetCompany: company,
          targetPosition: jobTitle,
          tone: tone || 'professional',
          isAiGenerated: true
        }
      })
    );

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_cover_letter_generated',
          entityType: 'coverLetter',
          entityId: coverLetter?.id || undefined,
          metadata: { jobTitle, company, tone }
        }
      })
    );

    res.json({ content, coverLetterId: coverLetter?.id || null });
  } catch (error) {
    console.error('AI cover letter error:', error);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

// Analyze job match
router.post('/job/match', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { resume, job } = req.body;

    const analysis = await openRouterService.analyzeJobMatch(resume, job);

    // Save match score if we have a job ID
    if (job?.id) {
      await saveToDb('job match score', () =>
        prisma.jobMatchScore.upsert({
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
            locationMatch: 0,
            salaryMatch: 0,
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
            locationMatch: 0,
            salaryMatch: 0,
            reasoning: analysis.reasoning,
            missingSkills: analysis.missingSkills,
            matchingSkills: analysis.matchingSkills
          }
        })
      );
    }

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_job_match',
          entityType: 'job',
          entityId: job?.id || undefined,
          metadata: { overallScore: analysis.overallScore }
        }
      })
    );

    res.json(analysis);
  } catch (error) {
    console.error('AI job match error:', error);
    res.status(500).json({ error: 'Failed to analyze job match' });
  }
});

// Generate interview questions
router.post('/interview/questions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, company, interviewType, skills, experienceLevel, count, interviewId } = req.body;

    const questions = await openRouterService.generateInterviewQuestions({
      jobTitle,
      company,
      interviewType: interviewType || 'general',
      skills,
      experienceLevel,
      count
    });

    // Always save questions to DB (interviewId is optional)
    const savedQuestions = await saveToDb('interview questions', () =>
      Promise.all(
        questions.map(q =>
          prisma.interviewPrepQuestion.create({
            data: {
              interviewId: interviewId || null,
              question: q.question,
              suggestedAnswer: q.suggestedAnswer,
              tips: q.tips,
              category: q.category || interviewType || 'general',
              difficulty: q.difficulty || 'medium',
              isAiGenerated: true
            }
          })
        )
      )
    );

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_interview_questions',
          entityType: 'interview',
          entityId: interviewId || undefined,
          metadata: { jobTitle, interviewType, questionCount: questions.length }
        }
      })
    );

    res.json({ questions, questionIds: savedQuestions?.map(q => q.id) || [] });
  } catch (error) {
    console.error('AI interview questions error:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

// Evaluate interview answer
router.post('/interview/evaluate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { question, answer, context } = req.body;

    const evaluation = await openRouterService.evaluateInterviewAnswer(question, answer, context);

    // Save evaluation to DB
    const savedEvaluation = await saveToDb('interview evaluation', () =>
      prisma.interviewEvaluation.create({
        data: {
          userId: req.userId!,
          question,
          answer,
          context: context || null,
          score: evaluation.score,
          feedback: evaluation.feedback,
          improvements: evaluation.improvements || []
        }
      })
    );

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_interview_evaluate',
          entityType: 'interview',
          entityId: savedEvaluation?.id || undefined,
          metadata: { score: evaluation.score }
        }
      })
    );

    res.json({ ...evaluation, evaluationId: savedEvaluation?.id || null });
  } catch (error) {
    console.error('AI evaluate answer error:', error);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// Analyze skills gap
router.post('/skills/gap', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentSkills, targetRole, industry } = req.body;

    const analysis = await openRouterService.analyzeSkillsGap(currentSkills, targetRole, industry);

    // Save skills gap analysis to DB
    const skillsGapAnalysis = await saveToDb('skills gap analysis', () =>
      prisma.skillsGapAnalysis.create({
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
      })
    );

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_skills_gap',
          entityType: 'skill',
          entityId: skillsGapAnalysis?.id || undefined,
          metadata: { targetRole, industry, missingCount: analysis.missingSkills?.length }
        }
      })
    );

    res.json({ ...analysis, skillsGapAnalysisId: skillsGapAnalysis?.id || null });
  } catch (error) {
    console.error('AI skills gap error:', error);
    res.status(500).json({ error: 'Failed to analyze skills gap' });
  }
});

// Get salary insights
router.post('/salary/insights', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, location, experienceLevel, skills, industry } = req.body;

    const insights = await openRouterService.getSalaryInsights({
      jobTitle,
      location,
      experienceLevel,
      skills,
      industry
    });

    // Save salary research to DB
    const salaryResearch = await saveToDb('salary research', () =>
      prisma.salaryResearch.create({
        data: {
          userId: req.userId!,
          jobTitle,
          location,
          experienceLevel,
          industry: industry || null,
          salaryMin: insights.salaryRange.min,
          salaryMax: insights.salaryRange.max,
          salaryMedian: insights.salaryRange.median,
          salaryCurrency: 'USD',
          dataSource: 'ai_generated'
        }
      })
    );

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_salary_insights',
          entityType: 'salary',
          entityId: salaryResearch?.id || undefined,
          metadata: { jobTitle, location, experienceLevel, median: insights.salaryRange.median }
        }
      })
    );

    res.json({ ...insights, salaryResearchId: salaryResearch?.id || null });
  } catch (error) {
    console.error('AI salary insights error:', error);
    res.status(500).json({ error: 'Failed to get salary insights' });
  }
});

// Analyze company
router.post('/company/analyze', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, role } = req.body;

    const analysis = await openRouterService.analyzeCompany(companyName, role);

    // Save company research to DB
    const companyResearch = await saveToDb('company research', () =>
      prisma.companyResearch.create({
        data: {
          userId: req.userId!,
          companyName,
          description: analysis.overview,
          culture: analysis.culture,
          interviewProcess: analysis.interviewTips?.join('\n'),
          prosNotes: analysis.prosAndCons?.pros?.join('\n'),
          consNotes: analysis.prosAndCons?.cons?.join('\n')
        }
      })
    );

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_company_analyze',
          entityType: 'company',
          entityId: companyResearch?.id || undefined,
          metadata: { companyName, role }
        }
      })
    );

    res.json({ ...analysis, companyResearchId: companyResearch?.id || null });
  } catch (error) {
    console.error('AI company analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze company' });
  }
});

// Generate networking message
router.post('/networking/message', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { purpose, recipientInfo, yourBackground, platform } = req.body;

    const message = await openRouterService.generateNetworkingMessage({
      purpose,
      recipientInfo,
      yourBackground,
      platform
    });

    // Save networking message to DB
    const savedMessage = await saveToDb('networking message', () =>
      prisma.generatedMessage.create({
        data: {
          userId: req.userId!,
          messageType: 'networking',
          content: message,
          recipientInfo: recipientInfo || null,
          purpose: purpose || null,
          platform: platform || 'LinkedIn'
        }
      })
    );

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_networking_message',
          entityType: 'network',
          entityId: savedMessage?.id || undefined,
          metadata: { purpose, platform }
        }
      })
    );

    res.json({ message, messageId: savedMessage?.id || null });
  } catch (error) {
    console.error('AI networking message error:', error);
    res.status(500).json({ error: 'Failed to generate message' });
  }
});

// Generate follow-up email
router.post('/email/follow-up', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { context, recipientName, recipientRole, tone } = req.body;

    const email = await openRouterService.generateFollowUpEmail({
      context,
      recipientName,
      recipientRole,
      tone
    });

    // Save follow-up email to DB
    const savedEmail = await saveToDb('follow-up email', () =>
      prisma.generatedMessage.create({
        data: {
          userId: req.userId!,
          messageType: 'follow_up_email',
          content: email,
          recipientName: recipientName || null,
          recipientRole: recipientRole || null,
          tone: tone || 'professional',
          context: context || null
        }
      })
    );

    saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_follow_up_email',
          entityType: 'network',
          entityId: savedEmail?.id || undefined,
          metadata: { recipientName, recipientRole, tone }
        }
      })
    );

    res.json({ email, emailId: savedEmail?.id || null });
  } catch (error) {
    console.error('AI follow-up email error:', error);
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

export default router;
