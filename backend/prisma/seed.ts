import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.applicationTimeline.deleteMany();
  await prisma.contactInteraction.deleteMany();
  await prisma.interviewPrepQuestion.deleteMany();
  await prisma.jobMatchScore.deleteMany();
  await prisma.savedJob.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.coverLetter.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.networkContact.deleteMany();
  await prisma.companyResearch.deleteMany();
  await prisma.salaryResearch.deleteMany();
  await prisma.job.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.resumeTemplate.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  console.log('👤 Creating demo user...');
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/johnsmith',
      portfolioUrl: 'https://johnsmith.dev',
      isPremium: true,
      premiumTier: 'pro'
    }
  });

  // Create Skills (20 skills)
  console.log('🎯 Creating skills...');
  const skillsData = [
    { name: 'JavaScript', category: 'technical', demandScore: 95 },
    { name: 'TypeScript', category: 'technical', demandScore: 92 },
    { name: 'React', category: 'technical', demandScore: 94 },
    { name: 'Node.js', category: 'technical', demandScore: 90 },
    { name: 'Python', category: 'technical', demandScore: 96 },
    { name: 'SQL', category: 'technical', demandScore: 88 },
    { name: 'AWS', category: 'technical', demandScore: 91 },
    { name: 'Docker', category: 'tool', demandScore: 87 },
    { name: 'Kubernetes', category: 'tool', demandScore: 85 },
    { name: 'Git', category: 'tool', demandScore: 93 },
    { name: 'Agile', category: 'soft', demandScore: 82 },
    { name: 'Communication', category: 'soft', demandScore: 89 },
    { name: 'Leadership', category: 'soft', demandScore: 86 },
    { name: 'Problem Solving', category: 'soft', demandScore: 91 },
    { name: 'Project Management', category: 'soft', demandScore: 84 },
    { name: 'GraphQL', category: 'technical', demandScore: 78 },
    { name: 'MongoDB', category: 'technical', demandScore: 80 },
    { name: 'PostgreSQL', category: 'technical', demandScore: 83 },
    { name: 'CI/CD', category: 'tool', demandScore: 86 },
    { name: 'Machine Learning', category: 'technical', demandScore: 88 }
  ];

  const skills = await Promise.all(
    skillsData.map(s => prisma.skill.create({ data: s }))
  );

  // Add user skills
  console.log('📚 Adding user skills...');
  await Promise.all([
    prisma.userSkill.create({ data: { userId: user.id, skillId: skills[0].id, proficiency: 'expert', yearsExperience: 6 } }),
    prisma.userSkill.create({ data: { userId: user.id, skillId: skills[1].id, proficiency: 'advanced', yearsExperience: 4 } }),
    prisma.userSkill.create({ data: { userId: user.id, skillId: skills[2].id, proficiency: 'expert', yearsExperience: 5 } }),
    prisma.userSkill.create({ data: { userId: user.id, skillId: skills[3].id, proficiency: 'advanced', yearsExperience: 4 } }),
    prisma.userSkill.create({ data: { userId: user.id, skillId: skills[4].id, proficiency: 'intermediate', yearsExperience: 2 } }),
    prisma.userSkill.create({ data: { userId: user.id, skillId: skills[9].id, proficiency: 'expert', yearsExperience: 7 } }),
  ]);

  // Create Jobs (20 jobs)
  console.log('💼 Creating jobs...');
  const jobsData = [
    {
      title: 'Senior Frontend Developer',
      company: 'Google',
      companyLogo: 'https://ui-avatars.com/api/?name=Google&background=4285F4&color=fff&size=128&bold=true',
      location: 'Mountain View, CA',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 180000,
      salaryMax: 250000,
      description: 'Join our team to build next-generation web applications using React and TypeScript. You will work on products used by billions of users worldwide.',
      requirements: ['5+ years React experience', 'Strong TypeScript skills', 'Experience with large-scale applications'],
      benefits: ['Health insurance', '401k matching', 'Unlimited PTO', 'Free meals'],
      skills: ['React', 'TypeScript', 'JavaScript', 'GraphQL'],
      experienceLevel: 'senior',
      industry: 'Technology',
      department: 'Engineering'
    },
    {
      title: 'Full Stack Engineer',
      company: 'Meta',
      companyLogo: 'https://ui-avatars.com/api/?name=Meta&background=0668E1&color=fff&size=128&bold=true',
      location: 'Menlo Park, CA',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 170000,
      salaryMax: 240000,
      description: 'Build features for Facebook, Instagram, and WhatsApp serving billions of users. Work with cutting-edge technology and talented engineers.',
      requirements: ['4+ years full stack experience', 'React and Node.js', 'Distributed systems knowledge'],
      benefits: ['Health insurance', 'RSU', 'Parental leave', 'Wellness programs'],
      skills: ['React', 'Node.js', 'GraphQL', 'Python'],
      experienceLevel: 'senior',
      industry: 'Technology',
      department: 'Engineering'
    },
    {
      title: 'Software Engineer',
      company: 'Apple',
      companyLogo: 'https://ui-avatars.com/api/?name=Apple&background=000000&color=fff&size=128&bold=true',
      location: 'Cupertino, CA',
      locationType: 'onsite',
      employmentType: 'full-time',
      salaryMin: 160000,
      salaryMax: 220000,
      description: 'Join Apple to work on innovative products that change the world. Build software for iOS, macOS, and cloud services.',
      requirements: ['3+ years software development', 'Swift or Objective-C', 'Strong CS fundamentals'],
      benefits: ['Health insurance', 'Product discounts', 'Stock purchase plan'],
      skills: ['Swift', 'JavaScript', 'Python', 'SQL'],
      experienceLevel: 'mid',
      industry: 'Technology',
      department: 'Engineering'
    },
    {
      title: 'Backend Developer',
      company: 'Amazon',
      companyLogo: 'https://ui-avatars.com/api/?name=Amazon&background=FF9900&color=000&size=128&bold=true',
      location: 'Seattle, WA',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 150000,
      salaryMax: 210000,
      description: 'Build scalable backend services for AWS. Work on distributed systems that power millions of businesses worldwide.',
      requirements: ['4+ years backend development', 'Java or Python', 'AWS experience preferred'],
      benefits: ['Health insurance', 'RSU', 'Relocation assistance'],
      skills: ['Python', 'AWS', 'Docker', 'Kubernetes'],
      experienceLevel: 'senior',
      industry: 'Technology',
      department: 'Engineering'
    },
    {
      title: 'DevOps Engineer',
      company: 'Netflix',
      companyLogo: 'https://ui-avatars.com/api/?name=Netflix&background=E50914&color=fff&size=128&bold=true',
      location: 'Los Gatos, CA',
      locationType: 'remote',
      employmentType: 'full-time',
      salaryMin: 180000,
      salaryMax: 280000,
      description: 'Build and maintain infrastructure supporting streaming to 200+ million subscribers. Work with cutting-edge cloud technologies.',
      requirements: ['5+ years DevOps experience', 'Strong AWS knowledge', 'Kubernetes expertise'],
      benefits: ['Unlimited PTO', 'Top-of-market pay', 'Stock options'],
      skills: ['AWS', 'Kubernetes', 'Docker', 'CI/CD'],
      experienceLevel: 'senior',
      industry: 'Entertainment',
      department: 'Infrastructure'
    },
    {
      title: 'Data Engineer',
      company: 'Spotify',
      companyLogo: 'https://ui-avatars.com/api/?name=Spotify&background=1DB954&color=fff&size=128&bold=true',
      location: 'New York, NY',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 140000,
      salaryMax: 200000,
      description: 'Build data pipelines that power music recommendations for 400+ million users. Work with big data technologies at scale.',
      requirements: ['3+ years data engineering', 'Python and SQL', 'Experience with Spark or similar'],
      benefits: ['Health insurance', 'Free Spotify Premium', 'Flexible hours'],
      skills: ['Python', 'SQL', 'AWS', 'Machine Learning'],
      experienceLevel: 'mid',
      industry: 'Entertainment',
      department: 'Data'
    },
    {
      title: 'React Native Developer',
      company: 'Airbnb',
      companyLogo: 'https://ui-avatars.com/api/?name=Airbnb&background=FF5A5F&color=fff&size=128&bold=true',
      location: 'San Francisco, CA',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 160000,
      salaryMax: 220000,
      description: 'Build mobile experiences for millions of travelers and hosts. Work on the Airbnb app used worldwide.',
      requirements: ['4+ years mobile development', 'React Native experience', 'iOS/Android knowledge'],
      benefits: ['Health insurance', 'Travel credits', 'Stock options'],
      skills: ['React', 'TypeScript', 'JavaScript'],
      experienceLevel: 'senior',
      industry: 'Travel',
      department: 'Mobile'
    },
    {
      title: 'Machine Learning Engineer',
      company: 'OpenAI',
      companyLogo: 'https://ui-avatars.com/api/?name=OpenAI&background=412991&color=fff&size=128&bold=true',
      location: 'San Francisco, CA',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 200000,
      salaryMax: 350000,
      description: 'Work on cutting-edge AI research and products. Help build the future of artificial intelligence.',
      requirements: ['PhD or MS in ML/AI', '3+ years ML experience', 'Strong Python skills'],
      benefits: ['Health insurance', 'Equity', 'Research budget'],
      skills: ['Python', 'Machine Learning', 'Docker'],
      experienceLevel: 'senior',
      industry: 'AI',
      department: 'Research'
    },
    {
      title: 'Platform Engineer',
      company: 'Stripe',
      companyLogo: 'https://ui-avatars.com/api/?name=Stripe&background=635BFF&color=fff&size=128&bold=true',
      location: 'San Francisco, CA',
      locationType: 'remote',
      employmentType: 'full-time',
      salaryMin: 170000,
      salaryMax: 240000,
      description: 'Build infrastructure for the economic infrastructure of the internet. Work on systems processing billions of dollars.',
      requirements: ['5+ years platform engineering', 'Strong systems knowledge', 'Ruby or Go experience'],
      benefits: ['Health insurance', 'Remote work', 'Equity'],
      skills: ['AWS', 'Kubernetes', 'CI/CD', 'Docker'],
      experienceLevel: 'senior',
      industry: 'Fintech',
      department: 'Platform'
    },
    {
      title: 'Frontend Engineer',
      company: 'Figma',
      companyLogo: 'https://ui-avatars.com/api/?name=Figma&background=F24E1E&color=fff&size=128&bold=true',
      location: 'San Francisco, CA',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 150000,
      salaryMax: 210000,
      description: 'Build the future of design tools. Work on complex canvas rendering and real-time collaboration features.',
      requirements: ['3+ years frontend experience', 'Strong JavaScript/TypeScript', 'WebGL experience a plus'],
      benefits: ['Health insurance', 'Equity', 'Learning budget'],
      skills: ['JavaScript', 'TypeScript', 'React'],
      experienceLevel: 'mid',
      industry: 'Design Tools',
      department: 'Engineering'
    },
    {
      title: 'Security Engineer',
      company: 'Cloudflare',
      companyLogo: 'https://ui-avatars.com/api/?name=Cloudflare&background=F38020&color=fff&size=128&bold=true',
      location: 'Austin, TX',
      locationType: 'remote',
      employmentType: 'full-time',
      salaryMin: 160000,
      salaryMax: 230000,
      description: 'Protect millions of websites from cyber attacks. Work on DDoS protection, WAF, and security products.',
      requirements: ['4+ years security experience', 'Network security knowledge', 'Programming skills'],
      benefits: ['Health insurance', 'Remote work', 'Stock options'],
      skills: ['Python', 'AWS', 'Docker'],
      experienceLevel: 'senior',
      industry: 'Cybersecurity',
      department: 'Security'
    },
    {
      title: 'Junior Software Developer',
      company: 'Shopify',
      companyLogo: 'https://ui-avatars.com/api/?name=Shopify&background=96BF48&color=fff&size=128&bold=true',
      location: 'Toronto, Canada',
      locationType: 'remote',
      employmentType: 'full-time',
      salaryMin: 80000,
      salaryMax: 120000,
      description: 'Start your career at a leading e-commerce platform. Learn from experienced engineers while building features used by millions of merchants.',
      requirements: ['CS degree or bootcamp', 'Basic programming knowledge', 'Eagerness to learn'],
      benefits: ['Health insurance', 'Stock options', 'Mentorship program'],
      skills: ['JavaScript', 'React', 'SQL'],
      experienceLevel: 'entry',
      industry: 'E-commerce',
      department: 'Engineering'
    },
    {
      title: 'QA Engineer',
      company: 'Slack',
      companyLogo: 'https://ui-avatars.com/api/?name=Slack&background=4A154B&color=fff&size=128&bold=true',
      location: 'Denver, CO',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 110000,
      salaryMax: 160000,
      description: 'Ensure quality for communication tools used by millions. Build test automation and improve testing processes.',
      requirements: ['3+ years QA experience', 'Test automation skills', 'Selenium or similar'],
      benefits: ['Health insurance', 'Equity', 'Flexible hours'],
      skills: ['JavaScript', 'Python', 'CI/CD'],
      experienceLevel: 'mid',
      industry: 'Technology',
      department: 'QA'
    },
    {
      title: 'Engineering Manager',
      company: 'Uber',
      companyLogo: 'https://ui-avatars.com/api/?name=Uber&background=000000&color=fff&size=128&bold=true',
      location: 'San Francisco, CA',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 220000,
      salaryMax: 320000,
      description: 'Lead a team of engineers building rider and driver experiences. Drive technical strategy and team growth.',
      requirements: ['7+ years engineering experience', '2+ years management', 'Strong technical background'],
      benefits: ['Health insurance', 'Equity', 'Uber credits'],
      skills: ['Leadership', 'Project Management', 'Agile'],
      experienceLevel: 'lead',
      industry: 'Transportation',
      department: 'Engineering'
    },
    {
      title: 'Site Reliability Engineer',
      company: 'Datadog',
      companyLogo: 'https://ui-avatars.com/api/?name=Datadog&background=632CA6&color=fff&size=128&bold=true',
      location: 'Boston, MA',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 160000,
      salaryMax: 220000,
      description: 'Keep monitoring infrastructure running 24/7. Work on high-availability systems processing trillions of data points.',
      requirements: ['4+ years SRE experience', 'Strong Linux knowledge', 'Programming skills'],
      benefits: ['Health insurance', 'Equity', 'On-call compensation'],
      skills: ['AWS', 'Kubernetes', 'Python', 'Docker'],
      experienceLevel: 'senior',
      industry: 'Technology',
      department: 'Infrastructure'
    },
    {
      title: 'Product Designer',
      company: 'Notion',
      companyLogo: 'https://ui-avatars.com/api/?name=Notion&background=000000&color=fff&size=128&bold=true',
      location: 'San Francisco, CA',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 140000,
      salaryMax: 200000,
      description: 'Design features for the all-in-one workspace. Create intuitive experiences for millions of users.',
      requirements: ['4+ years product design', 'Strong Figma skills', 'User research experience'],
      benefits: ['Health insurance', 'Equity', 'Design tools budget'],
      skills: ['Communication', 'Problem Solving'],
      experienceLevel: 'mid',
      industry: 'Productivity',
      department: 'Design'
    },
    {
      title: 'Technical Program Manager',
      company: 'Microsoft',
      companyLogo: 'https://ui-avatars.com/api/?name=Microsoft&background=00A4EF&color=fff&size=128&bold=true',
      location: 'Redmond, WA',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 150000,
      salaryMax: 210000,
      description: 'Drive complex technical programs across Azure services. Coordinate between multiple teams to deliver features.',
      requirements: ['5+ years TPM experience', 'Technical background', 'Strong communication'],
      benefits: ['Health insurance', 'Stock', 'Education benefits'],
      skills: ['Project Management', 'Agile', 'Communication'],
      experienceLevel: 'senior',
      industry: 'Technology',
      department: 'Program Management'
    },
    {
      title: 'iOS Developer',
      company: 'Instacart',
      companyLogo: 'https://ui-avatars.com/api/?name=Instacart&background=43B02A&color=fff&size=128&bold=true',
      location: 'San Francisco, CA',
      locationType: 'remote',
      employmentType: 'full-time',
      salaryMin: 150000,
      salaryMax: 200000,
      description: 'Build the iOS app for grocery delivery. Work on features used by millions of customers and shoppers.',
      requirements: ['3+ years iOS development', 'Swift experience', 'App Store deployment'],
      benefits: ['Health insurance', 'Equity', 'Grocery credits'],
      skills: ['Swift', 'JavaScript'],
      experienceLevel: 'mid',
      industry: 'Delivery',
      department: 'Mobile'
    },
    {
      title: 'Solutions Architect',
      company: 'Salesforce',
      companyLogo: 'https://ui-avatars.com/api/?name=Salesforce&background=00A1E0&color=fff&size=128&bold=true',
      location: 'Indianapolis, IN',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 140000,
      salaryMax: 190000,
      description: 'Design technical solutions for enterprise customers. Help businesses transform with Salesforce platform.',
      requirements: ['5+ years architecture experience', 'Salesforce certifications', 'Customer-facing experience'],
      benefits: ['Health insurance', 'Stock', 'Volunteer time off'],
      skills: ['Communication', 'Problem Solving', 'Project Management'],
      experienceLevel: 'senior',
      industry: 'CRM',
      department: 'Solutions'
    },
    {
      title: 'Blockchain Developer',
      company: 'Coinbase',
      companyLogo: 'https://ui-avatars.com/api/?name=Coinbase&background=0052FF&color=fff&size=128&bold=true',
      location: 'Remote',
      locationType: 'remote',
      employmentType: 'full-time',
      salaryMin: 180000,
      salaryMax: 260000,
      description: 'Build the future of finance with cryptocurrency. Work on blockchain infrastructure and trading systems.',
      requirements: ['4+ years development experience', 'Blockchain knowledge', 'Security mindset'],
      benefits: ['Health insurance', 'Crypto allocation', 'Remote work'],
      skills: ['JavaScript', 'Python', 'AWS'],
      experienceLevel: 'senior',
      industry: 'Cryptocurrency',
      department: 'Engineering'
    }
  ];

  const jobs = await Promise.all(
    jobsData.map(j => prisma.job.create({ data: j }))
  );

  // Create Resumes (15 resumes)
  console.log('📄 Creating resumes...');
  const resumesData = [
    {
      userId: user.id,
      title: 'Senior Full Stack Developer Resume',
      summary: 'Experienced full stack developer with 6+ years building scalable web applications. Expert in React, Node.js, and cloud technologies. Led teams of 5+ engineers and delivered products serving millions of users.',
      experience: [
        {
          company: 'Tech Startup Inc.',
          title: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          startDate: '2021-01',
          endDate: 'Present',
          bullets: [
            'Led development of customer-facing React application serving 2M+ users',
            'Architected microservices backend reducing latency by 40%',
            'Mentored team of 4 junior developers'
          ]
        },
        {
          company: 'Digital Agency',
          title: 'Full Stack Developer',
          location: 'San Francisco, CA',
          startDate: '2018-06',
          endDate: '2020-12',
          bullets: [
            'Built 15+ web applications for Fortune 500 clients',
            'Implemented CI/CD pipelines reducing deployment time by 60%',
            'Introduced TypeScript improving code quality'
          ]
        }
      ],
      education: [
        {
          school: 'Stanford University',
          degree: 'B.S. Computer Science',
          location: 'Stanford, CA',
          graduationDate: '2018'
        }
      ],
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'PostgreSQL'],
      atsScore: 92,
      aiScore: 88
    },
    {
      userId: user.id,
      title: 'Frontend Specialist Resume',
      summary: 'Frontend developer specializing in React and modern web technologies. Passionate about creating beautiful, performant user interfaces.',
      experience: [
        {
          company: 'Tech Corp',
          title: 'Frontend Developer',
          location: 'New York, NY',
          startDate: '2020-03',
          endDate: 'Present',
          bullets: [
            'Developed responsive web applications using React and TypeScript',
            'Improved Core Web Vitals scores by 35%',
            'Built reusable component library used across 10+ projects'
          ]
        }
      ],
      education: [
        {
          school: 'NYU',
          degree: 'B.S. Computer Science',
          location: 'New York, NY',
          graduationDate: '2020'
        }
      ],
      skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'GraphQL'],
      atsScore: 85,
      aiScore: 82
    },
    {
      userId: user.id,
      title: 'Backend Engineer Resume',
      summary: 'Backend engineer with expertise in distributed systems and cloud infrastructure. Experience building high-availability services at scale.',
      experience: [
        {
          company: 'Cloud Services Inc.',
          title: 'Backend Engineer',
          location: 'Seattle, WA',
          startDate: '2019-08',
          endDate: 'Present',
          bullets: [
            'Built microservices handling 100K+ requests per second',
            'Designed and implemented event-driven architecture',
            'Reduced infrastructure costs by 30% through optimization'
          ]
        }
      ],
      education: [
        {
          school: 'University of Washington',
          degree: 'M.S. Computer Science',
          location: 'Seattle, WA',
          graduationDate: '2019'
        }
      ],
      skills: ['Python', 'Go', 'AWS', 'Kubernetes', 'PostgreSQL', 'Redis'],
      atsScore: 88,
      aiScore: 85
    },
    {
      userId: user.id,
      title: 'DevOps Resume',
      summary: 'DevOps engineer focused on automation and reliability. Experience with CI/CD, container orchestration, and infrastructure as code.',
      experience: [
        {
          company: 'Infrastructure Co.',
          title: 'DevOps Engineer',
          location: 'Austin, TX',
          startDate: '2020-01',
          endDate: 'Present',
          bullets: [
            'Managed Kubernetes clusters with 500+ pods',
            'Implemented GitOps workflows using ArgoCD',
            'Achieved 99.99% uptime for production services'
          ]
        }
      ],
      education: [
        {
          school: 'UT Austin',
          degree: 'B.S. Computer Engineering',
          location: 'Austin, TX',
          graduationDate: '2019'
        }
      ],
      skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD', 'Python'],
      atsScore: 90,
      aiScore: 87
    },
    {
      userId: user.id,
      title: 'ML Engineer Resume',
      summary: 'Machine learning engineer with experience in NLP and computer vision. Passionate about deploying ML models at scale.',
      experience: [
        {
          company: 'AI Startup',
          title: 'ML Engineer',
          location: 'San Francisco, CA',
          startDate: '2021-06',
          endDate: 'Present',
          bullets: [
            'Developed NLP models improving search relevance by 25%',
            'Built ML pipeline processing 1M+ documents daily',
            'Deployed models using SageMaker and Kubernetes'
          ]
        }
      ],
      education: [
        {
          school: 'Berkeley',
          degree: 'M.S. Machine Learning',
          location: 'Berkeley, CA',
          graduationDate: '2021'
        }
      ],
      skills: ['Python', 'TensorFlow', 'PyTorch', 'AWS', 'Docker'],
      atsScore: 86,
      aiScore: 90
    },
    {
      userId: user.id,
      title: 'Mobile Developer Resume',
      summary: 'Mobile developer with 4+ years experience in iOS and Android development. Expert in React Native and Swift.',
      experience: [
        {
          company: 'Mobile Apps Inc.',
          title: 'Senior Mobile Developer',
          location: 'Los Angeles, CA',
          startDate: '2020-06',
          endDate: 'Present',
          bullets: [
            'Built cross-platform apps with 500K+ downloads',
            'Reduced app crash rate by 80%',
            'Led migration from native to React Native'
          ]
        }
      ],
      education: [
        {
          school: 'UCLA',
          degree: 'B.S. Computer Science',
          location: 'Los Angeles, CA',
          graduationDate: '2020'
        }
      ],
      skills: ['React Native', 'Swift', 'Kotlin', 'TypeScript', 'Firebase'],
      atsScore: 84,
      aiScore: 81
    },
    {
      userId: user.id,
      title: 'Data Scientist Resume',
      summary: 'Data scientist with strong background in statistics and machine learning. Experience turning data into actionable insights.',
      experience: [
        {
          company: 'Analytics Corp',
          title: 'Data Scientist',
          location: 'Boston, MA',
          startDate: '2019-03',
          endDate: 'Present',
          bullets: [
            'Built predictive models increasing revenue by 15%',
            'Developed A/B testing framework used across 50+ experiments',
            'Created executive dashboards viewed by C-suite weekly'
          ]
        }
      ],
      education: [
        {
          school: 'MIT',
          degree: 'M.S. Statistics',
          location: 'Cambridge, MA',
          graduationDate: '2019'
        }
      ],
      skills: ['Python', 'R', 'SQL', 'Tableau', 'Machine Learning', 'Statistics'],
      atsScore: 87,
      aiScore: 85
    },
    {
      userId: user.id,
      title: 'Security Engineer Resume',
      summary: 'Security engineer focused on application security and penetration testing. CISSP certified with extensive experience in threat modeling.',
      experience: [
        {
          company: 'SecureTech',
          title: 'Senior Security Engineer',
          location: 'Washington, DC',
          startDate: '2018-09',
          endDate: 'Present',
          bullets: [
            'Conducted 100+ security assessments for Fortune 500 clients',
            'Discovered and responsibly disclosed 12 CVEs',
            'Built automated vulnerability scanning pipeline'
          ]
        }
      ],
      education: [
        {
          school: 'Georgia Tech',
          degree: 'M.S. Cybersecurity',
          location: 'Atlanta, GA',
          graduationDate: '2018'
        }
      ],
      skills: ['Python', 'Penetration Testing', 'AWS Security', 'OWASP', 'Burp Suite'],
      atsScore: 89,
      aiScore: 86
    },
    {
      userId: user.id,
      title: 'Platform Engineer Resume',
      summary: 'Platform engineer building internal developer tools and infrastructure. Passionate about developer experience and productivity.',
      experience: [
        {
          company: 'Developer Tools Co.',
          title: 'Platform Engineer',
          location: 'Denver, CO',
          startDate: '2020-08',
          endDate: 'Present',
          bullets: [
            'Built internal platform used by 200+ developers daily',
            'Reduced deployment time from 30 mins to 5 mins',
            'Implemented self-service infrastructure provisioning'
          ]
        }
      ],
      education: [
        {
          school: 'Colorado State',
          degree: 'B.S. Computer Science',
          location: 'Fort Collins, CO',
          graduationDate: '2020'
        }
      ],
      skills: ['Go', 'Kubernetes', 'Terraform', 'AWS', 'GitHub Actions', 'PostgreSQL'],
      atsScore: 86,
      aiScore: 84
    },
    {
      userId: user.id,
      title: 'QA Engineer Resume',
      summary: 'QA engineer specializing in test automation and quality processes. Experience with both manual and automated testing strategies.',
      experience: [
        {
          company: 'Quality First Inc.',
          title: 'Senior QA Engineer',
          location: 'Portland, OR',
          startDate: '2019-05',
          endDate: 'Present',
          bullets: [
            'Built test automation framework covering 80% of critical paths',
            'Reduced regression testing time by 70%',
            'Established QA best practices adopted company-wide'
          ]
        }
      ],
      education: [
        {
          school: 'Oregon State',
          degree: 'B.S. Software Engineering',
          location: 'Corvallis, OR',
          graduationDate: '2019'
        }
      ],
      skills: ['Selenium', 'Cypress', 'Jest', 'Python', 'CI/CD', 'JIRA'],
      atsScore: 83,
      aiScore: 80
    },
    {
      userId: user.id,
      title: 'Site Reliability Engineer Resume',
      summary: 'SRE focused on maintaining high-availability systems. Expert in incident response, monitoring, and capacity planning.',
      experience: [
        {
          company: 'Reliability Systems',
          title: 'SRE',
          location: 'Chicago, IL',
          startDate: '2019-11',
          endDate: 'Present',
          bullets: [
            'Maintained 99.99% uptime for critical production services',
            'Built monitoring dashboards reducing MTTR by 50%',
            'Led incident response for 200+ on-call rotations'
          ]
        }
      ],
      education: [
        {
          school: 'University of Illinois',
          degree: 'B.S. Computer Engineering',
          location: 'Urbana-Champaign, IL',
          graduationDate: '2019'
        }
      ],
      skills: ['Prometheus', 'Grafana', 'Kubernetes', 'Terraform', 'Python', 'Linux'],
      atsScore: 88,
      aiScore: 86
    },
    {
      userId: user.id,
      title: 'Technical Lead Resume',
      summary: 'Technical lead with 8+ years of experience. Strong background in architecture, mentoring, and delivering complex projects.',
      experience: [
        {
          company: 'Enterprise Tech',
          title: 'Technical Lead',
          location: 'Atlanta, GA',
          startDate: '2018-02',
          endDate: 'Present',
          bullets: [
            'Led team of 8 engineers delivering $5M revenue product',
            'Architected microservices migration from monolith',
            'Established engineering standards and code review processes'
          ]
        }
      ],
      education: [
        {
          school: 'Georgia Tech',
          degree: 'M.S. Computer Science',
          location: 'Atlanta, GA',
          graduationDate: '2015'
        }
      ],
      skills: ['Java', 'Spring Boot', 'AWS', 'System Design', 'Leadership', 'Agile'],
      atsScore: 91,
      aiScore: 89
    },
    {
      userId: user.id,
      title: 'Junior Developer Resume',
      summary: 'Recent computer science graduate eager to start career in software development. Strong foundation in programming fundamentals.',
      experience: [
        {
          company: 'University Projects',
          title: 'Student Developer',
          location: 'Remote',
          startDate: '2022-01',
          endDate: '2024-05',
          bullets: [
            'Built full-stack capstone project using React and Node.js',
            'Contributed to open source projects with 50+ commits',
            'Completed internship at local startup'
          ]
        }
      ],
      education: [
        {
          school: 'State University',
          degree: 'B.S. Computer Science',
          location: 'Sacramento, CA',
          graduationDate: '2024'
        }
      ],
      skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git'],
      atsScore: 75,
      aiScore: 72
    },
    {
      userId: user.id,
      title: 'Cloud Architect Resume',
      summary: 'Cloud architect with expertise in AWS and multi-cloud environments. Certified Solutions Architect with enterprise experience.',
      experience: [
        {
          company: 'Cloud Consulting',
          title: 'Cloud Architect',
          location: 'Miami, FL',
          startDate: '2017-06',
          endDate: 'Present',
          bullets: [
            'Designed cloud infrastructure for 50+ enterprise clients',
            'Reduced cloud costs by average of 40% through optimization',
            'Led migration of 100+ applications to AWS'
          ]
        }
      ],
      education: [
        {
          school: 'FIU',
          degree: 'M.S. Information Systems',
          location: 'Miami, FL',
          graduationDate: '2017'
        }
      ],
      skills: ['AWS', 'Azure', 'GCP', 'Terraform', 'Kubernetes', 'Architecture'],
      atsScore: 93,
      aiScore: 91
    },
    {
      userId: user.id,
      title: 'Product Engineer Resume',
      summary: 'Product-minded engineer who bridges technical execution with user needs. Experience shipping features from ideation to launch.',
      experience: [
        {
          company: 'Product Co.',
          title: 'Product Engineer',
          location: 'San Francisco, CA',
          startDate: '2020-04',
          endDate: 'Present',
          bullets: [
            'Shipped 20+ features driving 30% user growth',
            'Collaborated with PM and design to define product roadmap',
            'Built analytics system tracking key product metrics'
          ]
        }
      ],
      education: [
        {
          school: 'UC Berkeley',
          degree: 'B.S. EECS',
          location: 'Berkeley, CA',
          graduationDate: '2020'
        }
      ],
      skills: ['React', 'Node.js', 'PostgreSQL', 'Analytics', 'A/B Testing', 'Product Sense'],
      atsScore: 85,
      aiScore: 87
    }
  ];

  const resumes = await Promise.all(
    resumesData.map(r => prisma.resume.create({ data: r }))
  );

  // Create Cover Letters (15 cover letters)
  console.log('✉️  Creating cover letters...');
  const coverLettersData = [
    { userId: user.id, title: 'Google Frontend Cover Letter', content: 'Dear Hiring Manager,\n\nI am excited to apply for the Senior Frontend Developer position at Google...', targetCompany: 'Google', targetPosition: 'Senior Frontend Developer', tone: 'professional' },
    { userId: user.id, title: 'Meta Full Stack Cover Letter', content: 'Dear Hiring Team,\n\nI am writing to express my interest in the Full Stack Engineer role at Meta...', targetCompany: 'Meta', targetPosition: 'Full Stack Engineer', tone: 'professional' },
    { userId: user.id, title: 'Apple Software Engineer Cover Letter', content: 'Dear Apple Recruiting Team,\n\nI am thrilled to apply for the Software Engineer position...', targetCompany: 'Apple', targetPosition: 'Software Engineer', tone: 'professional' },
    { userId: user.id, title: 'Amazon Backend Cover Letter', content: 'Dear Hiring Manager,\n\nI am excited about the Backend Developer opportunity at Amazon...', targetCompany: 'Amazon', targetPosition: 'Backend Developer', tone: 'professional' },
    { userId: user.id, title: 'Netflix DevOps Cover Letter', content: 'Dear Netflix Team,\n\nI am passionate about building reliable systems at scale...', targetCompany: 'Netflix', targetPosition: 'DevOps Engineer', tone: 'creative' },
    { userId: user.id, title: 'Stripe Platform Cover Letter', content: 'Dear Stripe Hiring Team,\n\nBuilding the economic infrastructure of the internet excites me...', targetCompany: 'Stripe', targetPosition: 'Platform Engineer', tone: 'professional' },
    { userId: user.id, title: 'Figma Frontend Cover Letter', content: 'Dear Figma Team,\n\nAs a passionate designer and developer, I would love to contribute...', targetCompany: 'Figma', targetPosition: 'Frontend Engineer', tone: 'creative' },
    { userId: user.id, title: 'OpenAI ML Cover Letter', content: 'Dear OpenAI Team,\n\nI am deeply passionate about advancing AI for the benefit of humanity...', targetCompany: 'OpenAI', targetPosition: 'ML Engineer', tone: 'professional' },
    { userId: user.id, title: 'Airbnb Mobile Cover Letter', content: 'Dear Airbnb Team,\n\nI believe in the power of travel to connect people...', targetCompany: 'Airbnb', targetPosition: 'React Native Developer', tone: 'friendly' },
    { userId: user.id, title: 'Spotify Data Cover Letter', content: 'Dear Spotify Team,\n\nMusic has always been a passion of mine, and so has data...', targetCompany: 'Spotify', targetPosition: 'Data Engineer', tone: 'creative' },
    { userId: user.id, title: 'Uber Engineering Manager Cover Letter', content: 'Dear Uber Team,\n\nWith 7+ years of engineering and leadership experience...', targetCompany: 'Uber', targetPosition: 'Engineering Manager', tone: 'professional' },
    { userId: user.id, title: 'Cloudflare Security Cover Letter', content: 'Dear Cloudflare Team,\n\nProtecting the internet is a mission I care deeply about...', targetCompany: 'Cloudflare', targetPosition: 'Security Engineer', tone: 'professional' },
    { userId: user.id, title: 'Shopify Junior Dev Cover Letter', content: 'Dear Shopify Team,\n\nAs a recent graduate eager to start my career...', targetCompany: 'Shopify', targetPosition: 'Junior Developer', tone: 'friendly' },
    { userId: user.id, title: 'Datadog SRE Cover Letter', content: 'Dear Datadog Team,\n\nI thrive on keeping systems running smoothly at scale...', targetCompany: 'Datadog', targetPosition: 'SRE', tone: 'professional' },
    { userId: user.id, title: 'Coinbase Blockchain Cover Letter', content: 'Dear Coinbase Team,\n\nI am passionate about the potential of blockchain technology...', targetCompany: 'Coinbase', targetPosition: 'Blockchain Developer', tone: 'professional' }
  ];

  const coverLetters = await Promise.all(
    coverLettersData.map(c => prisma.coverLetter.create({ data: c }))
  );

  // Create Job Applications (18 applications)
  console.log('📝 Creating job applications...');
  const applicationStatuses = ['applied', 'screening', 'interview', 'offer', 'rejected', 'accepted', 'withdrawn'];
  const applicationsData = [
    { userId: user.id, jobId: jobs[0].id, resumeId: resumes[0].id, coverLetterId: coverLetters[0].id, companyName: 'Google', position: 'Senior Frontend Developer', status: 'interview', priority: 1 },
    { userId: user.id, jobId: jobs[1].id, resumeId: resumes[0].id, coverLetterId: coverLetters[1].id, companyName: 'Meta', position: 'Full Stack Engineer', status: 'screening', priority: 2 },
    { userId: user.id, jobId: jobs[2].id, resumeId: resumes[0].id, coverLetterId: coverLetters[2].id, companyName: 'Apple', position: 'Software Engineer', status: 'applied', priority: 2 },
    { userId: user.id, jobId: jobs[3].id, resumeId: resumes[2].id, coverLetterId: coverLetters[3].id, companyName: 'Amazon', position: 'Backend Developer', status: 'interview', priority: 1 },
    { userId: user.id, jobId: jobs[4].id, resumeId: resumes[3].id, coverLetterId: coverLetters[4].id, companyName: 'Netflix', position: 'DevOps Engineer', status: 'offer', priority: 1 },
    { userId: user.id, jobId: jobs[5].id, resumeId: resumes[2].id, coverLetterId: coverLetters[9].id, companyName: 'Spotify', position: 'Data Engineer', status: 'applied', priority: 3 },
    { userId: user.id, jobId: jobs[6].id, resumeId: resumes[0].id, coverLetterId: coverLetters[8].id, companyName: 'Airbnb', position: 'React Native Developer', status: 'rejected', priority: 2 },
    { userId: user.id, jobId: jobs[7].id, resumeId: resumes[4].id, coverLetterId: coverLetters[7].id, companyName: 'OpenAI', position: 'ML Engineer', status: 'screening', priority: 1 },
    { userId: user.id, jobId: jobs[8].id, resumeId: resumes[3].id, coverLetterId: coverLetters[5].id, companyName: 'Stripe', position: 'Platform Engineer', status: 'interview', priority: 1 },
    { userId: user.id, jobId: jobs[9].id, resumeId: resumes[1].id, coverLetterId: coverLetters[6].id, companyName: 'Figma', position: 'Frontend Engineer', status: 'applied', priority: 2 },
    { userId: user.id, jobId: jobs[10].id, resumeId: resumes[3].id, coverLetterId: coverLetters[11].id, companyName: 'Cloudflare', position: 'Security Engineer', status: 'screening', priority: 2 },
    { userId: user.id, jobId: jobs[13].id, resumeId: resumes[0].id, coverLetterId: coverLetters[10].id, companyName: 'Uber', position: 'Engineering Manager', status: 'interview', priority: 1 },
    { userId: user.id, jobId: jobs[14].id, resumeId: resumes[3].id, coverLetterId: coverLetters[13].id, companyName: 'Datadog', position: 'SRE', status: 'applied', priority: 2 },
    { userId: user.id, jobId: jobs[19].id, resumeId: resumes[2].id, coverLetterId: coverLetters[14].id, companyName: 'Coinbase', position: 'Blockchain Developer', status: 'screening', priority: 2 },
    { userId: user.id, companyName: 'Startup ABC', position: 'Senior Developer', status: 'withdrawn', priority: 4 },
    { userId: user.id, companyName: 'Tech Corp', position: 'Lead Engineer', status: 'accepted', priority: 1 },
    { userId: user.id, companyName: 'FinTech Inc', position: 'Backend Developer', status: 'rejected', priority: 3 },
    { userId: user.id, companyName: 'Healthcare Tech', position: 'Full Stack Developer', status: 'applied', priority: 3 }
  ];

  const applications = await Promise.all(
    applicationsData.map(a => prisma.jobApplication.create({ data: a }))
  );

  // Create Interviews (15 interviews)
  console.log('🎤 Creating interviews...');
  const interviewsData = [
    { userId: user.id, applicationId: applications[0].id, companyName: 'Google', position: 'Senior Frontend Developer', interviewType: 'phone', scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), duration: 45, status: 'scheduled' },
    { userId: user.id, applicationId: applications[0].id, companyName: 'Google', position: 'Senior Frontend Developer', interviewType: 'technical', scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), duration: 90, status: 'scheduled' },
    { userId: user.id, applicationId: applications[3].id, companyName: 'Amazon', position: 'Backend Developer', interviewType: 'video', scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), duration: 60, status: 'scheduled' },
    { userId: user.id, applicationId: applications[4].id, companyName: 'Netflix', position: 'DevOps Engineer', interviewType: 'onsite', scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), duration: 240, status: 'completed', feedback: 'Strong candidate, excellent system design skills', rating: 5 },
    { userId: user.id, applicationId: applications[8].id, companyName: 'Stripe', position: 'Platform Engineer', interviewType: 'technical', scheduledDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), duration: 90, status: 'scheduled' },
    { userId: user.id, applicationId: applications[11].id, companyName: 'Uber', position: 'Engineering Manager', interviewType: 'behavioral', scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), duration: 60, status: 'scheduled' },
    { userId: user.id, companyName: 'LinkedIn', position: 'Staff Engineer', interviewType: 'phone', scheduledDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), duration: 30, status: 'completed', feedback: 'Good communication, needs stronger system design', rating: 3 },
    { userId: user.id, companyName: 'Twitter', position: 'Senior Engineer', interviewType: 'technical', scheduledDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), duration: 60, status: 'completed', feedback: 'Excellent coding skills', rating: 4 },
    { userId: user.id, companyName: 'Dropbox', position: 'Backend Engineer', interviewType: 'video', scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), duration: 45, status: 'scheduled' },
    { userId: user.id, companyName: 'Square', position: 'Full Stack Developer', interviewType: 'phone', scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), duration: 30, status: 'completed', rating: 4 },
    { userId: user.id, companyName: 'Palantir', position: 'Forward Deployed Engineer', interviewType: 'onsite', scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), duration: 300, status: 'scheduled' },
    { userId: user.id, companyName: 'Robinhood', position: 'Backend Developer', interviewType: 'technical', scheduledDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), duration: 60, status: 'completed', feedback: 'Strong in algorithms, good culture fit', rating: 4 },
    { userId: user.id, companyName: 'Twilio', position: 'Platform Engineer', interviewType: 'panel', scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), duration: 120, status: 'scheduled' },
    { userId: user.id, companyName: 'MongoDB', position: 'Software Engineer', interviewType: 'technical', scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), duration: 90, status: 'cancelled' },
    { userId: user.id, companyName: 'Elastic', position: 'Backend Developer', interviewType: 'video', scheduledDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), duration: 60, status: 'scheduled' }
  ];

  const interviews = await Promise.all(
    interviewsData.map(i => prisma.interview.create({ data: i }))
  );

  // Create Interview Prep Questions (20 questions)
  console.log('❓ Creating interview prep questions...');
  const questionsData = [
    { category: 'behavioral', question: 'Tell me about yourself.', suggestedAnswer: 'Structure your answer with present, past, and future...', tips: 'Keep it under 2 minutes', difficulty: 'easy' },
    { category: 'behavioral', question: 'Why do you want to work here?', suggestedAnswer: 'Research the company and connect your goals...', tips: 'Be specific about the company', difficulty: 'easy' },
    { category: 'behavioral', question: 'Tell me about a time you faced a conflict at work.', suggestedAnswer: 'Use the STAR method...', tips: 'Focus on resolution', difficulty: 'medium' },
    { category: 'behavioral', question: 'Describe a challenging project you completed.', suggestedAnswer: 'Highlight your problem-solving process...', tips: 'Quantify results', difficulty: 'medium' },
    { category: 'behavioral', question: 'Where do you see yourself in 5 years?', suggestedAnswer: 'Show ambition while being realistic...', tips: 'Align with company growth', difficulty: 'easy' },
    { category: 'technical', question: 'Explain the difference between REST and GraphQL.', suggestedAnswer: 'REST uses multiple endpoints, GraphQL uses a single endpoint...', tips: 'Give examples', difficulty: 'medium' },
    { category: 'technical', question: 'How would you design a URL shortener?', suggestedAnswer: 'Discuss hashing, database design, caching...', tips: 'Consider scale', difficulty: 'hard' },
    { category: 'technical', question: 'What is the difference between SQL and NoSQL databases?', suggestedAnswer: 'SQL is relational, NoSQL is document/key-value...', tips: 'Mention use cases', difficulty: 'medium' },
    { category: 'technical', question: 'Explain how React virtual DOM works.', suggestedAnswer: 'Virtual DOM is a lightweight copy of the actual DOM...', tips: 'Discuss reconciliation', difficulty: 'medium' },
    { category: 'technical', question: 'Design a rate limiter.', suggestedAnswer: 'Discuss token bucket, sliding window algorithms...', tips: 'Consider distributed systems', difficulty: 'hard' },
    { category: 'situational', question: 'How would you handle a tight deadline?', suggestedAnswer: 'Prioritize tasks, communicate with stakeholders...', tips: 'Give a real example', difficulty: 'medium' },
    { category: 'situational', question: 'What would you do if you disagreed with your manager?', suggestedAnswer: 'Express your concerns respectfully, provide data...', tips: 'Show maturity', difficulty: 'medium' },
    { category: 'situational', question: 'How do you handle multiple competing priorities?', suggestedAnswer: 'Use a prioritization framework like Eisenhower matrix...', tips: 'Be specific', difficulty: 'medium' },
    { category: 'company-specific', question: 'Why Google specifically?', suggestedAnswer: 'Discuss mission, products, culture...', tips: 'Be genuine', difficulty: 'easy' },
    { category: 'company-specific', question: 'What do you know about our recent products?', suggestedAnswer: 'Research and mention specific launches...', tips: 'Show preparation', difficulty: 'medium' },
    { category: 'technical', question: 'Explain microservices architecture.', suggestedAnswer: 'Microservices break applications into small, independent services...', tips: 'Discuss pros and cons', difficulty: 'medium' },
    { category: 'technical', question: 'How does HTTPS work?', suggestedAnswer: 'TLS handshake, certificate verification, encryption...', tips: 'Be thorough', difficulty: 'medium' },
    { category: 'behavioral', question: 'Tell me about a time you failed.', suggestedAnswer: 'Be honest, focus on what you learned...', tips: 'Show growth', difficulty: 'medium' },
    { category: 'technical', question: 'What is Big O notation?', suggestedAnswer: 'It describes algorithm time/space complexity...', tips: 'Give examples', difficulty: 'easy' },
    { category: 'situational', question: 'How would you onboard to a new codebase?', suggestedAnswer: 'Read documentation, set up locally, pair with teammates...', tips: 'Show initiative', difficulty: 'easy' }
  ];

  await Promise.all(
    questionsData.map(q => prisma.interviewPrepQuestion.create({ data: { ...q, isAiGenerated: true } }))
  );

  // Create Salary Research (20 entries)
  console.log('💰 Creating salary research...');
  const salaryData = [
    { jobTitle: 'Senior Software Engineer', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'Technology', salaryMin: 180000, salaryMax: 280000, salaryMedian: 220000 },
    { jobTitle: 'Senior Software Engineer', location: 'New York, NY', experienceLevel: 'senior', industry: 'Technology', salaryMin: 170000, salaryMax: 260000, salaryMedian: 210000 },
    { jobTitle: 'Senior Software Engineer', location: 'Seattle, WA', experienceLevel: 'senior', industry: 'Technology', salaryMin: 175000, salaryMax: 270000, salaryMedian: 215000 },
    { jobTitle: 'Senior Software Engineer', location: 'Austin, TX', experienceLevel: 'senior', industry: 'Technology', salaryMin: 150000, salaryMax: 230000, salaryMedian: 185000 },
    { jobTitle: 'Software Engineer', location: 'San Francisco, CA', experienceLevel: 'mid', industry: 'Technology', salaryMin: 140000, salaryMax: 200000, salaryMedian: 165000 },
    { jobTitle: 'Software Engineer', location: 'New York, NY', experienceLevel: 'mid', industry: 'Technology', salaryMin: 130000, salaryMax: 190000, salaryMedian: 155000 },
    { jobTitle: 'Junior Software Engineer', location: 'San Francisco, CA', experienceLevel: 'entry', industry: 'Technology', salaryMin: 100000, salaryMax: 140000, salaryMedian: 120000 },
    { jobTitle: 'Frontend Developer', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'Technology', salaryMin: 170000, salaryMax: 250000, salaryMedian: 200000 },
    { jobTitle: 'Backend Developer', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'Technology', salaryMin: 175000, salaryMax: 260000, salaryMedian: 210000 },
    { jobTitle: 'DevOps Engineer', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'Technology', salaryMin: 180000, salaryMax: 270000, salaryMedian: 215000 },
    { jobTitle: 'Data Engineer', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'Technology', salaryMin: 175000, salaryMax: 265000, salaryMedian: 210000 },
    { jobTitle: 'Machine Learning Engineer', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'AI', salaryMin: 200000, salaryMax: 350000, salaryMedian: 260000 },
    { jobTitle: 'Engineering Manager', location: 'San Francisco, CA', experienceLevel: 'lead', industry: 'Technology', salaryMin: 220000, salaryMax: 350000, salaryMedian: 280000 },
    { jobTitle: 'Product Manager', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'Technology', salaryMin: 180000, salaryMax: 280000, salaryMedian: 220000 },
    { jobTitle: 'Site Reliability Engineer', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'Technology', salaryMin: 185000, salaryMax: 280000, salaryMedian: 225000 },
    { userId: user.id, jobTitle: 'Full Stack Developer', location: 'Remote', experienceLevel: 'senior', industry: 'Technology', salaryMin: 150000, salaryMax: 220000, salaryMedian: 180000 },
    { userId: user.id, jobTitle: 'Senior React Developer', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'Technology', salaryMin: 175000, salaryMax: 255000, salaryMedian: 205000 },
    { userId: user.id, jobTitle: 'Platform Engineer', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'Fintech', salaryMin: 180000, salaryMax: 270000, salaryMedian: 220000 },
    { userId: user.id, jobTitle: 'Security Engineer', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'Cybersecurity', salaryMin: 185000, salaryMax: 280000, salaryMedian: 225000 },
    { userId: user.id, jobTitle: 'Solutions Architect', location: 'San Francisco, CA', experienceLevel: 'senior', industry: 'Technology', salaryMin: 170000, salaryMax: 260000, salaryMedian: 210000 }
  ];

  await Promise.all(
    salaryData.map(s => prisma.salaryResearch.create({ data: s }))
  );

  // Create Company Research (18 companies)
  console.log('🏢 Creating company research...');
  const companyData = [
    { companyName: 'Google', industry: 'Technology', size: 'enterprise', founded: 1998, headquarters: 'Mountain View, CA', glassdoorRating: 4.4, employeeCount: '150,000+', description: 'Global technology leader', culture: 'Innovation-focused, collaborative', benefits: ['Health insurance', '401k', 'Free meals', 'Gym'], techStack: ['Python', 'Go', 'Java', 'C++'] },
    { companyName: 'Meta', industry: 'Technology', size: 'enterprise', founded: 2004, headquarters: 'Menlo Park, CA', glassdoorRating: 4.1, employeeCount: '80,000+', description: 'Social media and VR company', culture: 'Move fast, be bold', benefits: ['Health insurance', 'RSU', 'Parental leave'], techStack: ['React', 'PHP', 'Python', 'C++'] },
    { companyName: 'Apple', industry: 'Technology', size: 'enterprise', founded: 1976, headquarters: 'Cupertino, CA', glassdoorRating: 4.2, employeeCount: '160,000+', description: 'Consumer electronics and software', culture: 'Excellence and secrecy', benefits: ['Health insurance', 'Stock purchase', 'Product discounts'], techStack: ['Swift', 'Objective-C', 'Python'] },
    { companyName: 'Amazon', industry: 'Technology', size: 'enterprise', founded: 1994, headquarters: 'Seattle, WA', glassdoorRating: 3.9, employeeCount: '1,500,000+', description: 'E-commerce and cloud computing giant', culture: 'Customer obsession, ownership', benefits: ['Health insurance', 'RSU', 'Career choice'], techStack: ['Java', 'Python', 'AWS', 'React'] },
    { companyName: 'Netflix', industry: 'Entertainment', size: 'large', founded: 1997, headquarters: 'Los Gatos, CA', glassdoorRating: 4.0, employeeCount: '12,000+', description: 'Streaming entertainment', culture: 'Freedom and responsibility', benefits: ['Unlimited PTO', 'Top pay', 'Parental leave'], techStack: ['Java', 'Python', 'React', 'AWS'] },
    { companyName: 'Stripe', industry: 'Fintech', size: 'large', founded: 2010, headquarters: 'San Francisco, CA', glassdoorRating: 4.3, employeeCount: '8,000+', description: 'Payment infrastructure', culture: 'User-focused, rigorous', benefits: ['Health insurance', 'Equity', 'Remote work'], techStack: ['Ruby', 'Go', 'React', 'AWS'] },
    { companyName: 'Figma', industry: 'Design Tools', size: 'medium', founded: 2012, headquarters: 'San Francisco, CA', glassdoorRating: 4.6, employeeCount: '1,000+', description: 'Collaborative design tool', culture: 'Design-focused, collaborative', benefits: ['Health insurance', 'Equity', 'Learning budget'], techStack: ['TypeScript', 'React', 'WebGL', 'C++'] },
    { companyName: 'OpenAI', industry: 'AI', size: 'medium', founded: 2015, headquarters: 'San Francisco, CA', glassdoorRating: 4.5, employeeCount: '1,500+', description: 'AI research company', culture: 'Research-driven, mission-focused', benefits: ['Health insurance', 'Equity', 'Research budget'], techStack: ['Python', 'PyTorch', 'Kubernetes', 'Azure'] },
    { companyName: 'Airbnb', industry: 'Travel', size: 'large', founded: 2008, headquarters: 'San Francisco, CA', glassdoorRating: 4.3, employeeCount: '6,000+', description: 'Travel and hospitality platform', culture: 'Belong anywhere', benefits: ['Travel credits', 'Health insurance', 'Equity'], techStack: ['React', 'Ruby', 'Java', 'AWS'] },
    { companyName: 'Spotify', industry: 'Entertainment', size: 'large', founded: 2006, headquarters: 'Stockholm, Sweden', glassdoorRating: 4.2, employeeCount: '9,000+', description: 'Music streaming platform', culture: 'Data-driven, innovative', benefits: ['Free Spotify', 'Health insurance', 'Flexible hours'], techStack: ['Java', 'Python', 'React', 'GCP'] },
    { companyName: 'Uber', industry: 'Transportation', size: 'enterprise', founded: 2009, headquarters: 'San Francisco, CA', glassdoorRating: 3.8, employeeCount: '30,000+', description: 'Ride-sharing and delivery', culture: 'Fast-paced, diverse', benefits: ['Uber credits', 'Health insurance', 'Equity'], techStack: ['Go', 'Python', 'React', 'Kafka'] },
    { companyName: 'Cloudflare', industry: 'Cybersecurity', size: 'large', founded: 2009, headquarters: 'San Francisco, CA', glassdoorRating: 4.4, employeeCount: '3,500+', description: 'Web security and CDN', culture: 'Transparent, innovative', benefits: ['Remote work', 'Health insurance', 'Stock options'], techStack: ['Go', 'Rust', 'JavaScript', 'Lua'] },
    { companyName: 'Shopify', industry: 'E-commerce', size: 'large', founded: 2006, headquarters: 'Ottawa, Canada', glassdoorRating: 4.3, employeeCount: '11,000+', description: 'E-commerce platform', culture: 'Entrepreneurial, empowering', benefits: ['Health insurance', 'Stock options', 'Remote work'], techStack: ['Ruby', 'React', 'Go', 'MySQL'] },
    { companyName: 'Datadog', industry: 'Technology', size: 'large', founded: 2010, headquarters: 'New York, NY', glassdoorRating: 4.2, employeeCount: '5,000+', description: 'Cloud monitoring platform', culture: 'Technical excellence', benefits: ['Health insurance', 'Equity', 'On-call pay'], techStack: ['Go', 'Python', 'React', 'Kafka'] },
    { companyName: 'Notion', industry: 'Productivity', size: 'medium', founded: 2013, headquarters: 'San Francisco, CA', glassdoorRating: 4.5, employeeCount: '500+', description: 'All-in-one workspace', culture: 'Thoughtful, user-focused', benefits: ['Health insurance', 'Equity', 'Tools budget'], techStack: ['TypeScript', 'React', 'Kotlin', 'PostgreSQL'] },
    { userId: user.id, companyName: 'Tech Startup XYZ', industry: 'Technology', size: 'startup', description: 'Promising AI startup', isBookmarked: true },
    { userId: user.id, companyName: 'FinTech Corp', industry: 'Fintech', size: 'medium', description: 'Payment processing company', isBookmarked: true },
    { userId: user.id, companyName: 'HealthTech Inc', industry: 'Healthcare', size: 'medium', description: 'Digital health platform', isBookmarked: false }
  ];

  await Promise.all(
    companyData.map(c => prisma.companyResearch.create({ data: c }))
  );

  // Create Network Contacts (18 contacts)
  console.log('👥 Creating network contacts...');
  const contactsData = [
    { userId: user.id, firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@google.com', company: 'Google', position: 'Engineering Manager', relationship: 'colleague', linkedinUrl: 'https://linkedin.com/in/sarahj', tags: ['referral', 'mentor'] },
    { userId: user.id, firstName: 'Michael', lastName: 'Chen', email: 'mchen@meta.com', company: 'Meta', position: 'Staff Engineer', relationship: 'colleague', linkedinUrl: 'https://linkedin.com/in/michaelchen', tags: ['referral'] },
    { userId: user.id, firstName: 'Emily', lastName: 'Davis', email: 'emily.d@stripe.com', company: 'Stripe', position: 'Senior Recruiter', relationship: 'recruiter', linkedinUrl: 'https://linkedin.com/in/emilyd', tags: ['recruiting'] },
    { userId: user.id, firstName: 'David', lastName: 'Kim', email: 'dkim@netflix.com', company: 'Netflix', position: 'Tech Lead', relationship: 'friend', linkedinUrl: 'https://linkedin.com/in/davidkim', tags: ['referral', 'friend'] },
    { userId: user.id, firstName: 'Jennifer', lastName: 'Lee', email: 'jlee@apple.com', company: 'Apple', position: 'Senior Software Engineer', relationship: 'colleague', linkedinUrl: 'https://linkedin.com/in/jenniferlee', tags: ['referral'] },
    { userId: user.id, firstName: 'Robert', lastName: 'Williams', email: 'rwilliams@amazon.com', company: 'Amazon', position: 'Principal Engineer', relationship: 'mentor', linkedinUrl: 'https://linkedin.com/in/robertw', tags: ['mentor', 'advisor'] },
    { userId: user.id, firstName: 'Lisa', lastName: 'Martinez', email: 'lisa.m@airbnb.com', company: 'Airbnb', position: 'Engineering Manager', relationship: 'colleague', linkedinUrl: 'https://linkedin.com/in/lisam', tags: ['referral'] },
    { userId: user.id, firstName: 'James', lastName: 'Brown', email: 'jbrown@spotify.com', company: 'Spotify', position: 'Data Engineer', relationship: 'friend', linkedinUrl: 'https://linkedin.com/in/jamesbrown', tags: ['friend'] },
    { userId: user.id, firstName: 'Amanda', lastName: 'Taylor', email: 'ataylor@uber.com', company: 'Uber', position: 'Staff Engineer', relationship: 'colleague', linkedinUrl: 'https://linkedin.com/in/amandat', tags: ['referral'] },
    { userId: user.id, firstName: 'Chris', lastName: 'Anderson', email: 'canderson@figma.com', company: 'Figma', position: 'Frontend Lead', relationship: 'friend', linkedinUrl: 'https://linkedin.com/in/chrisanderson', tags: ['referral', 'friend'] },
    { userId: user.id, firstName: 'Nicole', lastName: 'Garcia', email: 'ngarcia@openai.com', company: 'OpenAI', position: 'Research Engineer', relationship: 'colleague', linkedinUrl: 'https://linkedin.com/in/nicoleg', tags: ['referral'] },
    { userId: user.id, firstName: 'Mark', lastName: 'Wilson', email: 'mwilson@cloudflare.com', company: 'Cloudflare', position: 'Senior SRE', relationship: 'colleague', linkedinUrl: 'https://linkedin.com/in/markwilson', tags: ['referral'] },
    { userId: user.id, firstName: 'Rachel', lastName: 'Thompson', email: 'rthompson@recruiter.com', company: 'Tech Recruiting Inc', position: 'Senior Recruiter', relationship: 'recruiter', linkedinUrl: 'https://linkedin.com/in/rachelt', tags: ['recruiter'] },
    { userId: user.id, firstName: 'Kevin', lastName: 'Patel', email: 'kpatel@datadog.com', company: 'Datadog', position: 'Platform Engineer', relationship: 'friend', linkedinUrl: 'https://linkedin.com/in/kevinpatel', tags: ['friend', 'referral'] },
    { userId: user.id, firstName: 'Michelle', lastName: 'Liu', email: 'mliu@shopify.com', company: 'Shopify', position: 'Engineering Manager', relationship: 'mentor', linkedinUrl: 'https://linkedin.com/in/michellel', tags: ['mentor'] },
    { userId: user.id, firstName: 'Brian', lastName: 'Smith', email: 'bsmith@notion.so', company: 'Notion', position: 'Senior Engineer', relationship: 'colleague', linkedinUrl: 'https://linkedin.com/in/briansmith', tags: ['referral'] },
    { userId: user.id, firstName: 'Stephanie', lastName: 'Clark', email: 'sclark@coinbase.com', company: 'Coinbase', position: 'Security Engineer', relationship: 'colleague', linkedinUrl: 'https://linkedin.com/in/stephclark', tags: ['referral'] },
    { userId: user.id, firstName: 'Alex', lastName: 'Morgan', email: 'amorgan@linkedin.com', company: 'LinkedIn', position: 'Staff Engineer', relationship: 'friend', linkedinUrl: 'https://linkedin.com/in/alexmorgan', tags: ['friend', 'referral'] }
  ];

  const contacts = await Promise.all(
    contactsData.map(c => prisma.networkContact.create({ data: c }))
  );

  // Add some contact interactions
  console.log('📞 Creating contact interactions...');
  await Promise.all([
    prisma.contactInteraction.create({ data: { contactId: contacts[0].id, type: 'linkedin', notes: 'Reached out about referral', outcome: 'Positive response' } }),
    prisma.contactInteraction.create({ data: { contactId: contacts[1].id, type: 'email', notes: 'Asked about Meta culture' } }),
    prisma.contactInteraction.create({ data: { contactId: contacts[2].id, type: 'call', notes: 'Initial recruiter call', outcome: 'Scheduled technical screen' } }),
    prisma.contactInteraction.create({ data: { contactId: contacts[3].id, type: 'meeting', notes: 'Coffee chat about Netflix' } }),
    prisma.contactInteraction.create({ data: { contactId: contacts[5].id, type: 'call', notes: 'Mentorship session', outcome: 'Great career advice' } }),
  ]);

  // Create Resume Templates (8 templates)
  console.log('📋 Creating resume templates...');
  const templatesData = [
    { name: 'Professional Classic', category: 'professional', description: 'Clean, traditional format', isPremium: false, structure: { sections: ['summary', 'experience', 'education', 'skills'] } },
    { name: 'Modern Tech', category: 'modern', description: 'Contemporary design for tech roles', isPremium: false, structure: { sections: ['summary', 'skills', 'experience', 'projects', 'education'] } },
    { name: 'Creative Portfolio', category: 'creative', description: 'Stand out with creative flair', isPremium: true, structure: { sections: ['summary', 'portfolio', 'experience', 'skills'] } },
    { name: 'Executive Leadership', category: 'professional', description: 'For senior leadership roles', isPremium: true, structure: { sections: ['summary', 'experience', 'achievements', 'education'] } },
    { name: 'Simple Clean', category: 'simple', description: 'Minimalist and ATS-friendly', isPremium: false, structure: { sections: ['experience', 'education', 'skills'] } },
    { name: 'Startup Ready', category: 'modern', description: 'Perfect for startup applications', isPremium: false, structure: { sections: ['summary', 'skills', 'experience', 'projects'] } },
    { name: 'Academic CV', category: 'professional', description: 'For academic and research positions', isPremium: true, structure: { sections: ['summary', 'education', 'research', 'publications', 'experience'] } },
    { name: 'Designer Showcase', category: 'creative', description: 'Visual design-focused template', isPremium: true, structure: { sections: ['portfolio', 'summary', 'experience', 'skills'] } }
  ];

  await Promise.all(
    templatesData.map(t => prisma.resumeTemplate.create({ data: t }))
  );

  // Create Subscription Plans
  console.log('💳 Creating subscription plans...');
  const plansData = [
    {
      name: 'free',
      displayName: 'Free',
      price: 0,
      billingCycle: 'monthly',
      features: { resumes: 1, aiCredits: 5, jobAlerts: false, support: 'community' },
      resumeLimit: 1,
      aiCredits: 5,
      jobAlerts: false,
      prioritySupport: false
    },
    {
      name: 'basic',
      displayName: 'Basic',
      price: 9.99,
      billingCycle: 'monthly',
      features: { resumes: 3, aiCredits: 50, jobAlerts: true, support: 'email' },
      resumeLimit: 3,
      aiCredits: 50,
      jobAlerts: true,
      prioritySupport: false
    },
    {
      name: 'pro',
      displayName: 'Pro',
      price: 24.99,
      billingCycle: 'monthly',
      features: { resumes: 10, aiCredits: 200, jobAlerts: true, support: 'priority' },
      resumeLimit: 10,
      aiCredits: 200,
      jobAlerts: true,
      prioritySupport: true
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise',
      price: 49.99,
      billingCycle: 'monthly',
      features: { resumes: -1, aiCredits: -1, jobAlerts: true, support: '24/7' },
      resumeLimit: -1,
      aiCredits: -1,
      jobAlerts: true,
      prioritySupport: true
    }
  ];

  await Promise.all(
    plansData.map(p => prisma.subscriptionPlan.create({ data: p }))
  );

  // Create Activity Logs
  console.log('📊 Creating activity logs...');
  const activityData = [
    { userId: user.id, action: 'resume_created', entityType: 'resume', entityId: resumes[0].id },
    { userId: user.id, action: 'job_applied', entityType: 'application', entityId: applications[0].id },
    { userId: user.id, action: 'interview_scheduled', entityType: 'interview', entityId: interviews[0].id },
    { userId: user.id, action: 'cover_letter_ai_generated', entityType: 'coverLetter', entityId: coverLetters[0].id },
    { userId: user.id, action: 'job_saved', entityType: 'job', entityId: jobs[0].id },
    { userId: user.id, action: 'contact_added', entityType: 'contact', entityId: contacts[0].id },
    { userId: user.id, action: 'resume_optimized', entityType: 'resume', entityId: resumes[0].id },
    { userId: user.id, action: 'skill_added', entityType: 'skill' },
    { userId: user.id, action: 'application_updated', entityType: 'application', entityId: applications[4].id },
    { userId: user.id, action: 'company_researched', entityType: 'company' },
    { userId: user.id, action: 'salary_researched', entityType: 'salary' },
    { userId: user.id, action: 'interview_completed', entityType: 'interview', entityId: interviews[3].id },
    { userId: user.id, action: 'offer_received', entityType: 'application', entityId: applications[4].id },
  ];

  await Promise.all(
    activityData.map(a => prisma.activityLog.create({ data: a }))
  );

  // Create Application Timeline Events
  console.log('📅 Creating timeline events...');
  const timelineData = [
    { applicationId: applications[0].id, eventType: 'applied', description: 'Application submitted' },
    { applicationId: applications[0].id, eventType: 'screening', description: 'Passed initial screening' },
    { applicationId: applications[0].id, eventType: 'interview_scheduled', description: 'Phone interview scheduled' },
    { applicationId: applications[3].id, eventType: 'applied', description: 'Application submitted' },
    { applicationId: applications[3].id, eventType: 'interview_scheduled', description: 'Video interview scheduled' },
    { applicationId: applications[4].id, eventType: 'applied', description: 'Application submitted' },
    { applicationId: applications[4].id, eventType: 'interview_scheduled', description: 'Onsite scheduled' },
    { applicationId: applications[4].id, eventType: 'offer', description: 'Offer received!' },
  ];

  await Promise.all(
    timelineData.map(t => prisma.applicationTimeline.create({ data: t }))
  );

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📧 Demo User Credentials:');
  console.log('   Email: demo@example.com');
  console.log('   Password: demo123');
  console.log('');
  console.log('📊 Seed Summary:');
  console.log('   - 1 demo user');
  console.log('   - 20 skills');
  console.log('   - 20 jobs');
  console.log('   - 15 resumes');
  console.log('   - 15 cover letters');
  console.log('   - 18 job applications');
  console.log('   - 15 interviews');
  console.log('   - 20 interview prep questions');
  console.log('   - 20 salary research entries');
  console.log('   - 18 company profiles');
  console.log('   - 18 network contacts');
  console.log('   - 8 resume templates');
  console.log('   - 4 subscription plans');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
