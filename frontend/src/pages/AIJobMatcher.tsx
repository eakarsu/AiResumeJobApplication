import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI, resumesAPI, jobsAPI } from '../services/api';
import {
  Target,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  Briefcase,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Database
} from 'lucide-react';

interface MatchResult {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  missingSkills: string[];
  matchingSkills: string[];
  reasoning: string;
}

const AIJobMatcher: React.FC = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resumesRes, jobsRes] = await Promise.all([
        resumesAPI.getAll(),
        jobsAPI.getAll({ limit: 50 })
      ]);
      setResumes(resumesRes.data);
      setJobs(jobsRes.data.jobs || jobsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedResumeId || !selectedJobId) return;
    setLoading(true);
    setMatchResult(null);
    setMessage({ type: '', text: '' });

    try {
      const resume = resumes.find(r => r.id === selectedResumeId);
      const job = jobs.find(j => j.id === selectedJobId);

      const response = await aiAPI.analyzeJobMatch(resume, job);
      setMatchResult(response.data);
      setMessage({
        type: 'success',
        text: 'Match analysis complete! Results saved to database.'
      });
    } catch (error: any) {
      console.error('Failed to analyze match:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to analyze. Check your OpenRouter API key.' });
    } finally {
      setLoading(false);
    }
  };

  const samplePairings = [
    { label: 'Resume 1 + Job 1', resumeIdx: 0, jobIdx: 0 },
    { label: 'Resume 1 + Job 2', resumeIdx: 0, jobIdx: 1 },
    { label: 'Resume 1 + Job 3', resumeIdx: 0, jobIdx: 2 },
    { label: 'Resume 2 + Job 1', resumeIdx: 1, jobIdx: 0 },
  ];

  const loadSamplePairing = (resumeIdx: number, jobIdx: number) => {
    if (resumes[resumeIdx]) setSelectedResumeId(resumes[resumeIdx].id);
    if (jobs[jobIdx]) setSelectedJobId(jobs[jobIdx].id);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
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
            <Target className="w-7 h-7 mr-3 text-primary-600" />
            AI Job Matcher
          </h1>
          <p className="text-gray-500">Analyze how well your resume matches a job posting</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Selection Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Select Resume & Job to Match</h2>
          {resumes.length > 0 && jobs.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Quick select:</span>
              {samplePairings.map((pairing, i) => {
                const hasResume = !!resumes[pairing.resumeIdx];
                const hasJob = !!jobs[pairing.jobIdx];
                if (!hasResume || !hasJob) return null;
                const resumeName = resumes[pairing.resumeIdx]?.title?.slice(0, 15) || `Resume ${pairing.resumeIdx + 1}`;
                const jobName = jobs[pairing.jobIdx]?.title?.slice(0, 15) || `Job ${pairing.jobIdx + 1}`;
                return (
                  <button
                    key={i}
                    onClick={() => loadSamplePairing(pairing.resumeIdx, pairing.jobIdx)}
                    className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
                    title={`${resumes[pairing.resumeIdx]?.title} + ${jobs[pairing.jobIdx]?.title} at ${jobs[pairing.jobIdx]?.company}`}
                  >
                    {resumeName} + {jobName}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Resume Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Your Resume
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="input-field"
            >
              <option value="">Select a resume...</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.title} {resume.atsScore ? `(ATS: ${resume.atsScore})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Job Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-2" />
              Target Job
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="input-field"
            >
              <option value="">Select a job...</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} at {job.company}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!selectedResumeId || !selectedJobId || loading}
          className="btn-primary mt-6 flex items-center justify-center w-full md:w-auto"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Analyze Match
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {matchResult && (
        <div className="space-y-6">
          {/* Saved Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm w-fit">
            <Database className="w-4 h-4" />
            <span>Results saved to database</span>
            <CheckCircle className="w-4 h-4" />
          </div>

          {/* Overall Score Card */}
          <div className={`bg-gradient-to-r ${getScoreGradient(matchResult.overallScore)} rounded-xl p-8 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Overall Match Score</h2>
                <p className="text-white/80">How well you match this position</p>
              </div>
              <div className="text-right">
                <div className="text-6xl font-bold">{matchResult.overallScore}%</div>
                <p className="text-white/80">
                  {matchResult.overallScore >= 80 ? 'Excellent Match!' :
                   matchResult.overallScore >= 60 ? 'Good Match' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-700">Skills Match</h3>
                <span className={`text-2xl font-bold ${getScoreColor(matchResult.skillsMatch)}`}>
                  {matchResult.skillsMatch}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${getScoreBgColor(matchResult.skillsMatch).replace('bg-', 'bg-gradient-to-r from-').replace('-100', '-500')} to-${getScoreBgColor(matchResult.skillsMatch).includes('green') ? 'emerald' : getScoreBgColor(matchResult.skillsMatch).includes('yellow') ? 'orange' : 'rose'}-500`}
                  style={{ width: `${matchResult.skillsMatch}%`, background: matchResult.skillsMatch >= 80 ? 'linear-gradient(to right, #22c55e, #10b981)' : matchResult.skillsMatch >= 60 ? 'linear-gradient(to right, #eab308, #f97316)' : 'linear-gradient(to right, #ef4444, #f43f5e)' }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-700">Experience Match</h3>
                <span className={`text-2xl font-bold ${getScoreColor(matchResult.experienceMatch)}`}>
                  {matchResult.experienceMatch}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full"
                  style={{ width: `${matchResult.experienceMatch}%`, background: matchResult.experienceMatch >= 80 ? 'linear-gradient(to right, #22c55e, #10b981)' : matchResult.experienceMatch >= 60 ? 'linear-gradient(to right, #eab308, #f97316)' : 'linear-gradient(to right, #ef4444, #f43f5e)' }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-700">Education Match</h3>
                <span className={`text-2xl font-bold ${getScoreColor(matchResult.educationMatch)}`}>
                  {matchResult.educationMatch}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full"
                  style={{ width: `${matchResult.educationMatch}%`, background: matchResult.educationMatch >= 80 ? 'linear-gradient(to right, #22c55e, #10b981)' : matchResult.educationMatch >= 60 ? 'linear-gradient(to right, #eab308, #f97316)' : 'linear-gradient(to right, #ef4444, #f43f5e)' }}
                />
              </div>
            </div>
          </div>

          {/* Skills Analysis */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Matching Skills */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold mb-4 flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                Matching Skills ({matchResult.matchingSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {matchResult.matchingSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {matchResult.matchingSkills.length === 0 && (
                  <p className="text-gray-500 italic">No matching skills identified</p>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold mb-4 flex items-center text-red-700">
                <XCircle className="w-5 h-5 mr-2" />
                Missing Skills ({matchResult.missingSkills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {matchResult.missingSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {matchResult.missingSkills.length === 0 && (
                  <p className="text-gray-500 italic">No missing skills - great match!</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
              AI Analysis & Recommendations
            </h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{matchResult.reasoning}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/resumes')}
              className="btn-secondary flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Update Resume
            </button>
            <button
              onClick={() => navigate(`/jobs/${selectedJobId}`)}
              className="btn-primary flex items-center"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              View Job Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!matchResult && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to find your match?</h3>
          <p className="text-gray-500">Select a resume and job posting to see how well you match</p>
        </div>
      )}
    </div>
  );
};

export default AIJobMatcher;
