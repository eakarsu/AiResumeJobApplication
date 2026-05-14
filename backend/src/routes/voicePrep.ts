import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';
import prisma from '../services/prisma';

const router = Router();

/**
 * POST /api/voice-prep/analyze
 *
 * Body: { question: string, transcript: string, durationSec?: number, context?: string }
 *
 * Computes filler-word + pace metrics from the user's *already-transcribed* audio
 * (the actual STT happens client-side using the browser's webkitSpeechRecognition
 * or a separate Whisper service — keeping this endpoint dependency-free), then
 * pipes the answer through evaluateInterviewAnswer for rubric scoring.
 */
router.post('/analyze', async (req: AuthRequest, res: Response) => {
  try {
    const { question, transcript, durationSec, context } = req.body || {};
    if (!question || !transcript) {
      return res.status(400).json({ error: 'question and transcript are required' });
    }

    // Filler-word count
    const FILLERS = ['um', 'uh', 'like', 'you know', 'kinda', 'sort of', 'basically', 'literally', 'so'];
    const lower = ` ${String(transcript).toLowerCase()} `;
    const fillerCounts: Record<string, number> = {};
    let totalFillers = 0;
    for (const f of FILLERS) {
      const m = lower.match(new RegExp(`\\b${f.replace(/\s+/g, '\\s+')}\\b`, 'g'));
      const c = m?.length || 0;
      if (c > 0) {
        fillerCounts[f] = c;
        totalFillers += c;
      }
    }

    // Pace = words per minute
    const wordCount = String(transcript).trim().split(/\s+/).filter(Boolean).length;
    const minutes = durationSec ? durationSec / 60 : Math.max(1, wordCount / 150);
    const wpm = Math.round(wordCount / minutes);

    // Pace assessment
    let paceLabel: 'too slow' | 'good' | 'too fast' = 'good';
    if (wpm < 110) paceLabel = 'too slow';
    else if (wpm > 175) paceLabel = 'too fast';

    const evaluation = await openRouterService.evaluateInterviewAnswer(
      question,
      String(transcript),
      context
    );

    // Persist as InterviewEvaluation row, augmented with voice metrics
    const saved = await prisma.interviewEvaluation.create({
      data: {
        userId: req.userId!,
        question,
        answer: String(transcript),
        context: context || null,
        score: evaluation.score,
        feedback:
          `${evaluation.feedback}\n\n[Voice metrics] WPM: ${wpm} (${paceLabel}). ` +
          `Filler words: ${totalFillers} total (${Object.entries(fillerCounts)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ') || 'none'}).`,
        improvements: evaluation.improvements || [],
      },
    });

    res.json({
      evaluation: { ...evaluation, evaluationId: saved.id },
      voiceMetrics: {
        wordCount,
        durationSec: durationSec || Math.round(minutes * 60),
        wpm,
        paceLabel,
        totalFillers,
        fillerBreakdown: fillerCounts,
      },
    });
  } catch (err: any) {
    console.error('voice-prep error:', err);
    res.status(500).json({ error: err?.message || 'Voice analysis failed' });
  }
});

router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20')));
    const where = { userId: req.userId };
    const [items, total] = await Promise.all([
      prisma.interviewEvaluation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.interviewEvaluation.count({ where }),
    ]);
    res.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
