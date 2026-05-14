import { Router, Response } from 'express';
import multer from 'multer';
import { AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';
import prisma from '../services/prisma';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },                        // 5 MB
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'text/plain';
    if (!ok) return cb(new Error('Only PDF, DOCX, DOC, or TXT are accepted'));
    cb(null, true);
  },
});

async function extractText(buf: Buffer, mime: string): Promise<string> {
  if (mime === 'application/pdf') {
    // Lazy require to keep this optional dep tolerable in dev environments.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse') as (b: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buf);
    return data.text;
  }
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mammoth = require('mammoth') as { extractRawText: (o: any) => Promise<{ value: string }> };
    const out = await mammoth.extractRawText({ buffer: buf });
    return out.value;
  }
  if (mime === 'text/plain') {
    return buf.toString('utf-8');
  }
  return buf.toString('utf-8');
}

/**
 * POST /api/resume-upload
 * multipart/form-data with `file` field. Optional `createResume=true` to also
 * create a Resume row from the parsed structure.
 */
router.post('/', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name: file)' });
    const { originalname, mimetype, size, buffer } = req.file;

    const rawText = await extractText(buffer, mimetype);
    if (!rawText || rawText.length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from file' });
    }

    const promptText = `Extract structured resume data from the raw text below. Return raw JSON only.

Required schema:
{
  "name": "string",
  "email": "string|null",
  "phone": "string|null",
  "location": "string|null",
  "summary": "string",
  "experience": [
    { "title": "string", "company": "string", "location": "string|null",
      "start": "YYYY-MM|YYYY", "end": "YYYY-MM|YYYY|null",
      "bullets": ["string", ...] }
  ],
  "education": [
    { "degree": "string", "school": "string", "year": "string|null" }
  ],
  "skills": ["string", ...],
  "certifications": ["string", ...]
}

Raw resume text (truncated to first 8000 chars):
${rawText.slice(0, 8000)}`;

    const aiRaw = await openRouterService.chat(
      [
        {
          role: 'system',
          content:
            'You are a resume-parsing engine. Output strict JSON matching the requested schema. No code fences, no commentary.',
        },
        { role: 'user', content: promptText },
      ],
      { temperature: 0.2, maxTokens: 3000 }
    );

    let parsed: any = null;
    try {
      const cleaned = aiRaw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      const start = aiRaw.indexOf('{');
      const end = aiRaw.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        try { parsed = JSON.parse(aiRaw.slice(start, end + 1)); } catch {}
      }
    }
    if (!parsed) parsed = { rawText: rawText.slice(0, 1000) };

    let createdResumeId: string | null = null;
    if (req.body.createResume === 'true' || req.body.createResume === true) {
      const resume = await prisma.resume.create({
        data: {
          userId: req.userId!,
          title: parsed?.name ? `${parsed.name} – Imported Resume` : 'Imported Resume',
          summary: parsed?.summary || null,
          experience: parsed?.experience || [],
          education: parsed?.education || [],
          skills: Array.isArray(parsed?.skills) ? parsed.skills : [],
          certifications: parsed?.certifications || null,
          isAiGenerated: true,
        },
      });
      createdResumeId = resume.id;
    }

    const upload_ = await prisma.parsedResumeUpload.create({
      data: {
        userId: req.userId!,
        originalName: originalname,
        mimeType: mimetype,
        size,
        rawText: rawText.slice(0, 50_000),
        parsedJson: parsed,
        resumeId: createdResumeId,
        aiResults: { raw: aiRaw },
      },
    });

    res.json({ upload: upload_, parsed, resumeId: createdResumeId });
  } catch (err: any) {
    console.error('resume-upload error:', err);
    res.status(500).json({ error: err?.message || 'Upload failed' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20')));
    const where = { userId: req.userId };
    const [items, total] = await Promise.all([
      prisma.parsedResumeUpload.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.parsedResumeUpload.count({ where }),
    ]);
    res.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('resume-upload list error:', err);
    res.status(500).json({ error: 'Failed to list uploads' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.parsedResumeUpload.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch upload' });
  }
});

export default router;
