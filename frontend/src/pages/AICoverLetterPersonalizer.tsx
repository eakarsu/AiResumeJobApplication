import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI, resumesAPI, coverLettersAPI } from '../services/api';
import {
  Mail,
  Loader2,
  Copy,
  Download,
  Save,
  ArrowLeft,
  Sparkles,
  Building2,
  Briefcase,
  User,
  FileText,
  CheckCircle,
  Database
} from 'lucide-react';

const AICoverLetterPersonalizer: React.FC = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [generatedContent, setGeneratedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const samplePresets = [
    {
      label: 'Frontend @ Google',
      jobTitle: 'Senior Frontend Developer',
      company: 'Google',
      tone: 'professional',
      jobDescription: `We are looking for a Senior Frontend Developer to join our team.

You will work on building next-generation web applications using React and TypeScript.
Strong communication skills and experience with large-scale applications required.
Experience with performance optimization and accessibility is a plus.`
    },
    {
      label: 'PM @ Stripe',
      jobTitle: 'Product Manager',
      company: 'Stripe',
      tone: 'professional',
      jobDescription: `We're looking for a Product Manager to drive the future of payments infrastructure.

You'll own the roadmap for our developer APIs, work cross-functionally with engineering and design, and shape how millions of businesses accept payments. Experience with fintech, developer tools, and platform products is highly valued.`
    },
    {
      label: 'Designer @ Airbnb',
      jobTitle: 'Senior UX Designer',
      company: 'Airbnb',
      tone: 'creative',
      jobDescription: `Join our design team to create world-class travel experiences.

You'll lead end-to-end design for host and guest features, conduct user research, create prototypes, and collaborate with engineers. We value systems thinking, storytelling, and a portfolio that demonstrates both craft and impact.`
    },
    {
      label: 'Data @ Netflix',
      jobTitle: 'Data Engineer',
      company: 'Netflix',
      tone: 'friendly',
      jobDescription: `Netflix is looking for a Data Engineer to build the data infrastructure powering content recommendations.

You'll design and optimize large-scale data pipelines, work with petabytes of streaming data, and enable real-time analytics. Experience with Spark, Kafka, and cloud-native architectures required.`
    }
  ];

  const loadSamplePreset = (index: number) => {
    const preset = samplePresets[index];
    setJobTitle(preset.jobTitle);
    setCompany(preset.company);
    setJobDescription(preset.jobDescription);
    setTone(preset.tone);
  };

  const handleGenerate = async () => {
    if (!jobTitle || !company) return;
    setLoading(true);
    setGeneratedContent('');
    setMessage({ type: '', text: '' });

    try {
      const resume = selectedResumeId ? resumes.find(r => r.id === selectedResumeId) : undefined;
      const response = await aiAPI.generateCoverLetter({
        jobTitle,
        company,
        jobDescription: jobDescription || undefined,
        resume,
        tone
      });
      setGeneratedContent(response.data.content);
      const saved = response.data.coverLetterId;
      setMessage({
        type: 'success',
        text: saved
          ? 'Cover letter generated and saved to database!'
          : 'Cover letter generated! (Could not save to database)'
      });
    } catch (error: any) {
      console.error('Failed to generate:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to generate. Check your OpenRouter API key.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await coverLettersAPI.create({
        title: `Cover Letter - ${jobTitle} at ${company}`,
        content: generatedContent,
        targetCompany: company,
        targetPosition: jobTitle,
        tone,
        isAiGenerated: true
      });
      setMessage({ type: 'success', text: 'Cover letter saved successfully!' });
    } catch (error: any) {
      console.error('Failed to save:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save cover letter' });
    } finally {
      setSaving(false);
    }
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
            <Mail className="w-7 h-7 mr-3 text-indigo-600" />
            AI Cover Letter Personalizer
          </h1>
          <p className="text-gray-500">Generate personalized cover letters tailored to each job</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Job Details</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Samples:</span>
                {samplePresets.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => loadSamplePreset(i)}
                    className="text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Job Title *
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="input-field"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Company *
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Google"
                  className="input-field"
                />
              </div>

              {/* Resume */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Your Resume (Optional - for personalization)
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select a resume...</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['professional', 'creative', 'friendly'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                        tone === t
                          ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description (Optional)
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description for more targeted content..."
                  className="input-field min-h-[120px]"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!jobTitle || !company || loading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Cover Letter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="space-y-6">
          {generatedContent ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-200 text-green-700 text-sm">
                <Database className="w-4 h-4" />
                <span>Auto-saved to database</span>
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Generated Cover Letter</h3>
                    <p className="text-sm text-white/80">{jobTitle} at {company}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="Save cover letter"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 font-serif">
                    {generatedContent.split('\n').map((paragraph, index) => (
                      <p key={index} className={`${paragraph ? 'mb-4' : 'mb-2'} text-gray-800 leading-relaxed`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleCopy}
                    className="btn-secondary flex items-center"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save to Library
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center h-full flex flex-col items-center justify-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your Cover Letter Will Appear Here</h3>
              <p className="text-gray-500">Fill in the job details and click generate</p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <h3 className="font-semibold mb-3 text-indigo-700">Tips for Great Cover Letters</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-indigo-600 mr-2 mt-0.5" />
                Customize the opening to mention something specific about the company
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-indigo-600 mr-2 mt-0.5" />
                Highlight achievements that match the job requirements
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-indigo-600 mr-2 mt-0.5" />
                Keep it concise - aim for 3-4 paragraphs
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-indigo-600 mr-2 mt-0.5" />
                End with a clear call to action
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoverLetterPersonalizer;
