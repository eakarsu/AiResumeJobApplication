import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const AI_MODEL = process.env.OPENROUTER_MODEL || process.env.AI_MODEL || 'anthropic/claude-haiku-4.5';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = OPENROUTER_API_KEY || '';
    this.baseUrl = OPENROUTER_BASE_URL;
    this.model = AI_MODEL;
  }

  // Helper to clean JSON response from markdown code blocks
  private cleanJsonResponse(response: string): string {
    return response.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  }

  // Helper to safely parse JSON
  private safeParseJson<T>(response: string, fallback: T): T {
    try {
      const clean = this.cleanJsonResponse(response);
      return JSON.parse(clean);
    } catch (e) {
      console.error('JSON parse error:', e, 'Response:', response.slice(0, 200));
      return fallback;
    }
  }

  async chat(messages: ChatMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env file.');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Resume Job Application'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API Error:', response.status, error);
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as OpenRouterResponse;
    return data.choices[0]?.message?.content || '';
  }

  // Resume AI Features
  async generateResumeSummary(experience: any[], skills: string[], targetRole?: string): Promise<string> {
    const prompt = `Generate a professional resume summary based on the following information:

Experience: ${JSON.stringify(experience)}
Skills: ${skills.join(', ')}
${targetRole ? `Target Role: ${targetRole}` : ''}

Write a compelling 3-4 sentence professional summary that:
- Opens with a strong professional identity statement (e.g., "Results-driven software engineer with 8+ years...")
- Leads with the most impressive quantifiable achievements (revenue generated, efficiency gains, team sizes managed)
- Incorporates 3-5 of the most relevant skills naturally (not as a list)
- Uses powerful action verbs (spearheaded, orchestrated, transformed) — avoid weak verbs (assisted, helped, worked on)
- Avoids generic filler phrases like "team player", "hard worker", "passionate professional"
${targetRole ? `- Tailors language specifically toward the ${targetRole} role` : ''}

Return only the summary text — no headings, labels, or quotes.`;

    return this.chat([
      { role: 'system', content: 'You are a certified professional resume writer (CPRW) with 15+ years of experience crafting executive-level summaries. You write concise, achievement-focused summaries that pass ATS screening and capture hiring manager attention in under 10 seconds.' },
      { role: 'user', content: prompt }
    ]);
  }

  async optimizeResume(resume: any, jobDescription?: string): Promise<{ suggestions: string[]; score: number; keywords: string[] }> {
    const prompt = `Analyze this resume and provide optimization suggestions:

Resume: ${JSON.stringify(resume)}
${jobDescription ? `Target Job Description: ${jobDescription}` : ''}

Evaluate the resume across these criteria:
- **ATS Compatibility**: keyword density, standard section headings, parseable formatting
- **Impact & Metrics**: quantified achievements vs. vague responsibility statements
- **Relevance**: alignment of skills and experience with ${jobDescription ? 'the target job description' : 'common industry expectations'}
- **Structure**: logical ordering, appropriate length, consistent formatting

Provide your response as a JSON object with this exact schema:
{
  "suggestions": ["string1", "string2", ...],  // 5-10 specific, actionable improvement suggestions as plain strings (NOT objects)
  "score": number,                              // ATS compatibility score 0-100 based on: keyword match (40%), formatting (30%), content quality (30%)
  "keywords": ["keyword1", "keyword2", ...]     // 8-15 important keywords to add, as plain strings
}

IMPORTANT: Each item in "suggestions" and "keywords" must be a plain string, NOT an object.`;

    const response = await this.chat([
      { role: 'system', content: 'You are a senior ATS optimization expert and career coach who has reviewed 10,000+ resumes across all industries. You understand how Applicant Tracking Systems parse and rank resumes. Respond with raw JSON only. Do not wrap in markdown code fences, backticks, or any formatting.' },
      { role: 'user', content: prompt }
    ]);

    return this.safeParseJson(response, { suggestions: [response], score: 70, keywords: [] });
  }

  async enhanceExperienceBullets(bullets: string[], role: string, company: string): Promise<string[]> {
    const prompt = `Improve these resume bullet points for a ${role} position at ${company}:

Current bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Rewrite each bullet point using the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]"

For each bullet:
- Start with a unique, strong action verb (Led, Architected, Optimized, Spearheaded — never repeat the same verb)
- Add specific metrics where possible (%, $, time saved, users impacted). If no metric exists, infer a reasonable one
- Keep each bullet to 1-2 lines (under 150 characters)
- Include keywords relevant to ${role} roles

Return exactly ${bullets.length} improved bullets as a JSON array of plain strings.
Example: ["Spearheaded migration to microservices architecture, reducing deployment time by 40% and enabling 3x faster feature releases", "..."]

IMPORTANT: Return an array of strings, NOT an array of objects.`;

    const response = await this.chat([
      { role: 'system', content: 'You are an expert resume writer specializing in achievement-driven bullet points that pass ATS screening. Respond with raw JSON only. Do not wrap in markdown code fences, backticks, or any formatting.' },
      { role: 'user', content: prompt }
    ]);

    return this.safeParseJson(response, bullets);
  }

  // Cover Letter AI Features
  async generateCoverLetter(params: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    resume?: any;
    tone?: string;
  }): Promise<string> {
    const { jobTitle, company, jobDescription, resume, tone = 'professional' } = params;

    const prompt = `Write a compelling cover letter for the following position:

Position: ${jobTitle}
Company: ${company}
${jobDescription ? `Job Description: ${jobDescription}` : ''}
${resume ? `Candidate Background: ${JSON.stringify(resume)}` : ''}
Tone: ${tone}

Write a 300-400 word cover letter following this structure:

**Opening paragraph**: Skip generic openers like "I am writing to apply for..." — instead, lead with a specific achievement or insight that connects you to the role or company. Reference something specific about ${company} that genuinely excites you.

**Body paragraph(s)**: Use the CAR method (Challenge-Action-Result) to describe 2-3 relevant accomplishments from the candidate's background. Connect each directly to a requirement from the job description. Use specific numbers and outcomes.

**Closing paragraph**: End with a confident call to action — not "I hope to hear from you" but a forward-looking statement about contributing to the team. Include availability for next steps.

Format as a proper letter with:
- "Dear Hiring Manager," (or recipient name if known)
- Proper paragraph breaks
- Professional sign-off

Return only the cover letter text — no JSON, no extra commentary.`;

    return this.chat([
      { role: 'system', content: 'You are a senior career strategist who has written cover letters that helped candidates land roles at Fortune 500 companies. You write in a confident, authentic voice — never generic or formulaic. Every sentence earns its place.' },
      { role: 'user', content: prompt }
    ]);
  }

  // Job Matching AI Features
  async analyzeJobMatch(resume: any, job: any): Promise<{
    overallScore: number;
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    missingSkills: string[];
    matchingSkills: string[];
    reasoning: string;
  }> {
    const prompt = `Analyze how well this candidate matches the job:

Resume/Candidate:
${JSON.stringify(resume)}

Job Posting:
${JSON.stringify(job)}

Evaluate using this weighted scoring system:
- **Skills Match (40% of overall)**: Compare required/preferred skills in the job posting against candidate's listed skills and demonstrated technologies. Score 0-100.
- **Experience Match (35% of overall)**: Compare required years and type of experience. Consider title progression, company relevance, and domain expertise. Score 0-100.
- **Education Match (25% of overall)**: Compare required education, certifications, and training. Score 0-100.

Calculate overallScore as: (skillsMatch × 0.4) + (experienceMatch × 0.35) + (educationMatch × 0.25)

Return this exact JSON schema:
{
  "overallScore": number,       // weighted score 0-100
  "skillsMatch": number,        // 0-100
  "experienceMatch": number,    // 0-100
  "educationMatch": number,     // 0-100
  "missingSkills": ["string"],  // skills from job posting NOT found in resume — plain strings only
  "matchingSkills": ["string"], // skills that overlap — plain strings only
  "reasoning": "string"         // 2-3 sentence explanation of the match quality and biggest gaps
}

IMPORTANT: All array items ("missingSkills", "matchingSkills") must be plain strings, NOT objects.`;

    const response = await this.chat([
      { role: 'system', content: 'You are a senior technical recruiter with 15+ years of experience evaluating candidate-job fit across engineering, product, and design roles. You score objectively based on evidence in the resume, never inflating scores. Respond with raw JSON only. Do not wrap in markdown code fences, backticks, or any formatting.' },
      { role: 'user', content: prompt }
    ]);

    return this.safeParseJson(response, {
      overallScore: 50,
      skillsMatch: 50,
      experienceMatch: 50,
      educationMatch: 50,
      missingSkills: [],
      matchingSkills: [],
      reasoning: response
    });
  }

  // Interview Prep AI Features
  async generateInterviewQuestions(params: {
    jobTitle: string;
    company?: string;
    interviewType: string;
    skills?: string[];
    experienceLevel?: string;
    count?: number;
  }): Promise<Array<{ question: string; suggestedAnswer: string; tips: string; category: string; difficulty: string }>> {
    const { jobTitle, company, interviewType, skills, experienceLevel, count = 10 } = params;

    const typeInstructions: Record<string, string> = {
      technical: `Generate ONLY technical questions about coding, system design, algorithms, data structures, debugging, and technical problem-solving. DO NOT include behavioral questions like "tell me about yourself". Focus on: code implementation, technical concepts, architecture decisions, debugging scenarios, and technical trade-offs.`,
      behavioral: `Generate ONLY behavioral questions using the STAR method format. Focus on past experiences, teamwork, leadership, conflict resolution, and soft skills. Examples: "Tell me about a time when...", "Describe a situation where..."`,
      situational: `Generate ONLY situational/hypothetical questions. Focus on how candidates would handle hypothetical scenarios. Examples: "What would you do if...", "How would you handle..."`,
      general: `Generate a mix of behavioral, situational, and role-specific questions suitable for a general interview.`
    };

    const prompt = `Generate exactly ${count} ${interviewType.toUpperCase()} interview questions for:

Position: ${jobTitle}
${company ? `Company: ${company}` : ''}
Interview Type: ${interviewType}
${skills ? `Key Skills: ${skills.join(', ')}` : ''}
${experienceLevel ? `Experience Level: ${experienceLevel}` : ''}

IMPORTANT: ${typeInstructions[interviewType] || typeInstructions.general}

For each question, provide:
1. The question itself (matching the ${interviewType} type)
2. A suggested answer approach
3. Tips for answering well
4. Category (must be "${interviewType}" for all questions)
5. Difficulty (easy/medium/hard)

Return as a JSON array of objects with keys: question, suggestedAnswer, tips, category, difficulty`;

    const response = await this.chat([
      { role: 'system', content: 'You are an expert interview coach who has conducted thousands of mock interviews and helped candidates land roles at top companies. Respond with raw JSON only. Do not wrap in markdown code fences, backticks, or any formatting.' },
      { role: 'user', content: prompt }
    ]);

    const fallback = [{
      question: `What ${interviewType} challenges have you faced as a ${jobTitle}?`,
      suggestedAnswer: 'Describe specific examples from your experience...',
      tips: 'Use the STAR method for behavioral, show problem-solving for technical',
      category: interviewType,
      difficulty: 'medium'
    }];
    const parsed = this.safeParseJson(response, fallback);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  async evaluateInterviewAnswer(question: string, answer: string, context?: string): Promise<{
    score: number;
    feedback: string;
    improvements: string[];
  }> {
    const prompt = `Evaluate this interview answer:

Question: ${question}
${context ? `Context/Role: ${context}` : ''}

Candidate's Answer: ${answer}

Evaluate the answer across these 5 criteria (each contributes to the 1-10 score):
1. **Relevance**: Does it directly answer what was asked?
2. **Specificity**: Are there concrete examples, metrics, or details (not vague generalities)?
3. **Structure**: Is it well-organized (e.g., STAR method for behavioral, clear problem→solution→result)?
4. **Impact**: Does it demonstrate measurable outcomes or meaningful contributions?
5. **Communication**: Is it concise, clear, and confident — not rambling or hedging?

Return this exact JSON schema:
{
  "score": number,            // 1-10 overall score based on the 5 criteria
  "feedback": "string",       // 3-5 sentences of constructive feedback covering strengths and weaknesses
  "improvements": ["string"]  // 3-5 specific, actionable suggestions as plain strings (NOT objects)
}

IMPORTANT: Each item in "improvements" must be a plain string, NOT an object. Example: "Add a specific metric — instead of 'improved performance', say 'reduced load time by 35%'"`;

    const response = await this.chat([
      { role: 'system', content: 'You are a senior interview coach who has prepared candidates for FAANG, consulting, and Fortune 500 interviews. You give honest, constructive feedback — praising what works and clearly identifying what to improve. Respond with raw JSON only. Do not wrap in markdown code fences, backticks, or any formatting.' },
      { role: 'user', content: prompt }
    ]);

    return this.safeParseJson(response, { score: 5, feedback: response, improvements: [] });
  }

  // Skills Analysis AI Features
  async analyzeSkillsGap(currentSkills: string[], targetRole: string, industry?: string): Promise<{
    missingSkills: string[];
    learningPath: string[];
    resources: string[];
    timeline: string;
  }> {
    const prompt = `Analyze skills gap for career transition:

Current Skills: ${currentSkills.join(', ')}
Target Role: ${targetRole}
${industry ? `Industry: ${industry}` : ''}

Analyze the gap between the candidate's current skills and what's required for the ${targetRole} role${industry ? ` in the ${industry} industry` : ''}. Consider both technical and soft skills.

Return this exact JSON schema:
{
  "missingSkills": ["string"],   // 5-10 specific skills missing, ordered by importance (most critical first), as plain strings
  "learningPath": ["string"],    // 5-8 sequential learning steps — each should be a concrete action (e.g., "Complete AWS Solutions Architect certification"), as plain strings
  "resources": ["string"],       // 5-8 specific resources — include actual course names, book titles, or platform names (e.g., "Coursera: Machine Learning by Andrew Ng"), as plain strings
  "timeline": "string"           // Realistic estimated timeline (e.g., "3-6 months with 10 hours/week of dedicated study")
}

IMPORTANT: All array items must be plain strings, NOT objects. Order missingSkills by priority — most critical for the role first.`;

    const response = await this.chat([
      { role: 'system', content: 'You are a career development strategist and skills assessment expert who has guided hundreds of professionals through career transitions. You provide actionable, realistic advice based on current industry demands. Respond with raw JSON only. Do not wrap in markdown code fences, backticks, or any formatting.' },
      { role: 'user', content: prompt }
    ]);

    return this.safeParseJson(response, { missingSkills: [], learningPath: [], resources: [], timeline: 'Varies' });
  }

  // Salary Negotiation AI Features
  async getSalaryInsights(params: {
    jobTitle: string;
    location: string;
    experienceLevel: string;
    skills?: string[];
    industry?: string;
  }): Promise<{
    salaryRange: { min: number; max: number; median: number };
    factors: string[];
    negotiationTips: string[];
  }> {
    const prompt = `Provide salary insights for:

Position: ${params.jobTitle}
Location: ${params.location}
Experience Level: ${params.experienceLevel}
${params.skills ? `Skills: ${params.skills.join(', ')}` : ''}
${params.industry ? `Industry: ${params.industry}` : ''}

Provide salary data that reflects realistic 2024-2025 USD market rates for ${params.location}. Account for cost of living differences — e.g., San Francisco salaries are ~30% higher than national average, while remote roles typically pay 10-20% less than top metro areas.

Return this exact JSON schema:
{
  "salaryRange": {
    "min": number,     // realistic low end in USD (annual, no decimals)
    "max": number,     // realistic high end in USD (annual, no decimals)
    "median": number   // realistic median in USD (annual, no decimals)
  },
  "factors": ["string"],          // 5-8 factors that influence salary for this specific role/location as plain strings
  "negotiationTips": ["string"]   // 5-8 actionable negotiation tips as plain strings — be specific (e.g., "Ask for the salary band range before sharing your expectations")
}

IMPORTANT:
- All salary values must be realistic numbers (not strings), with no dollar signs or commas
- All array items in "factors" and "negotiationTips" must be plain strings, NOT objects
- Base your figures on what companies actually pay, not aspirational numbers`;

    const response = await this.chat([
      { role: 'system', content: 'You are a compensation analyst and salary negotiation expert with access to market data from Levels.fyi, Glassdoor, and Payscale. You provide realistic, data-grounded salary ranges — never inflated or deflated. Respond with raw JSON only. Do not wrap in markdown code fences, backticks, or any formatting.' },
      { role: 'user', content: prompt }
    ]);

    return this.safeParseJson(response, {
      salaryRange: { min: 50000, max: 100000, median: 75000 },
      factors: [],
      negotiationTips: []
    });
  }

  // Company Research AI Features
  async analyzeCompany(companyName: string, role?: string): Promise<{
    overview: string;
    culture: string;
    interviewTips: string[];
    questionsToAsk: string[];
    prosAndCons: { pros: string[]; cons: string[] };
  }> {
    const prompt = `Provide insights about ${companyName}${role ? ` for a ${role} position` : ''}:

Research and analyze ${companyName} from a job-seeker's perspective${role ? `, specifically for someone interviewing for a ${role} role` : ''}. Be balanced and honest — include both positives and genuine concerns.

Return this exact JSON schema:
{
  "overview": "string",            // 3-4 sentence company overview: what they do, size, stage, key products/services
  "culture": "string",             // 3-4 sentences about work culture, values, work-life balance, management style — be specific to this company, not generic
  "interviewTips": ["string"],     // 5-8 company-specific interview tips as plain strings (e.g., "${companyName} is known for X-style interviews, prepare for Y")
  "questionsToAsk": ["string"],    // 5-8 thoughtful questions to ask the interviewer, specific to ${companyName} — as plain strings
  "prosAndCons": {
    "pros": ["string"],            // 4-6 genuine pros as plain strings
    "cons": ["string"]             // 3-5 honest cons as plain strings — don't sugarcoat
  }
}

IMPORTANT: All array items must be plain strings, NOT objects. Be specific to ${companyName} — avoid generic advice that applies to any company.`;

    const response = await this.chat([
      { role: 'system', content: 'You are a career research analyst who has reviewed thousands of company profiles, Glassdoor reviews, and interview experiences. You provide balanced, honest assessments — never purely positive. You tailor advice to the specific company, not generic platitudes. Respond with raw JSON only. Do not wrap in markdown code fences, backticks, or any formatting.' },
      { role: 'user', content: prompt }
    ]);

    return this.safeParseJson(response, {
      overview: response,
      culture: '',
      interviewTips: [],
      questionsToAsk: [],
      prosAndCons: { pros: [], cons: [] }
    });
  }

  // Email/Message Generation
  async generateFollowUpEmail(params: {
    context: string;
    recipientName?: string;
    recipientRole?: string;
    tone?: string;
  }): Promise<string> {
    const prompt = `Write a professional follow-up email:

Context: ${params.context}
${params.recipientName ? `Recipient: ${params.recipientName}` : ''}
${params.recipientRole ? `Recipient Role: ${params.recipientRole}` : ''}
Tone: ${params.tone || 'professional'}

Write a 150-200 word follow-up email that:
- Starts with a clear, specific subject line on its own line (e.g., "Subject: Following up on our [Role] conversation")
- Opens by referencing a specific detail from the interaction (not just "Thank you for your time")
- Includes one brief, relevant point that reinforces your fit (a skill discussed, a project mentioned)
- Ends with a clear, low-pressure next step (not "I hope to hear from you")
- Uses ${params.tone || 'professional'} tone throughout

Format:
Subject: [specific subject line]

[Email body with proper greeting and sign-off]

Return only the email text — no JSON, no extra commentary.`;

    return this.chat([
      { role: 'system', content: 'You are a professional communication expert who writes follow-up emails that get responses. You avoid generic templates and always reference specific details to stand out. Every word earns its place — no fluff.' },
      { role: 'user', content: prompt }
    ]);
  }

  async generateNetworkingMessage(params: {
    purpose: string;
    recipientInfo: string;
    yourBackground?: string;
    platform?: string;
  }): Promise<string> {
    const prompt = `Write a networking message:

Purpose: ${params.purpose}
Recipient: ${params.recipientInfo}
${params.yourBackground ? `Your Background: ${params.yourBackground}` : ''}
Platform: ${params.platform || 'LinkedIn'}

Write a ${params.platform === 'LinkedIn' || !params.platform ? '50-150 word (LinkedIn connection messages have character limits)' : '100-200 word'} networking message that:
- Opens with something specific about the recipient (their work, a shared connection, their content) — NOT "I came across your profile"
- Clearly states why you're reaching out in 1-2 sentences
- Offers value first before asking for anything (e.g., share a relevant insight, compliment specific work)
- Ends with a low-commitment ask (e.g., "Would you be open to a 15-minute chat?" not "Can you refer me?")
- Matches the ${params.platform || 'LinkedIn'} platform's communication style and norms

Return only the message text — no JSON, no subject line (unless email), no extra commentary.`;

    return this.chat([
      { role: 'system', content: 'You are a networking strategist who has helped professionals build meaningful connections. You write messages that feel genuine and personal — never templated or salesy. You understand that the best networking messages offer value before asking for anything.' },
      { role: 'user', content: prompt }
    ]);
  }
}

export const openRouterService = new OpenRouterService();
