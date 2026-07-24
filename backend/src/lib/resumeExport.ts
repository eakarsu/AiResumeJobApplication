import puppeteer from 'puppeteer';

interface Experience {
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  bullets?: string[];
  description?: string;
}

interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
}

interface Certification {
  name?: string;
  issuer?: string;
  date?: string;
}

interface Project {
  name?: string;
  description?: string;
  technologies?: string[];
  url?: string;
}

export interface ResumeData {
  id: string;
  title: string;
  summary?: string | null;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications?: Certification[] | null;
  languages?: string[] | null;
  projects?: Project[] | null;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    location?: string | null;
    linkedinUrl?: string | null;
    portfolioUrl?: string | null;
  };
}

function buildHtml(resume: ResumeData): string {
  const user = resume.user || {};
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || resume.title;

  const contactParts: string[] = [];
  if (user.email) contactParts.push(user.email);
  if (user.phone) contactParts.push(user.phone);
  if (user.location) contactParts.push(user.location);
  if (user.linkedinUrl) contactParts.push(user.linkedinUrl);
  if (user.portfolioUrl) contactParts.push(user.portfolioUrl);

  const experience = (resume.experience || []) as Experience[];
  const education = (resume.education || []) as Education[];
  const certifications = (resume.certifications || []) as Certification[];
  const projects = (resume.projects || []) as Project[];
  const languages = (resume.languages || []) as string[];

  const expHtml = experience.map(exp => {
    const bullets = exp.bullets && exp.bullets.length > 0
      ? exp.bullets
      : exp.description
        ? [exp.description]
        : [];

    return `
      <div class="section-item">
        <div class="item-header">
          <span class="item-title">${exp.title || ''}</span>
          <span class="item-date">${exp.startDate || ''} – ${exp.endDate || 'Present'}</span>
        </div>
        <div class="item-subtitle">${exp.company || ''}${exp.location ? ' · ' + exp.location : ''}</div>
        ${bullets.length > 0 ? `<ul>${bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
      </div>
    `;
  }).join('');

  const eduHtml = education.map(edu => `
    <div class="section-item">
      <div class="item-header">
        <span class="item-title">${edu.degree || ''}${edu.field ? ' in ' + edu.field : ''}</span>
        <span class="item-date">${edu.startDate || ''} – ${edu.endDate || ''}</span>
      </div>
      <div class="item-subtitle">${edu.institution || ''}${edu.gpa ? ' · GPA: ' + edu.gpa : ''}</div>
    </div>
  `).join('');

  const skillsHtml = resume.skills.length > 0
    ? `<div class="skills-list">${resume.skills.join(' · ')}</div>`
    : '';

  const certsHtml = certifications.length > 0
    ? certifications.map(c => `
        <div class="section-item">
          <div class="item-header">
            <span class="item-title">${c.name || ''}</span>
            <span class="item-date">${c.date || ''}</span>
          </div>
          ${c.issuer ? `<div class="item-subtitle">${c.issuer}</div>` : ''}
        </div>
      `).join('')
    : '';

  const projectsHtml = projects.length > 0
    ? projects.map(p => `
        <div class="section-item">
          <div class="item-header">
            <span class="item-title">${p.name || ''}</span>
            ${p.url ? `<a href="${p.url}" class="item-date">${p.url}</a>` : ''}
          </div>
          ${p.description ? `<div class="item-subtitle">${p.description}</div>` : ''}
          ${p.technologies && p.technologies.length > 0 ? `<div class="skills-list">${p.technologies.join(' · ')}</div>` : ''}
        </div>
      `).join('')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullName} – Resume</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; font-size: 11px; color: #222; line-height: 1.45; padding: 40px; }
    h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; letter-spacing: 0.5px; }
    .contact { color: #555; font-size: 10px; margin-top: 4px; }
    .contact span { margin-right: 12px; }
    hr { border: none; border-top: 2px solid #1a1a2e; margin: 12px 0 8px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1a1a2e; margin-bottom: 6px; }
    .section { margin-bottom: 14px; }
    .section-item { margin-bottom: 8px; }
    .item-header { display: flex; justify-content: space-between; }
    .item-title { font-weight: 700; font-size: 11px; }
    .item-date { font-size: 10px; color: #666; }
    .item-subtitle { color: #555; font-size: 10px; margin: 1px 0 3px; }
    ul { margin-left: 16px; margin-top: 3px; }
    li { margin-bottom: 2px; font-size: 10.5px; }
    .skills-list { color: #333; font-size: 10.5px; }
    .summary { font-size: 10.5px; color: #333; line-height: 1.55; }
    a { color: #1a1a2e; text-decoration: none; }
  </style>
</head>
<body>
  <h1>${fullName}</h1>
  ${contactParts.length > 0 ? `<div class="contact">${contactParts.map(p => `<span>${p}</span>`).join('')}</div>` : ''}
  <hr>

  ${resume.summary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div class="summary">${resume.summary}</div>
  </div>
  <hr>` : ''}

  ${experience.length > 0 ? `
  <div class="section">
    <div class="section-title">Experience</div>
    ${expHtml}
  </div>
  <hr>` : ''}

  ${resume.skills.length > 0 ? `
  <div class="section">
    <div class="section-title">Skills</div>
    ${skillsHtml}
  </div>
  <hr>` : ''}

  ${education.length > 0 ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${eduHtml}
  </div>` : ''}

  ${certifications.length > 0 ? `
  <hr>
  <div class="section">
    <div class="section-title">Certifications</div>
    ${certsHtml}
  </div>` : ''}

  ${projects.length > 0 ? `
  <hr>
  <div class="section">
    <div class="section-title">Projects</div>
    ${projectsHtml}
  </div>` : ''}

  ${languages.length > 0 ? `
  <hr>
  <div class="section">
    <div class="section-title">Languages</div>
    <div class="skills-list">${languages.join(' · ')}</div>
  </div>` : ''}
</body>
</html>`;
}

export async function exportResumePdf(resume: ResumeData): Promise<Buffer> {
  const html = buildHtml(resume);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export function exportResumeTxt(resume: ResumeData): string {
  const user = resume.user || {};
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || resume.title;

  const lines: string[] = [];
  const sep = '='.repeat(60);
  const dash = '-'.repeat(40);

  lines.push(fullName.toUpperCase());

  const contactParts: string[] = [];
  if (user.email) contactParts.push(user.email);
  if (user.phone) contactParts.push(user.phone);
  if (user.location) contactParts.push(user.location);
  if (user.linkedinUrl) contactParts.push(user.linkedinUrl);
  if (user.portfolioUrl) contactParts.push(user.portfolioUrl);
  if (contactParts.length > 0) lines.push(contactParts.join(' | '));

  lines.push(sep);

  if (resume.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(dash);
    lines.push(resume.summary);
    lines.push('');
  }

  const experience = (resume.experience || []) as Experience[];
  if (experience.length > 0) {
    lines.push('EXPERIENCE');
    lines.push(dash);
    for (const exp of experience) {
      lines.push(`${exp.title || ''} | ${exp.company || ''}${exp.location ? ' | ' + exp.location : ''}`);
      lines.push(`${exp.startDate || ''} - ${exp.endDate || 'Present'}`);
      const bullets = exp.bullets && exp.bullets.length > 0 ? exp.bullets : exp.description ? [exp.description] : [];
      for (const b of bullets) {
        lines.push(`  * ${b}`);
      }
      lines.push('');
    }
  }

  if (resume.skills.length > 0) {
    lines.push('SKILLS');
    lines.push(dash);
    lines.push(resume.skills.join(', '));
    lines.push('');
  }

  const education = (resume.education || []) as Education[];
  if (education.length > 0) {
    lines.push('EDUCATION');
    lines.push(dash);
    for (const edu of education) {
      const degreeStr = [edu.degree, edu.field].filter(Boolean).join(' in ');
      lines.push(`${degreeStr} | ${edu.institution || ''}`);
      lines.push(`${edu.startDate || ''} - ${edu.endDate || ''}`);
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
      lines.push('');
    }
  }

  const certifications = (resume.certifications || []) as Certification[];
  if (certifications.length > 0) {
    lines.push('CERTIFICATIONS');
    lines.push(dash);
    for (const cert of certifications) {
      lines.push(`${cert.name || ''}${cert.issuer ? ' | ' + cert.issuer : ''}${cert.date ? ' | ' + cert.date : ''}`);
    }
    lines.push('');
  }

  const projects = (resume.projects || []) as Project[];
  if (projects.length > 0) {
    lines.push('PROJECTS');
    lines.push(dash);
    for (const proj of projects) {
      lines.push(`${proj.name || ''}${proj.url ? ' | ' + proj.url : ''}`);
      if (proj.description) lines.push(`  ${proj.description}`);
      if (proj.technologies && proj.technologies.length > 0) {
        lines.push(`  Technologies: ${proj.technologies.join(', ')}`);
      }
      lines.push('');
    }
  }

  const languages = (resume.languages || []) as string[];
  if (languages.length > 0) {
    lines.push('LANGUAGES');
    lines.push(dash);
    lines.push(languages.join(', '));
    lines.push('');
  }

  return lines.join('\n');
}
