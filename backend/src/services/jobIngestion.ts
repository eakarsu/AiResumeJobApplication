import prisma from './prisma';

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const ADZUNA_COUNTRY = process.env.ADZUNA_COUNTRY || 'us';
const ADZUNA_BASE_URL = `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search`;

// ─── Adzuna API types ─────────────────────────────────────────────────────────

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string; area?: string[] };
  description: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: '0' | '1';
  contract_time?: string;       // 'full_time' | 'part_time'
  contract_type?: string;       // 'permanent' | 'contract'
  category?: { label: string };
  redirect_url: string;
  created: string;              // ISO date string
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

function normalizeAdzunaJob(raw: AdzunaJob) {
  // Employment type
  let employmentType = 'full-time';
  if (raw.contract_time === 'part_time') employmentType = 'part-time';
  else if (raw.contract_type === 'contract') employmentType = 'contract';

  // Experience level heuristic from title
  const titleLower = (raw.title || '').toLowerCase();
  let experienceLevel = 'mid';
  if (/\b(intern|internship|entry|junior|jr\.?|associate)\b/.test(titleLower)) experienceLevel = 'entry';
  else if (/\b(senior|sr\.?|principal|staff|lead)\b/.test(titleLower)) experienceLevel = 'senior';
  else if (/\b(director|vp|vice president|head of|chief)\b/.test(titleLower)) experienceLevel = 'executive';
  else if (/\b(lead|manager|manager)\b/.test(titleLower)) experienceLevel = 'lead';

  // Location type heuristic
  const locationLower = (raw.location?.display_name || '').toLowerCase();
  let locationType = 'onsite';
  if (locationLower.includes('remote')) locationType = 'remote';
  else if (locationLower.includes('hybrid')) locationType = 'hybrid';

  return {
    externalId: `adzuna_${raw.id}`,
    title: raw.title || 'Untitled',
    company: raw.company?.display_name || 'Unknown',
    location: raw.location?.display_name || 'Unknown',
    locationType,
    employmentType,
    salaryMin: raw.salary_min ? Math.round(raw.salary_min) : null,
    salaryMax: raw.salary_max ? Math.round(raw.salary_max) : null,
    salaryCurrency: 'USD',
    description: raw.description || '',
    requirements: [] as string[],
    benefits: [] as string[],
    skills: [] as string[],
    experienceLevel,
    industry: raw.category?.label || null,
    department: null as string | null,
    applicationUrl: raw.redirect_url || null,
    source: 'adzuna',
    postedDate: raw.created ? new Date(raw.created) : new Date(),
    isActive: true
  };
}

// ─── Fetch from Adzuna ────────────────────────────────────────────────────────

export async function fetchJobsFromAdzuna(
  query: string,
  location: string,
  page = 1,
  resultsPerPage = 20
): Promise<ReturnType<typeof normalizeAdzunaJob>[]> {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    throw new Error('ADZUNA_APP_ID and ADZUNA_APP_KEY env vars are required for job ingestion.');
  }

  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    what: query,
    where: location,
    results_per_page: String(resultsPerPage),
    content_type: 'application/json',
    'content-type': 'application/json'
  });

  const url = `${ADZUNA_BASE_URL}/${page}?${params.toString()}`;

  const resp = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Adzuna API error: ${resp.status} – ${body}`);
  }

  const data = await resp.json() as AdzunaResponse;
  return (data.results || []).map(normalizeAdzunaJob);
}

// ─── Upsert into DB ───────────────────────────────────────────────────────────

export async function ingestJobs(
  query: string,
  location: string,
  pages = 1
): Promise<{ ingested: number; skipped: number }> {
  let ingested = 0;
  let skipped = 0;

  for (let page = 1; page <= pages; page++) {
    const jobs = await fetchJobsFromAdzuna(query, location, page);

    for (const job of jobs) {
      const { externalId, ...jobData } = job;

      // Check if this external job already exists
      const existing = await prisma.job.findFirst({
        where: { source: 'adzuna', applicationUrl: job.applicationUrl || undefined }
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.job.create({
        data: {
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          locationType: jobData.locationType,
          employmentType: jobData.employmentType,
          salaryMin: jobData.salaryMin,
          salaryMax: jobData.salaryMax,
          salaryCurrency: jobData.salaryCurrency,
          description: jobData.description,
          requirements: jobData.requirements,
          benefits: jobData.benefits,
          skills: jobData.skills,
          experienceLevel: jobData.experienceLevel,
          industry: jobData.industry,
          department: jobData.department,
          applicationUrl: jobData.applicationUrl,
          source: jobData.source,
          postedDate: jobData.postedDate,
          isActive: jobData.isActive
        }
      });
      ingested++;
    }
  }

  return { ingested, skipped };
}
