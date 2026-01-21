import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';

const router = Router();

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
    const { experience, skills, targetRole } = req.body;

    const summary = await openRouterService.generateResumeSummary(
      experience || [],
      skills || [],
      targetRole
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

    res.json({ enhanced });
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

    res.json({ content });
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
    res.json(analysis);
  } catch (error) {
    console.error('AI job match error:', error);
    res.status(500).json({ error: 'Failed to analyze job match' });
  }
});

// Generate interview questions
router.post('/interview/questions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, company, interviewType, skills, experienceLevel, count } = req.body;

    const questions = await openRouterService.generateInterviewQuestions({
      jobTitle,
      company,
      interviewType: interviewType || 'general',
      skills,
      experienceLevel,
      count
    });

    res.json({ questions });
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
    res.json(evaluation);
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
    res.json(analysis);
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

    res.json(insights);
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
    res.json(analysis);
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

    res.json({ message });
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

    res.json({ email });
  } catch (error) {
    console.error('AI follow-up email error:', error);
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

export default router;
