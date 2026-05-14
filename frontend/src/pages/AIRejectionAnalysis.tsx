import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Sparkles, Loader2, AlertTriangle, RefreshCw, Lightbulb, CheckCircle } from 'lucide-react';

interface RejectionAnalysis {
  likelyReasons?: string[];
  improvementPlan?: string[];
  reapplyRecommendation?: string;
  reapplyTimingMonths?: number;
  summary?: string;
  resumeFixes?: string[];
  interviewFixes?: string[];
  alternativeRoles?: string[];
  [k: string]: any;
}

const AIRejectionAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [stageReachedAt, setStageReachedAt] = useState('initial_screening');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RejectionAnalysis | null>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !resumeText.trim()) {
      setError('Job title and resume text are required.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/rejection-analysis', {
        jobTitle,
        companyName,
        jobDescription,
        resumeText,
        rejectionFeedback,
        stageReachedAt,
      });
      const data = res.data?.analysis || res.data;
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <RefreshCw className="text-orange-500" /> Rejection Analysis
        </h1>
        <p className="text-gray-500 mt-2">Decode why an application was rejected and get a concrete improvement plan.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Job title *</label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company name</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stage reached at</label>
          <select
            value={stageReachedAt}
            onChange={(e) => setStageReachedAt(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="application">Application (no response)</option>
            <option value="initial_screening">Initial screening</option>
            <option value="phone_screen">Phone screen</option>
            <option value="technical_interview">Technical interview</option>
            <option value="onsite">Onsite</option>
            <option value="final_round">Final round</option>
            <option value="offer_rescinded">Offer rescinded</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Job description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={5}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Resume text *</label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={6}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rejection feedback (if any)</label>
          <textarea
            value={rejectionFeedback}
            onChange={(e) => setRejectionFeedback(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="e.g. 'We chose a candidate with more cloud experience.'"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {loading ? 'Analyzing...' : 'Analyze Rejection'}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-xl shadow border p-6 space-y-5">
          {result.summary && <p className="text-gray-700">{result.summary}</p>}

          {Array.isArray(result.likelyReasons) && result.likelyReasons.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-orange-700">
                <AlertTriangle size={16} /> Likely Reasons
              </h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {result.likelyReasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {Array.isArray(result.improvementPlan) && result.improvementPlan.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-700">
                <Lightbulb size={16} /> Improvement Plan
              </h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {result.improvementPlan.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {Array.isArray(result.resumeFixes) && result.resumeFixes.length > 0 && (
            <ListSection title="Resume Fixes" items={result.resumeFixes} />
          )}
          {Array.isArray(result.interviewFixes) && result.interviewFixes.length > 0 && (
            <ListSection title="Interview Fixes" items={result.interviewFixes} />
          )}
          {Array.isArray(result.alternativeRoles) && result.alternativeRoles.length > 0 && (
            <ListSection title="Alternative Roles to Target" items={result.alternativeRoles} />
          )}

          {(result.reapplyRecommendation || result.reapplyTimingMonths != null) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="text-green-600 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-green-800">Reapply Recommendation</p>
                {result.reapplyRecommendation && <p className="text-sm text-gray-700">{result.reapplyRecommendation}</p>}
                {result.reapplyTimingMonths != null && (
                  <p className="text-xs text-gray-500 mt-1">Suggested timing: {result.reapplyTimingMonths} months</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ListSection: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
      {items.map((it, i) => <li key={i}>{typeof it === 'string' ? it : JSON.stringify(it)}</li>)}
    </ul>
  </div>
);

export default AIRejectionAnalysis;
