// customViews.ts - 4 endpoints for Resume Views feature pack
// VIZ 1: application funnel data
// VIZ 2: skill match radar data
// NON-VIZ 1: resume PDF generator
// NON-VIZ 2: cover letter builder (returns text + PDF download)

import express, { Request, Response } from 'express';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Health/probe
router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, feature: 'custom-views' });
});

/* ---------------- VIZ 1: Application Funnel ---------------- */
router.get('/funnel', (_req: Request, res: Response) => {
  const stages = [
    { stage: 'Applied', count: 142, fill: '#3b82f6' },
    { stage: 'Reviewed', count: 78, fill: '#6366f1' },
    { stage: 'Interview', count: 31, fill: '#8b5cf6' },
    { stage: 'Offer', count: 9, fill: '#ec4899' },
    { stage: 'Accepted', count: 3, fill: '#10b981' },
  ];
  const totals = {
    applied: stages[0].count,
    accepted: stages[stages.length - 1].count,
    conversionPct: Math.round((stages[stages.length - 1].count / stages[0].count) * 1000) / 10,
  };
  res.json({ feature: 'application-funnel', stages, totals, asOf: new Date().toISOString() });
});

/* ---------------- VIZ 2: Skill Match Radar ---------------- */
router.get('/skill-radar', (req: Request, res: Response) => {
  const target = String(req.query.target || 'Senior Full-Stack Engineer');
  const dimensions = [
    { skill: 'TypeScript', user: 88, required: 90 },
    { skill: 'React',      user: 92, required: 85 },
    { skill: 'Node.js',    user: 80, required: 80 },
    { skill: 'SQL/DB',     user: 70, required: 75 },
    { skill: 'AWS/Cloud',  user: 55, required: 70 },
    { skill: 'System Design', user: 65, required: 80 },
    { skill: 'Communication', user: 82, required: 75 },
  ];
  const gap = dimensions.reduce((acc, d) => acc + Math.max(0, d.required - d.user), 0);
  const matchPct = Math.round(
    (dimensions.reduce((acc, d) => acc + Math.min(d.user, d.required), 0) /
      dimensions.reduce((acc, d) => acc + d.required, 0)) * 100
  );
  res.json({ feature: 'skill-match-radar', target, dimensions, gap, matchPct });
});

/* ---------------- NON-VIZ 1: Resume PDF Generator ---------------- */
router.post('/resume-pdf', (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const fullName: string = body.fullName || 'Jane Doe';
    const email: string = body.email || 'jane@example.com';
    const phone: string = body.phone || '(555) 123-4567';
    const summary: string = body.summary || 'Results-driven engineer.';
    const skills: string[] = Array.isArray(body.skills) ? body.skills : ['TypeScript', 'React', 'Node.js'];
    const workHistory: Array<{ company: string; role: string; period: string; bullets?: string[] }> =
      Array.isArray(body.workHistory) ? body.workHistory : [
        { company: 'Acme Co', role: 'Senior Engineer', period: '2022 - Present',
          bullets: ['Shipped features used by 10k+ users', 'Mentored 4 engineers'] },
      ];
    const education: Array<{ school: string; degree: string; year: string }> =
      Array.isArray(body.education) ? body.education : [
        { school: 'State University', degree: 'B.S. Computer Science', year: '2019' },
      ];

    const doc = new PDFDocument({ size: 'LETTER', margin: 54 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fullName.replace(/\s+/g, '_')}_resume.pdf"`);
    doc.pipe(res);

    // ATS-friendly: single column, plain fonts, no tables/images.
    doc.font('Helvetica-Bold').fontSize(20).text(fullName);
    doc.font('Helvetica').fontSize(10).fillColor('#444').text(`${email} | ${phone}`);
    doc.moveDown(0.7).fillColor('#000');

    doc.font('Helvetica-Bold').fontSize(12).text('SUMMARY');
    doc.font('Helvetica').fontSize(10).text(summary, { align: 'left' });
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(12).text('SKILLS');
    doc.font('Helvetica').fontSize(10).text(skills.join(', '));
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(12).text('EXPERIENCE');
    workHistory.forEach((w) => {
      doc.font('Helvetica-Bold').fontSize(11).text(`${w.role} — ${w.company}`);
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#555').text(w.period);
      doc.fillColor('#000').font('Helvetica').fontSize(10);
      (w.bullets || []).forEach((b) => doc.text('• ' + b, { indent: 12 }));
      doc.moveDown(0.4);
    });

    doc.font('Helvetica-Bold').fontSize(12).text('EDUCATION');
    education.forEach((e) => {
      doc.font('Helvetica').fontSize(10).text(`${e.degree}, ${e.school} (${e.year})`);
    });

    doc.end();
  } catch (err: any) {
    console.error('[customViews.resume-pdf]', err?.message);
    res.status(500).json({ error: err?.message || 'PDF generation failed' });
  }
});

/* ---------------- NON-VIZ 2: Cover Letter Builder ---------------- */
function buildCoverLetterText(opts: {
  jobTitle: string;
  company: string;
  tone: string;
  highlights: string;
  applicantName: string;
}): string {
  const toneOpener: Record<string, string> = {
    formal: 'Dear Hiring Manager,',
    friendly: 'Hi there,',
    enthusiastic: 'Hello!',
    confident: 'To the hiring team,',
  };
  const opener = toneOpener[opts.tone] || toneOpener.formal;
  const closing = opts.tone === 'friendly' || opts.tone === 'enthusiastic' ? 'Thanks so much,' : 'Sincerely,';

  return [
    opener,
    '',
    `I'm excited to apply for the ${opts.jobTitle} role at ${opts.company}. The mission and product roadmap you describe align well with the kind of work I want to do next.`,
    '',
    `A few highlights I'd bring to your team:`,
    opts.highlights
      .split(/\n+/)
      .map((h) => h.trim())
      .filter(Boolean)
      .map((h) => `  • ${h}`)
      .join('\n'),
    '',
    `I'd love to dig into how I can help ${opts.company} ship faster and raise the bar on quality. I'm available to chat at your convenience.`,
    '',
    closing,
    opts.applicantName,
  ].join('\n');
}

router.post('/cover-letter', (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const jobTitle = body.jobTitle || 'Software Engineer';
    const company = body.company || 'Acme Co';
    const tone = body.tone || 'formal';
    const highlights = body.highlights || 'Shipped X. Led Y. Improved Z by N%.';
    const applicantName = body.applicantName || 'Jane Doe';
    const format = (body.format || req.query.format || 'json') as string;

    const text = buildCoverLetterText({ jobTitle, company, tone, highlights, applicantName });

    if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'LETTER', margin: 64 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="cover_letter_${company.replace(/\s+/g, '_')}.pdf"`
      );
      doc.pipe(res);
      doc.font('Helvetica-Bold').fontSize(14).text(`${applicantName}`);
      doc.font('Helvetica').fontSize(10).fillColor('#444').text(new Date().toDateString());
      doc.moveDown().fillColor('#000');
      doc.font('Helvetica').fontSize(11).text(text, { align: 'left', lineGap: 2 });
      doc.end();
      return;
    }

    res.json({
      feature: 'cover-letter-builder',
      jobTitle,
      company,
      tone,
      letter: text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    });
  } catch (err: any) {
    console.error('[customViews.cover-letter]', err?.message);
    res.status(500).json({ error: err?.message || 'cover letter failed' });
  }
});

export default router;
