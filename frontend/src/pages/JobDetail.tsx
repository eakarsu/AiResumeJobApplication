import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI, applicationsAPI, resumesAPI } from '../services/api';
import { Job, Resume } from '../types';
import { ArrowLeft, MapPin, DollarSign, Building2, Bookmark, BookmarkCheck, Clock, Briefcase, Sparkles, Loader2 } from 'lucide-react';

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [matchAnalysis, setMatchAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [jobRes, resumesRes] = await Promise.all([
        jobsAPI.getOne(id!),
        resumesAPI.getAll()
      ]);
      setJob(jobRes.data);
      setResumes(resumesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!job) return;
    try {
      if (job.isSaved) {
        await jobsAPI.unsave(job.id);
      } else {
        await jobsAPI.save(job.id);
      }
      setJob({ ...job, isSaved: !job.isSaved });
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const handleApply = async () => {
    if (!job || !selectedResumeId) return;
    try {
      const response = await applicationsAPI.create({
        jobId: job.id,
        resumeId: selectedResumeId,
        companyName: job.company,
        position: job.title,
        location: job.location,
        status: 'applied'
      });
      setShowApplyModal(false);
      navigate(`/applications/${response.data.id}`);
    } catch (error) {
      console.error('Failed to apply:', error);
    }
  };

  const handleAnalyzeMatch = async () => {
    if (!selectedResumeId) return;
    setAnalyzing(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await jobsAPI.analyzeMatch(id!, selectedResumeId);
      setMatchAnalysis(response.data);
      setMessage({ type: 'success', text: 'Match analysis complete!' });
    } catch (error: any) {
      console.error('Failed to analyze match:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to analyze match. Check your OpenRouter API key.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    const format = (n: number) => `$${(n / 1000).toFixed(0)}k`;
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `From ${format(min)}`;
    if (max) return `Up to ${format(max)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!job) {
    return <div className="text-center py-12">Job not found</div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/jobs')} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Jobs
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt={job.company} className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  <p className="text-lg text-gray-600">{job.company}</p>
                </div>
              </div>
              <button
                onClick={handleSave}
                className={`p-3 rounded-lg ${job.isSaved ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                {job.isSaved ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
              </button>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <span className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-2" />
                {job.location}
              </span>
              <span className="px-3 py-1 bg-gray-100 rounded-full capitalize">{job.locationType}</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full capitalize">{job.employmentType}</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full capitalize">{job.experienceLevel}</span>
              {formatSalary(job.salaryMin, job.salaryMax) && (
                <span className="flex items-center text-green-600 font-medium">
                  <DollarSign className="w-5 h-5 mr-1" />
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </span>
              )}
            </div>

            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-line">{job.description}</p>

              {job.requirements.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mt-6 mb-2">Requirements</h3>
                  <ul className="list-disc pl-5 text-gray-600">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </>
              )}

              {job.benefits.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold mt-6 mb-2">Benefits</h3>
                  <ul className="list-disc pl-5 text-gray-600">
                    {job.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <button onClick={() => setShowApplyModal(true)} className="btn-primary w-full mb-3">
              Apply Now
            </button>
            <button onClick={() => setShowMatchModal(true)} className="btn-secondary w-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 mr-2" />
              Analyze Job Match
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Job Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Industry</span>
                <span className="text-gray-900">{job.industry || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Posted</span>
                <span className="text-gray-900">{new Date(job.postedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Apply to {job.company}</h2>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="input-field mb-4"
            >
              <option value="">Select a resume</option>
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
            <div className="flex space-x-3">
              <button onClick={() => setShowApplyModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleApply} disabled={!selectedResumeId} className="btn-primary flex-1">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Match Analysis Modal */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">AI Job Match Analysis</h2>
            {message.text && (
              <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            {!matchAnalysis ? (
              <>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="input-field mb-4"
                >
                  <option value="">Select a resume to analyze</option>
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
                <div className="flex space-x-3">
                  <button onClick={() => { setShowMatchModal(false); setMessage({ type: '', text: '' }); }} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleAnalyzeMatch} disabled={!selectedResumeId || analyzing} className="btn-primary flex-1 flex items-center justify-center">
                    {analyzing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Analyze
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-primary-600">{matchAnalysis.overallScore}%</div>
                  <p className="text-gray-500">Overall Match Score</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-semibold">{matchAnalysis.skillsMatch}%</div>
                    <p className="text-sm text-gray-500">Skills</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-semibold">{matchAnalysis.experienceMatch}%</div>
                    <p className="text-sm text-gray-500">Experience</p>
                  </div>
                </div>
                {matchAnalysis.missingSkills?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {matchAnalysis.missingSkills.map((skill: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => setShowMatchModal(false)} className="btn-primary w-full">Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
