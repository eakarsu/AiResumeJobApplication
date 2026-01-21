export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  avatarUrl?: string;
  isPremium: boolean;
  premiumTier?: string;
  createdAt: string;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications?: any[];
  languages?: any[];
  projects?: any[];
  templateId?: string;
  isAiGenerated: boolean;
  aiScore?: number;
  atsScore?: number;
  keywords: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface Education {
  school: string;
  degree: string;
  location: string;
  graduationDate: string;
}

export interface CoverLetter {
  id: string;
  userId: string;
  title: string;
  content: string;
  targetCompany?: string;
  targetPosition?: string;
  tone?: string;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  locationType: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  requirements: string[];
  benefits: string[];
  skills: string[];
  experienceLevel: string;
  industry?: string;
  postedDate: string;
  isSaved?: boolean;
}

export interface JobApplication {
  id: string;
  userId: string;
  jobId?: string;
  job?: Job;
  resumeId?: string;
  resume?: Resume;
  coverLetterId?: string;
  coverLetter?: CoverLetter;
  companyName: string;
  position: string;
  location?: string;
  salary?: string;
  status: string;
  applicationDate: string;
  responseDate?: string;
  notes?: string;
  contactPerson?: string;
  contactEmail?: string;
  nextAction?: string;
  nextActionDate?: string;
  priority: number;
  interviews?: Interview[];
  timeline?: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  eventDate: string;
  description?: string;
}

export interface Interview {
  id: string;
  userId: string;
  applicationId?: string;
  application?: JobApplication;
  companyName: string;
  position: string;
  interviewType: string;
  scheduledDate: string;
  duration?: number;
  interviewerName?: string;
  interviewerRole?: string;
  location?: string;
  meetingLink?: string;
  status: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  prepQuestions?: PrepQuestion[];
}

export interface PrepQuestion {
  id: string;
  category: string;
  question: string;
  suggestedAnswer?: string;
  tips?: string;
  difficulty: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  demandScore?: number;
}

export interface UserSkill {
  id: string;
  skillId: string;
  skill: Skill;
  proficiency: string;
  yearsExperience?: number;
}

export interface SalaryResearch {
  id: string;
  jobTitle: string;
  location: string;
  experienceLevel: string;
  industry?: string;
  company?: string;
  salaryMin: number;
  salaryMax: number;
  salaryMedian: number;
}

export interface CompanyResearch {
  id: string;
  companyName: string;
  industry?: string;
  size?: string;
  founded?: number;
  headquarters?: string;
  website?: string;
  glassdoorRating?: number;
  employeeCount?: string;
  description?: string;
  culture?: string;
  benefits: string[];
  techStack: string[];
  interviewProcess?: string;
  prosNotes?: string;
  consNotes?: string;
  isBookmarked: boolean;
}

export interface NetworkContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  linkedinUrl?: string;
  relationship?: string;
  notes?: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  tags: string[];
  interactions?: ContactInteraction[];
}

export interface ContactInteraction {
  id: string;
  type: string;
  date: string;
  notes?: string;
  outcome?: string;
}

export interface DashboardStats {
  overview: {
    totalApplications: number;
    recentApplications: number;
    upcomingInterviews: number;
    totalResumes: number;
    totalCoverLetters: number;
    totalContacts: number;
  };
  applicationsByStatus: Record<string, number>;
  recentActivity: any[];
}
