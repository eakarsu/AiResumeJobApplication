import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';
import prisma from '../services/prisma';

const router = Router();

/**
 * POST /api/linkedin/sync
 * Body: { url: string, snippet?: string, targetRole?: string }
 *
 * Note: this endpoint does NOT scrape LinkedIn (TOS / blocking). The user pastes
 * the public profile snippet (or summary text). The AI then extracts structured
 * experience and produces "profile gap" insights vs an optional target role.
 */
router.post('/sync', async (req: AuthRequest, res: Response) => {
  try {
    const { url, snippet, targetRole } = req.body || {};
    if (!url || !snippet) return res.status(400).json({ error: 'url and snippet are required' });

    const prompt = `From the LinkedIn profile snippet below, extract a structured profile and identify
gaps vs the target role: "${targetRole || 'general professional growth'}".

Snippet:
${String(snippet).slice(0, 6000)}

Return raw JSON only:
{
  "headline": "string",
  "summary": "string",
  "experience": [{ "title": "string", "company": "string", "duration": "string", "highlights": ["string"] }],
  "education": [{ "degree": "string", "school": "string" }],
  "skills": ["string"],
  "gapInsights": {
    "missingSkills": ["string"],
    "weakSections": ["string"],
    "recommendations": ["string"]
  }
}`;

    const aiRaw = await openRouterService.chat(
      [
        { role: 'system', content: 'You are a LinkedIn-profile coach. Output strict JSON only.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.3, maxTokens: 2500 }
    );

    let parsed: any = null;
    try {
      const cleaned = aiRaw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const s = aiRaw.indexOf('{');
      const e = aiRaw.lastIndexOf('}');
      if (s !== -1 && e !== -1) {
        try { parsed = JSON.parse(aiRaw.slice(s, e + 1)); } catch {}
      }
    }
    if (!parsed) return res.status(502).json({ error: 'AI returned malformed JSON', raw: aiRaw.slice(0, 400) });

    const saved = await prisma.linkedinProfile.upsert({
      where: { userId: req.userId! },
      update: {
        url,
        rawSnippet: String(snippet).slice(0, 50_000),
        parsedJson: parsed,
        gapInsights: parsed?.gapInsights || null,
        aiResults: { raw: aiRaw },
        syncedAt: new Date(),
      },
      create: {
        userId: req.userId!,
        url,
        rawSnippet: String(snippet).slice(0, 50_000),
        parsedJson: parsed,
        gapInsights: parsed?.gapInsights || null,
        aiResults: { raw: aiRaw },
      },
    });

    res.json({ profile: saved, parsed });
  } catch (err: any) {
    console.error('linkedin sync error:', err);
    res.status(500).json({ error: err?.message || 'Sync failed' });
  }
});

router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const p = await prisma.linkedinProfile.findUnique({ where: { userId: req.userId! } });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
