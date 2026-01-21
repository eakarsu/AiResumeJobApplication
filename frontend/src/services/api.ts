import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  getMe: () =>
    api.get('/auth/me'),
  updateProfile: (data: any) =>
    api.put('/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword })
};

// Resumes API
export const resumesAPI = {
  getAll: () => api.get('/resumes'),
  getOne: (id: string) => api.get(`/resumes/${id}`),
  create: (data: any) => api.post('/resumes', data),
  update: (id: string, data: any) => api.put(`/resumes/${id}`, data),
  delete: (id: string) => api.delete(`/resumes/${id}`),
  generateSummary: (id: string, targetRole?: string) =>
    api.post(`/resumes/${id}/ai/summary`, { targetRole }),
  optimize: (id: string, jobDescription?: string) =>
    api.post(`/resumes/${id}/ai/optimize`, { jobDescription }),
  enhanceBullets: (id: string, bullets: string[], role: string, company: string) =>
    api.post(`/resumes/${id}/ai/enhance-bullets`, { bullets, role, company })
};

// Cover Letters API
export const coverLettersAPI = {
  getAll: () => api.get('/cover-letters'),
  getOne: (id: string) => api.get(`/cover-letters/${id}`),
  create: (data: any) => api.post('/cover-letters', data),
  update: (id: string, data: any) => api.put(`/cover-letters/${id}`, data),
  delete: (id: string) => api.delete(`/cover-letters/${id}`),
  generate: (data: { jobTitle: string; company: string; jobDescription?: string; resumeId?: string; tone?: string }) =>
    api.post('/cover-letters/ai/generate', data)
};

// Jobs API
export const jobsAPI = {
  getAll: (params?: any) => api.get('/jobs', { params }),
  getOne: (id: string) => api.get(`/jobs/${id}`),
  getSaved: () => api.get('/jobs/user/saved'),
  getRecommended: () => api.get('/jobs/user/recommended'),
  save: (id: string, notes?: string) => api.post(`/jobs/${id}/save`, { notes }),
  unsave: (id: string) => api.delete(`/jobs/${id}/save`),
  analyzeMatch: (jobId: string, resumeId: string) =>
    api.post(`/jobs/${jobId}/ai/match`, { resumeId })
};

// Applications API
export const applicationsAPI = {
  getAll: (params?: any) => api.get('/applications', { params }),
  getOne: (id: string) => api.get(`/applications/${id}`),
  create: (data: any) => api.post('/applications', data),
  update: (id: string, data: any) => api.put(`/applications/${id}`, data),
  delete: (id: string) => api.delete(`/applications/${id}`),
  getStats: () => api.get('/applications/stats/summary'),
  addTimeline: (id: string, data: { eventType: string; description?: string }) =>
    api.post(`/applications/${id}/timeline`, data)
};

// Interviews API
export const interviewsAPI = {
  getAll: (params?: any) => api.get('/interviews', { params }),
  getOne: (id: string) => api.get(`/interviews/${id}`),
  create: (data: any) => api.post('/interviews', data),
  update: (id: string, data: any) => api.put(`/interviews/${id}`, data),
  delete: (id: string) => api.delete(`/interviews/${id}`),
  generateQuestions: (id: string, data: any) =>
    api.post(`/interviews/${id}/ai/prep-questions`, data),
  evaluateAnswer: (question: string, answer: string, context?: string) =>
    api.post('/interviews/ai/evaluate-answer', { question, answer, context }),
  generateStandaloneQuestions: (data: any) =>
    api.post('/interviews/ai/generate-questions', data)
};

// Skills API
export const skillsAPI = {
  getAll: (params?: any) => api.get('/skills', { params }),
  getUserSkills: () => api.get('/skills/user'),
  addUserSkill: (data: any) => api.post('/skills/user', data),
  updateUserSkill: (skillId: string, data: any) => api.put(`/skills/user/${skillId}`, data),
  removeUserSkill: (skillId: string) => api.delete(`/skills/user/${skillId}`),
  getTrending: () => api.get('/skills/trending'),
  analyzeGap: (targetRole: string, industry?: string) =>
    api.post('/skills/ai/gap-analysis', { targetRole, industry })
};

// Salary API
export const salaryAPI = {
  getAll: (params?: any) => api.get('/salary', { params }),
  getOne: (id: string) => api.get(`/salary/${id}`),
  create: (data: any) => api.post('/salary', data),
  getUserSaved: () => api.get('/salary/user/saved'),
  delete: (id: string) => api.delete(`/salary/${id}`),
  getInsights: (data: any) => api.post('/salary/ai/insights', data),
  compare: (data: { jobTitle: string; locations: string[]; experienceLevel: string }) =>
    api.post('/salary/compare', data)
};

// Companies API
export const companiesAPI = {
  getAll: (params?: any) => api.get('/companies', { params }),
  getOne: (id: string) => api.get(`/companies/${id}`),
  create: (data: any) => api.post('/companies', data),
  update: (id: string, data: any) => api.put(`/companies/${id}`, data),
  delete: (id: string) => api.delete(`/companies/${id}`),
  toggleBookmark: (id: string) => api.post(`/companies/${id}/bookmark`),
  getBookmarked: () => api.get('/companies/user/bookmarked'),
  analyze: (companyName: string, role?: string) =>
    api.post('/companies/ai/analyze', { companyName, role })
};

// Network API
export const networkAPI = {
  getAll: (params?: any) => api.get('/network', { params }),
  getOne: (id: string) => api.get(`/network/${id}`),
  create: (data: any) => api.post('/network', data),
  update: (id: string, data: any) => api.put(`/network/${id}`, data),
  delete: (id: string) => api.delete(`/network/${id}`),
  addInteraction: (id: string, data: any) => api.post(`/network/${id}/interactions`, data),
  getFollowUpNeeded: () => api.get('/network/followup/needed'),
  getStats: () => api.get('/network/stats/summary'),
  generateMessage: (data: any) => api.post('/network/ai/message', data),
  generateFollowUp: (data: any) => api.post('/network/ai/follow-up', data)
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getApplicationTrends: (period?: number) =>
    api.get('/analytics/applications/trends', { params: { period } }),
  getResponseRate: () => api.get('/analytics/response-rate'),
  getSkillsAnalytics: () => api.get('/analytics/skills'),
  getActivity: (params?: any) => api.get('/analytics/activity', { params }),
  getWeeklySummary: () => api.get('/analytics/weekly-summary')
};

// AI API (general)
export const aiAPI = {
  chat: (messages: any[], options?: any) =>
    api.post('/ai/chat', { messages, ...options }),
  generateResumeSummary: (experience: any[], skills: string[], targetRole?: string) =>
    api.post('/ai/resume/summary', { experience, skills, targetRole }),
  optimizeResume: (resume: any, jobDescription?: string) =>
    api.post('/ai/resume/optimize', { resume, jobDescription }),
  enhanceBullets: (bullets: string[], role: string, company: string) =>
    api.post('/ai/resume/enhance-bullets', { bullets, role, company }),
  generateCoverLetter: (data: any) =>
    api.post('/ai/cover-letter/generate', data),
  analyzeJobMatch: (resume: any, job: any) =>
    api.post('/ai/job/match', { resume, job }),
  generateInterviewQuestions: (data: any) =>
    api.post('/ai/interview/questions', data),
  evaluateAnswer: (question: string, answer: string, context?: string) =>
    api.post('/ai/interview/evaluate', { question, answer, context }),
  analyzeSkillsGap: (currentSkills: string[], targetRole: string, industry?: string) =>
    api.post('/ai/skills/gap', { currentSkills, targetRole, industry }),
  getSalaryInsights: (data: any) =>
    api.post('/ai/salary/insights', data),
  analyzeCompany: (companyName: string, role?: string) =>
    api.post('/ai/company/analyze', { companyName, role }),
  generateNetworkingMessage: (data: any) =>
    api.post('/ai/networking/message', data),
  generateFollowUpEmail: (data: any) =>
    api.post('/ai/email/follow-up', data)
};

// Templates API
export const templatesAPI = {
  getResumeTemplates: (params?: any) => api.get('/templates/resumes', { params }),
  getTemplate: (id: string) => api.get(`/templates/resumes/${id}`),
  getPlans: () => api.get('/templates/plans')
};

export default api;
