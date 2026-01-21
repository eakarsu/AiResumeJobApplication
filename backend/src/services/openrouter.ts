import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const AI_MODEL = process.env.AI_MODEL || 'anthropic/claude-3-haiku';

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
    let clean = response.trim();
    if (clean.startsWith('```json')) {
      clean = clean.slice(7);
    } else if (clean.startsWith('```')) {
      clean = clean.slice(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.slice(0, -3);
    }
    return clean.trim();
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
        max_tokens: options?.maxTokens ?? 2000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API Error:', response.status, error);
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  // Resume AI Features
  async generateResumeSummary(experience: any[], skills: string[], targetRole?: string): Promise<string> {
    const prompt = `Generate a professional resume summary based on the following information:

Experience: ${JSON.stringify(experience)}
Skills: ${skills.join(', ')}
${targetRole ? `Target Role: ${targetRole}` : ''}

Write a compelling 3-4 sentence professional summary that highlights key achievements and qualifications. Be specific and use action words.`;

    return this.chat([
      { role: 'system', content: 'You are an expert resume writer with years of experience helping professionals land their dream jobs.' },
      { role: 'user', content: prompt }
    ]);
  }

  async optimizeResume(resume: any, jobDescription?: string): Promise<{ suggestions: string[]; score: number; keywords: string[] }> {
    const prompt = `Analyze this resume and provide optimization suggestions:

Resume: ${JSON.stringify(resume)}
${jobDescription ? `Target Job Description: ${jobDescription}` : ''}

Provide your response in JSON format with:
1. "suggestions": array of specific improvement suggestions
2. "score": ATS compatibility score from 0-100
3. "keywords": array of important keywords to include

Return only valid JSON.`;

    const response = await this.chat([
      { role: 'system', content: 'You are an ATS optimization expert and career coach. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    return this.safeParseJson(response, { suggestions: [response], score: 70, keywords: [] });
  }

  async enhanceExperienceBullets(bullets: string[], role: string, company: string): Promise<string[]> {
    const prompt = `Improve these resume bullet points for a ${role} position at ${company}:

Current bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Rewrite each bullet point to:
- Start with a strong action verb
- Include quantifiable achievements where possible
- Be concise but impactful
- Use industry-relevant keywords

Return the improved bullets as a JSON array of strings.`;

    const response = await this.chat([
      { role: 'system', content: 'You are an expert resume writer. Always respond with a valid JSON array of strings.' },
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

Create a personalized, engaging cover letter that:
- Opens with a strong hook
- Highlights relevant experience and achievements
- Shows enthusiasm for the company and role
- Ends with a clear call to action

Write the complete cover letter.`;

    return this.chat([
      { role: 'system', content: 'You are an expert career coach who writes compelling cover letters that help candidates stand out.' },
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

Provide a detailed match analysis in JSON format:
{
  "overallScore": number (0-100),
  "skillsMatch": number (0-100),
  "experienceMatch": number (0-100),
  "educationMatch": number (0-100),
  "missingSkills": ["skill1", "skill2"],
  "matchingSkills": ["skill1", "skill2"],
  "reasoning": "detailed explanation"
}

Return only valid JSON.`;

    const response = await this.chat([
      { role: 'system', content: 'You are a recruiting expert who analyzes candidate-job fit. Always respond with valid JSON.' },
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
      { role: 'system', content: 'You are an expert interview coach who has helped thousands of candidates prepare. Always respond with valid JSON only - no markdown, no code blocks, just the raw JSON array.' },
      { role: 'user', content: prompt }
    ], { maxTokens: 4000 });

    try {
      // Clean response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.slice(7);
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.slice(3);
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.slice(0, -3);
      }
      cleanResponse = cleanResponse.trim();

      const parsed = JSON.parse(cleanResponse);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.error('Failed to parse interview questions response:', e, 'Response:', response.slice(0, 200));
      return [{
        question: `What ${interviewType} challenges have you faced as a ${jobTitle}?`,
        suggestedAnswer: 'Describe specific examples from your experience...',
        tips: 'Use the STAR method for behavioral, show problem-solving for technical',
        category: interviewType,
        difficulty: 'medium'
      }];
    }
  }

  async evaluateInterviewAnswer(question: string, answer: string, context?: string): Promise<{
    score: number;
    feedback: string;
    improvements: string[];
  }> {
    const prompt = `Evaluate this interview answer:

Question: ${question}
${context ? `Context: ${context}` : ''}

Candidate's Answer: ${answer}

Provide evaluation in JSON format:
{
  "score": number (1-10),
  "feedback": "detailed feedback",
  "improvements": ["suggestion1", "suggestion2"]
}`;

    const response = await this.chat([
      { role: 'system', content: 'You are an interview coach providing constructive feedback. Always respond with valid JSON.' },
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

Provide analysis in JSON format:
{
  "missingSkills": ["skill1", "skill2"],
  "learningPath": ["step1", "step2"],
  "resources": ["resource1", "resource2"],
  "timeline": "estimated timeline to acquire skills"
}`;

    const response = await this.chat([
      { role: 'system', content: 'You are a career development expert. Always respond with valid JSON.' },
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

Provide insights in JSON format:
{
  "salaryRange": { "min": number, "max": number, "median": number },
  "factors": ["factor affecting salary 1", "factor 2"],
  "negotiationTips": ["tip1", "tip2"]
}

Use realistic USD salary figures.`;

    const response = await this.chat([
      { role: 'system', content: 'You are a compensation expert with knowledge of market salary data. Always respond with valid JSON.' },
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

Generate analysis in JSON format:
{
  "overview": "company overview",
  "culture": "company culture description",
  "interviewTips": ["tip1", "tip2"],
  "questionsToAsk": ["question1", "question2"],
  "prosAndCons": { "pros": ["pro1"], "cons": ["con1"] }
}`;

    const response = await this.chat([
      { role: 'system', content: 'You are a career research expert with extensive knowledge about companies. Always respond with valid JSON.' },
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

Write a concise, effective follow-up email.`;

    return this.chat([
      { role: 'system', content: 'You are an expert at professional communication.' },
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

Write a personalized, non-generic networking message that's likely to get a response.`;

    return this.chat([
      { role: 'system', content: 'You are an expert at professional networking and communication.' },
      { role: 'user', content: prompt }
    ]);
  }
}

export const openRouterService = new OpenRouterService();
