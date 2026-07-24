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

router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>('SELECT id,input,output,model,"createdAt" FROM resume_ai_interactions WHERE "userId"=$1 ORDER BY "createdAt" DESC LIMIT 50', req.userId!);
    res.json({ history: rows });
  } catch (error) {
    console.error('AI history error:', error);
    res.status(500).json({ error: 'Failed to load AI history' });
  }
});

// Generic AI chat endpoint
router.post('/chat', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { messages, temperature, maxTokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await openRouterService.chat(messages, { temperature, maxTokens });
    const saved = await prisma.$queryRawUnsafe<any[]>('INSERT INTO resume_ai_interactions(id,"userId",input,output,model) VALUES(gen_random_uuid(),$1,$2::jsonb,$3::jsonb,$4) RETURNING id', req.userId!, JSON.stringify({ messages, temperature, maxTokens }), JSON.stringify({ response }), process.env.OPENROUTER_MODEL!);
    res.json({ response, interactionId: saved[0].id, model: process.env.OPENROUTER_MODEL });
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

// ─── SSE Streaming variants ──────────────────────────────────────────────────

/**
 * Helper: write a single SSE event to the response.
 */
function sseWrite(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sseHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();
}

// Stream cover letter generation
router.post('/cover-letter/generate/stream', authenticateToken, async (req: AuthRequest, res: Response) => {
  sseHeaders(res);
  try {
    const { jobTitle, company, jobDescription, resume, tone = 'professional' } = req.body;

    const prompt = `Write a compelling cover letter for the following position:

Position: ${jobTitle}
Company: ${company}
${jobDescription ? `Job Description: ${jobDescription}` : ''}
${resume ? `Candidate Background: ${JSON.stringify(resume)}` : ''}
Tone: ${tone}

Write a 300-400 word cover letter. Skip generic openers. Use CAR method. End with confident call to action. Return only the cover letter text.`;

    let fullContent = '';
    await openRouterService.chatStream(
      [
        { role: 'system', content: 'You are a senior career strategist who has written cover letters that helped candidates land roles at Fortune 500 companies.' },
        { role: 'user', content: prompt }
      ],
      (token) => {
        sseWrite(res, 'token', { token });
        fullContent += token;
      }
    );

    // Save and finish
    const coverLetter = await saveToDb('cover letter stream', () =>
      prisma.coverLetter.create({
        data: {
          userId: req.userId!,
          title: `Cover Letter - ${jobTitle} at ${company}`,
          content: fullContent,
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
          action: 'ai_cover_letter_stream',
          entityType: 'coverLetter',
          entityId: coverLetter?.id || undefined,
          metadata: { jobTitle, company, tone }
        }
      })
    );

    sseWrite(res, 'done', { coverLetterId: coverLetter?.id || null });
    res.end();
  } catch (error: any) {
    sseWrite(res, 'error', { error: error?.message || 'Streaming failed' });
    res.end();
  }
});

// Stream resume optimize
router.post('/resume/optimize/stream', authenticateToken, async (req: AuthRequest, res: Response) => {
  sseHeaders(res);
  try {
    const { resume, jobDescription } = req.body;

    const prompt = `Analyze this resume and provide optimization suggestions:

Resume: ${JSON.stringify(resume)}
${jobDescription ? `Target Job Description: ${jobDescription}` : ''}

Evaluate the resume across ATS Compatibility, Impact & Metrics, Relevance, and Structure.
Return a JSON object: { "suggestions": ["..."], "score": number, "keywords": ["..."] }
IMPORTANT: All array items must be plain strings.`;

    let fullContent = '';
    await openRouterService.chatStream(
      [
        { role: 'system', content: 'You are a senior ATS optimization expert. Respond with raw JSON only.' },
        { role: 'user', content: prompt }
      ],
      (token) => {
        sseWrite(res, 'token', { token });
        fullContent += token;
      }
    );

    // Parse and persist
    let analysis: { suggestions: string[]; score: number; keywords: string[] };
    try {
      const clean = fullContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      analysis = JSON.parse(clean);
    } catch {
      analysis = { suggestions: [fullContent], score: 70, keywords: [] };
    }

    if (resume?.id) {
      await saveToDb('resume optimize stream', () =>
        prisma.resume.update({
          where: { id: resume.id },
          data: { atsScore: analysis.score, keywords: analysis.keywords }
        })
      );
    }

    sseWrite(res, 'done', { analysis });
    res.end();
  } catch (error: any) {
    sseWrite(res, 'error', { error: error?.message || 'Streaming failed' });
    res.end();
  }
});

// Stream company analysis
router.post('/company/analyze/stream', authenticateToken, async (req: AuthRequest, res: Response) => {
  sseHeaders(res);
  try {
    const { companyName, role } = req.body;

    const prompt = `Provide insights about ${companyName}${role ? ` for a ${role} position` : ''}:

Research and analyze ${companyName} from a job-seeker's perspective. Be balanced and honest.

Return this exact JSON schema:
{
  "overview": "string",
  "culture": "string",
  "interviewTips": ["string"],
  "questionsToAsk": ["string"],
  "prosAndCons": { "pros": ["string"], "cons": ["string"] }
}
IMPORTANT: All array items must be plain strings.`;

    let fullContent = '';
    await openRouterService.chatStream(
      [
        { role: 'system', content: 'You are a career research analyst who provides balanced, honest assessments. Respond with raw JSON only.' },
        { role: 'user', content: prompt }
      ],
      (token) => {
        sseWrite(res, 'token', { token });
        fullContent += token;
      }
    );

    let analysis: any;
    try {
      const clean = fullContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      analysis = JSON.parse(clean);
    } catch {
      analysis = { overview: fullContent, culture: '', interviewTips: [], questionsToAsk: [], prosAndCons: { pros: [], cons: [] } };
    }

    const companyResearch = await saveToDb('company research stream', () =>
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

    sseWrite(res, 'done', { analysis, companyResearchId: companyResearch?.id || null });
    res.end();
  } catch (error: any) {
    sseWrite(res, 'error', { error: error?.message || 'Streaming failed' });
    res.end();
  }
});

// One-click tailor: tailored bullets + cover letter for a specific job
router.post('/tailor-for-job', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { resumeId, jobId } = req.body;

    if (!resumeId || !jobId) {
      return res.status(400).json({ error: 'resumeId and jobId are required' });
    }

    const [resume, job] = await Promise.all([
      prisma.resume.findFirst({ where: { id: resumeId, userId: req.userId } }),
      prisma.job.findUnique({ where: { id: jobId } })
    ]);

    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const { tailoredBullets, coverLetter } = await openRouterService.tailorForJob(resume, job);

    // Persist tailored bullets as EnhancedBullets records (one per experience entry)
    const savedBullets = await saveToDb('tailor bullets', () =>
      Promise.all(
        tailoredBullets.map(tb =>
          prisma.enhancedBullets.create({
            data: {
              userId: req.userId!,
              resumeId,
              role: tb.role,
              company: tb.company,
              originalBullets: tb.original,
              enhancedBullets: tb.enhanced
            }
          })
        )
      )
    );

    // Persist cover letter
    const savedCoverLetter = await saveToDb('tailor cover letter', () =>
      prisma.coverLetter.create({
        data: {
          userId: req.userId!,
          title: `Tailored Cover Letter – ${job.title} at ${job.company}`,
          content: coverLetter,
          targetCompany: job.company,
          targetPosition: job.title,
          tone: 'professional',
          isAiGenerated: true
        }
      })
    );

    await saveToDb('activity log', () =>
      prisma.activityLog.create({
        data: {
          userId: req.userId!,
          action: 'ai_tailor_for_job',
          entityType: 'resume',
          entityId: resumeId,
          metadata: {
            jobId,
            jobTitle: job.title,
            company: job.company,
            bulletEntriesEnhanced: tailoredBullets.length
          }
        }
      })
    );

    res.json({
      tailoredBullets,
      coverLetter,
      savedBulletIds: savedBullets?.map(b => b.id) || [],
      coverLetterId: savedCoverLetter?.id || null
    });
  } catch (error) {
    console.error('Tailor-for-job error:', error);
    res.status(500).json({ error: 'Failed to tailor resume for job' });
  }
});

// Helper to extract JSON from an AI response
function tryParseJson(text: string): any {
  try { return JSON.parse(text); } catch {}
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (block) { try { return JSON.parse(block[1]); } catch {} }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  return { raw: text };
}

// Rejection Analysis - structured feedback on why a candidate may have been rejected
router.post('/rejection-analysis', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobDescription, resume, applicationDetails, rejectionMessage } = req.body || {};
    if (!jobDescription) return res.status(400).json({ error: 'jobDescription is required' });
    const messages = [
      { role: 'system' as const, content: 'You are an expert career coach. Analyze a job rejection objectively and provide actionable feedback. Respond with ONLY valid JSON.' },
      { role: 'user' as const, content: `Job description:\n${jobDescription}\n\nCandidate resume:\n${JSON.stringify(resume || {}, null, 2)}\n\nApplication details:\n${JSON.stringify(applicationDetails || {}, null, 2)}\n\nRejection message (if any):\n${rejectionMessage || '(none)'}\n\nReturn JSON: { likely_reasons:[{reason,evidence,severity:"low|medium|high"}], skill_gaps:[], experience_gaps:[], resume_signal_issues:[], strong_points:[], improvements_for_next_application:[{action,how,priority}], reapply_recommendation:"yes|no|maybe", followup_email_suggestion, summary }.` }
    ];
    const text = await openRouterService.chat(messages, { temperature: 0.3, maxTokens: 1500 });
    res.json({ analysis: tryParseJson(text) });
  } catch (error) {
    console.error('Rejection analysis error:', error);
    res.status(500).json({ error: 'Failed to run rejection analysis' });
  }
});

// Offer Negotiation Simulator - simulate counter-offer turns
router.post('/offer-negotiation-simulator', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { offer, candidateProfile, marketBenchmarks, priorities, lastMessage } = req.body || {};
    if (!offer) return res.status(400).json({ error: 'offer is required' });
    const messages = [
      { role: 'system' as const, content: 'You are a compensation negotiation coach. Simulate the recruiter side AND coach the candidate. Respond with ONLY valid JSON.' },
      { role: 'user' as const, content: `Offer details:\n${JSON.stringify(offer, null, 2)}\n\nCandidate profile:\n${JSON.stringify(candidateProfile || {}, null, 2)}\n\nMarket benchmarks:\n${JSON.stringify(marketBenchmarks || {}, null, 2)}\n\nPriorities (ordered):\n${JSON.stringify(priorities || ['base', 'equity', 'bonus', 'remote', 'PTO'])}\n\nLast candidate message (if any):\n${lastMessage || '(none — opening turn)'}\n\nReturn JSON: { coach_brief:{leverage,risk,zopa_estimate,best_alternative}, recommended_counter:{base,equity,bonus,signon,start_date,other}, recommended_message_to_send, simulated_recruiter_reply, recruiter_likely_responses:[{stance,probability,response}], next_step_options:[{move,rationale,risk}] }.` }
    ];
    const text = await openRouterService.chat(messages, { temperature: 0.5, maxTokens: 2000 });
    res.json({ simulation: tryParseJson(text) });
  } catch (error) {
    console.error('Negotiation simulator error:', error);
    res.status(500).json({ error: 'Failed to simulate negotiation' });
  }
});

// Career Trajectory Analyzer - predict career path & gaps to fill
router.post('/career-trajectory-analyzer', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { resume, currentRole, targetRole, horizonYears } = req.body || {};
    if (!resume && !currentRole) return res.status(400).json({ error: 'resume or currentRole is required' });
    const messages = [
      { role: 'system' as const, content: 'You are a career-path strategist. Project realistic next moves and identify gaps to close. Respond with ONLY valid JSON.' },
      { role: 'user' as const, content: `Resume:\n${JSON.stringify(resume || {}, null, 2)}\n\nCurrent role: ${currentRole || ''}\nTarget role: ${targetRole || ''}\nHorizon: ${horizonYears || 5} years\n\nReturn JSON: { current_level, predicted_paths:[{path_name,steps:[{role,timeframe,probability,key_responsibilities,typical_comp_range}], milestones:[]}], key_skill_gaps:[{skill,closure_methods:[],estimated_time}], risk_factors:[], advantage_factors:[], one_year_plan:[{action,owner:"self",priority,evidence}], three_year_vision, summary }.` }
    ];
    const text = await openRouterService.chat(messages, { temperature: 0.4, maxTokens: 2200 });
    res.json({ trajectory: tryParseJson(text) });
  } catch (error) {
    console.error('Career trajectory error:', error);
    res.status(500).json({ error: 'Failed to analyze career trajectory' });
  }
});

// Helper to map "no key" errors to 503
function isMissingKeyError(err: any): boolean {
  const msg = String(err?.message || '');
  return /OPENROUTER_API_KEY|api key not configured|api key/i.test(msg);
}

// Application Tracker - generate a structured tracking summary + next-step plan
router.post('/application-tracker', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { applications, focusJobIds, candidateProfile } = req.body || {};
    if (!applications || !Array.isArray(applications) || applications.length === 0) {
      return res.status(400).json({ error: 'applications (non-empty array) is required' });
    }
    const messages = [
      { role: 'system' as const, content: 'You are a job-search ops coach. Analyze a candidate\'s application pipeline and produce a structured status tracker with prioritized next steps. Respond with ONLY valid JSON.' },
      { role: 'user' as const, content: `Applications:\n${JSON.stringify(applications, null, 2)}\n\nFocus job IDs (if any): ${JSON.stringify(focusJobIds || [])}\n\nCandidate profile:\n${JSON.stringify(candidateProfile || {}, null, 2)}\n\nReturn JSON: { pipeline_summary:{total,by_stage,by_status,stale_count}, per_application:[{job_id,company,role,stage,health:"green|yellow|red",last_activity,days_in_stage,next_action,suggested_followup_message}], priority_actions:[{action,reason,priority:"high|medium|low",due_in_days}], pipeline_recommendations:[], summary }.` }
    ];
    const text = await openRouterService.chat(messages, { temperature: 0.3, maxTokens: 2000 });
    res.json({ tracker: tryParseJson(text) });
  } catch (error: any) {
    console.error('Application tracker error:', error);
    if (isMissingKeyError(error)) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured on server.' });
    }
    res.status(500).json({ error: 'Failed to run application tracker' });
  }
});

// Interview Scheduling Optimizer - rank candidate slots vs constraints
router.post('/interview-scheduling-optimizer', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { candidateAvailability, recruiterAvailability, interviewType, durationMinutes, timezone, priorities, constraints } = req.body || {};
    if (!candidateAvailability || !recruiterAvailability) {
      return res.status(400).json({ error: 'candidateAvailability and recruiterAvailability are required' });
    }
    const messages = [
      { role: 'system' as const, content: 'You are an interview-scheduling optimizer. Rank candidate slots based on overlap, energy/circadian factors, prep buffer, and recruiter constraints. Respond with ONLY valid JSON.' },
      { role: 'user' as const, content: `Candidate availability:\n${JSON.stringify(candidateAvailability, null, 2)}\n\nRecruiter availability:\n${JSON.stringify(recruiterAvailability, null, 2)}\n\nInterview type: ${interviewType || 'general'}\nDuration (minutes): ${durationMinutes || 60}\nTimezone: ${timezone || 'unspecified'}\nCandidate priorities: ${JSON.stringify(priorities || ['energy_peak', 'morning_freshness', 'prep_buffer'])}\nConstraints: ${JSON.stringify(constraints || {})}\n\nReturn JSON: { ranked_slots:[{start,end,timezone,score,reasoning,risk_flags:[]}], top_recommendation:{start,end,reasoning}, conflicts:[], suggestions_for_candidate:[{action,why}], message_to_recruiter, summary }.` }
    ];
    const text = await openRouterService.chat(messages, { temperature: 0.3, maxTokens: 1800 });
    res.json({ scheduling: tryParseJson(text) });
  } catch (error: any) {
    console.error('Interview scheduling optimizer error:', error);
    if (isMissingKeyError(error)) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured on server.' });
    }
    res.status(500).json({ error: 'Failed to run scheduling optimizer' });
  }
});

export default router;
