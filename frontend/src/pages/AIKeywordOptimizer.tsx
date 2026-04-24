import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI, resumesAPI } from '../services/api';
import {
  Search,
  Loader2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  ArrowLeft,
  Sparkles,
  Lightbulb,
  Target,
  Zap,
  Database
} from 'lucide-react';

interface SuggestionItem {
  priority?: string;
  category?: string;
  issue?: string;
  recommendation?: string;
}

interface OptimizationResult {
  suggestions: (string | SuggestionItem)[];
  score: number;
  keywords: string[];
}

const AIKeywordOptimizer: React.FC = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await resumesAPI.getAll();
      setResumes(response.data);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedResumeId) return;
    setLoading(true);
    setResult(null);
    setMessage({ type: '', text: '' });

    try {
      const resume = resumes.find(r => r.id === selectedResumeId);
      const response = await aiAPI.optimizeResume(resume, jobDescription || undefined);
      setResult(response.data);
      setMessage({
        type: 'success',
        text: 'Optimization analysis complete! Results saved to database.'
      });
    } catch (error: any) {
      console.error('Failed to optimize:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to optimize. Check your OpenRouter API key.' });
    } finally {
      setLoading(false);
    }
  };

  const sampleJobDescriptions = [
    {
      label: 'Software Engineer',
      data: `We are looking for a Senior Software Engineer to join our team.

Requirements:
- 5+ years of experience in software development
- Strong proficiency in React, TypeScript, and Node.js
- Experience with cloud platforms (AWS, GCP, or Azure)
- Knowledge of microservices architecture
- Experience with CI/CD pipelines
- Strong problem-solving skills
- Excellent communication skills

Nice to have:
- Experience with Kubernetes and Docker
- Knowledge of GraphQL
- Experience with PostgreSQL
- Agile/Scrum experience`
    },
    {
      label: 'Data Scientist',
      data: `We are hiring a Data Scientist to join our analytics team.

Requirements:
- MS/PhD in Statistics, Computer Science, or related field
- 3+ years of experience in data science or machine learning
- Proficiency in Python, R, and SQL
- Experience with TensorFlow, PyTorch, or scikit-learn
- Strong knowledge of statistical modeling and A/B testing
- Experience with data visualization tools (Tableau, Matplotlib)

Nice to have:
- Experience with NLP or computer vision
- Knowledge of Apache Spark and big data tools
- Experience deploying ML models to production
- Published research in relevant fields`
    },
    {
      label: 'Product Manager',
      data: `Seeking an experienced Product Manager to lead our platform team.

Requirements:
- 5+ years of product management experience in SaaS/B2B
- Proven track record of launching successful products
- Strong analytical skills with experience in A/B testing and metrics
- Excellent stakeholder management and communication skills
- Experience with Agile methodologies and tools (Jira, Confluence)
- Ability to write clear PRDs and user stories

Nice to have:
- Technical background or CS degree
- Experience with API products or developer tools
- Knowledge of UX research methodologies
- MBA or equivalent business experience`
    },
    {
      label: 'DevOps Engineer',
      data: `We are looking for a DevOps Engineer to strengthen our infrastructure team.

Requirements:
- 4+ years of DevOps/SRE experience
- Expert-level knowledge of AWS or GCP services
- Strong experience with Kubernetes, Docker, and Terraform
- Proficiency in CI/CD tools (Jenkins, GitHub Actions, GitLab CI)
- Experience with monitoring tools (Prometheus, Grafana, Datadog)
- Strong Linux administration and scripting (Bash, Python)

Nice to have:
- AWS/GCP professional certifications
- Experience with service mesh (Istio, Linkerd)
- Knowledge of security best practices and compliance
- Experience with database administration (PostgreSQL, Redis)`
    }
  ];

  const loadSampleJobDescription = (index: number) => {
    setJobDescription(sampleJobDescriptions[index].data);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Search className="w-7 h-7 mr-3 text-purple-600" />
            AI Keyword Optimizer
          </h1>
          <p className="text-gray-500">Optimize your resume with ATS-friendly keywords</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Input Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-4">Analyze Your Resume</h2>

        <div className="space-y-4">
          {/* Resume Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Select Resume to Optimize
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="input-field"
            >
              <option value="">Select a resume...</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.title} {resume.atsScore ? `(Current ATS: ${resume.atsScore})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Job Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <Target className="w-4 h-4 inline mr-2" />
                Target Job Description (Optional)
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Samples:</span>
                {sampleJobDescriptions.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => loadSampleJobDescription(i)}
                    className="text-xs px-2 py-1 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here for more targeted keyword suggestions..."
              className="input-field min-h-[150px]"
            />
          </div>

          <button
            onClick={handleOptimize}
            disabled={!selectedResumeId || loading}
            className="btn-primary flex items-center justify-center w-full md:w-auto"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Optimize Keywords
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Saved Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm w-fit">
            <Database className="w-4 h-4" />
            <span>Results saved to database</span>
            <CheckCircle className="w-4 h-4" />
          </div>

          {/* ATS Score Card */}
          <div className={`bg-gradient-to-r ${getScoreGradient(result.score)} rounded-xl p-8 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">ATS Compatibility Score</h2>
                <p className="text-white/80">How well your resume will perform with ATS systems</p>
              </div>
              <div className="text-right">
                <div className="text-6xl font-bold">{result.score}%</div>
                <p className="text-white/80">
                  {result.score >= 80 ? 'Excellent!' :
                   result.score >= 60 ? 'Good' : 'Needs Work'}
                </p>
              </div>
            </div>
          </div>

          {/* Keywords to Add */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center text-purple-700">
              <Zap className="w-5 h-5 mr-2" />
              Recommended Keywords ({result.keywords.length})
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Add these keywords to your resume to improve ATS compatibility
            </p>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium border border-purple-200 hover:bg-purple-200 cursor-pointer transition-colors"
                >
                  {keyword}
                </span>
              ))}
              {result.keywords.length === 0 && (
                <p className="text-gray-500 italic">No additional keywords recommended</p>
              )}
            </div>
          </div>

          {/* Improvement Suggestions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center text-amber-700">
              <Lightbulb className="w-5 h-5 mr-2" />
              Improvement Suggestions ({result.suggestions.length})
            </h3>
            <div className="space-y-3">
              {result.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-amber-700 font-semibold text-sm">{index + 1}</span>
                  </div>
                  {typeof suggestion === 'string' ? (
                    <p className="text-gray-700">{suggestion}</p>
                  ) : (
                    <div className="text-gray-700">
                      {suggestion.category && (
                        <span className="text-xs font-semibold uppercase text-amber-600 mr-2">{suggestion.category}</span>
                      )}
                      {suggestion.priority && (
                        <span className="text-xs font-medium text-gray-500">[{suggestion.priority}]</span>
                      )}
                      {suggestion.issue && <p className="font-medium mt-1">{suggestion.issue}</p>}
                      {suggestion.recommendation && <p className="text-sm mt-1">{suggestion.recommendation}</p>}
                    </div>
                  )}
                </div>
              ))}
              {result.suggestions.length === 0 && (
                <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <p className="text-green-700">Your resume looks great! No major improvements needed.</p>
                </div>
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold mb-4 flex items-center text-blue-700">
              <TrendingUp className="w-5 h-5 mr-2" />
              Pro Tips for ATS Optimization
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <p className="text-sm text-gray-700">Use standard section headings like "Experience" and "Education"</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <p className="text-sm text-gray-700">Include exact keywords from the job description</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <p className="text-sm text-gray-700">Use both acronyms and full terms (e.g., "AWS (Amazon Web Services)")</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <p className="text-sm text-gray-700">Avoid tables, graphics, and complex formatting</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/resumes')}
              className="btn-primary flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Edit Resume
            </button>
            <button
              onClick={() => { setResult(null); setJobDescription(''); }}
              className="btn-secondary flex items-center"
            >
              <Search className="w-4 h-4 mr-2" />
              New Analysis
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Optimize for Success</h3>
          <p className="text-gray-500">Select a resume and optionally paste a job description for targeted keyword optimization</p>
        </div>
      )}
    </div>
  );
};

export default AIKeywordOptimizer;
