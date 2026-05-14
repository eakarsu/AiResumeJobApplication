// AI Offer negotiation coach
// AI simulates negotiation, suggests counter-offers based on benchmarks
import express, { Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
// prisma optional

const router = express.Router();
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
// TODO: configure credentials — set process.env.OPENROUTER_API_KEY

async function callLLM(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { success: false, error: 'OPENROUTER_API_KEY not configured' } as const;
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const response = await fetch(baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AiResumeJobApplication'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.4
    })
  });
  if (!response.ok) return { success: false, error: `LLM error ${response.status}` } as const;
  const data: any = await response.json();
  return { success: true, content: data?.choices?.[0]?.message?.content || '' } as const;
}

function parseJsonLoose(text: string): any {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) { try { return JSON.parse(m[1].trim()); } catch {} }
  const a = text.search(/[{\[]/);
  const b = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (a !== -1 && b !== -1) { try { return JSON.parse(text.slice(a, b + 1)); } catch {} }
  return null;
}

router.use(authenticateToken);
router.post('/', async (req: any, res: Response) => {
  try {
    const payload = req.body || {};
    const context = payload.context || payload.data || payload;
    const systemPrompt = `You are an expert AI assistant for AiResumeJobApplication. Focus area: Offer negotiation coach. ${`AI simulates negotiation, suggests counter-offers based on benchmarks`}. Respond ONLY with valid JSON (no markdown fences).`;
    const userPrompt = `Task: Offer negotiation coach.\n${`AI simulates negotiation, suggests counter-offers based on benchmarks`}\n\nInput payload (JSON):\n${JSON.stringify(context, null, 2)}\n\nReturn JSON with shape:\n{ "summary": "...", "findings": ["..."], "recommendations": ["..."], "score": 0, "confidence": 0 }`;
    const llm = await callLLM(systemPrompt, userPrompt);
    if (!llm.success) return res.status(503).json({ error: llm.error });
    const parsed = parseJsonLoose(llm.content) || { raw: llm.content };
    res.json({ feature: 'negotiation-coach', model: MODEL, result: parsed });
  } catch (err: any) {
    console.error('[negotiation-coach]', err?.message);
    res.status(500).json({ error: err?.message || 'internal error' });
  }
});

router.get('/health', (_req, res) => res.json({ ok: true, feature: 'negotiation-coach' }));

export default router;
