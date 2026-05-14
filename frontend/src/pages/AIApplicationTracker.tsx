import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Sparkles, Loader2, AlertTriangle, ListChecks, Inbox, Activity } from 'lucide-react';

interface TrackerResult {
  pipeline_summary?: { total?: number; by_stage?: Record<string, number>; by_status?: Record<string, number>; stale_count?: number };
  per_application?: Array<{
    job_id?: string | number;
    company?: string;
    role?: string;
    stage?: string;
    health?: string;
    last_activity?: string;
    days_in_stage?: number;
    next_action?: string;
    suggested_followup_message?: string;
  }>;
  priority_actions?: Array<{ action: string; reason?: string; priority?: string; due_in_days?: number }>;
  pipeline_recommendations?: string[];
  summary?: string;
  [k: string]: any;
}

const AIApplicationTracker: React.FC = () => {
  const navigate = useNavigate();
  const [applicationsJson, setApplicationsJson] = useState('');
  const [focusJobIds, setFocusJobIds] = useState('');
  const [candidateProfile, setCandidateProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TrackerResult | null>(null);

  // Try to prefill applications from /applications API
  useEffect(() => {
    let alive = true;
    api.get('/applications')
      .then((res) => {
        if (!alive) return;
        const apps = res.data?.applications || res.data || [];
        if (Array.isArray(apps) && apps.length > 0 && !applicationsJson) {
          setApplicationsJson(JSON.stringify(apps.slice(0, 25), null, 2));
        }
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseJson = (s: string, fallback: any = undefined) => {
    if (!s.trim()) return fallback;
    try { return JSON.parse(s); } catch { return fallback; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const applications = parseJson(applicationsJson);
    if (!Array.isArray(applications) || applications.length === 0) {
      setError('Applications must be a non-empty JSON array.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/application-tracker', {
        applications,
        focusJobIds: focusJobIds ? focusJobIds.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        candidateProfile: parseJson(candidateProfile, undefined),
      });
      setResult(res.data?.tracker || res.data);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message || 'Tracker request failed';
      if (status === 503) {
        setError('AI service unavailable: OPENROUTER_API_KEY not configured on server.');
      } else {
        setError(msg);
      }
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
          <ListChecks className="text-emerald-600" /> Application Tracker
        </h1>
        <p className="text-gray-500 mt-2">Score your application pipeline and get prioritized next steps.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Applications (JSON array) *</label>
          <textarea
            value={applicationsJson}
            onChange={(e) => setApplicationsJson(e.target.value)}
            rows={10}
            className="w-full border rounded-lg px-3 py-2 font-mono text-xs"
            placeholder='[{ "id": 1, "company": "...", "role": "...", "stage": "...", "applied_at": "...", "last_activity": "..." }]'
            required
          />
          <p className="text-xs text-gray-500 mt-1">Auto-filled from your /applications API when available.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Focus job IDs (comma-separated)</label>
            <input
              value={focusJobIds}
              onChange={(e) => setFocusJobIds(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. 12, 45, 78"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Candidate profile (JSON, optional)</label>
            <input
              value={candidateProfile}
              onChange={(e) => setCandidateProfile(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 font-mono text-xs"
              placeholder='{"yearsExperience": 6, "targetRole": "Sr. PM"}'
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {loading ? 'Analyzing pipeline...' : 'Analyze Pipeline'}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-xl shadow border p-6 space-y-5">
          {result.summary && <p className="text-gray-700">{result.summary}</p>}

          {result.pipeline_summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Total" value={result.pipeline_summary.total ?? '—'} />
              <Stat label="Stale" value={result.pipeline_summary.stale_count ?? '—'} />
              <Stat label="Stages" value={Object.keys(result.pipeline_summary.by_stage || {}).length} />
              <Stat label="Statuses" value={Object.keys(result.pipeline_summary.by_status || {}).length} />
            </div>
          )}

          {Array.isArray(result.priority_actions) && result.priority_actions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-emerald-700">
                <Activity size={16} /> Priority Actions
              </h3>
              <ul className="space-y-2">
                {result.priority_actions.map((a, i) => (
                  <li key={i} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{a.action}</span>
                      <span className="text-xs uppercase text-gray-500">{a.priority}</span>
                    </div>
                    {a.reason && <p className="text-gray-600 mt-1">{a.reason}</p>}
                    {a.due_in_days != null && <p className="text-xs text-gray-500 mt-1">Due in ~{a.due_in_days} days</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(result.per_application) && result.per_application.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-700">
                <Inbox size={16} /> Per-application Status
              </h3>
              <div className="space-y-2">
                {result.per_application.map((p, i) => (
                  <div key={i} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.company} — {p.role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${p.health === 'red' ? 'bg-red-100 text-red-700' : p.health === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {p.health || 'unknown'}
                      </span>
                    </div>
                    {p.next_action && <p className="text-gray-700 mt-1"><span className="font-medium">Next:</span> {p.next_action}</p>}
                    {p.suggested_followup_message && (
                      <pre className="bg-gray-50 border border-gray-200 rounded p-2 mt-2 text-xs whitespace-pre-wrap">{p.suggested_followup_message}</pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(result.pipeline_recommendations) && result.pipeline_recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Pipeline Recommendations</h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {result.pipeline_recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="border rounded-lg p-3">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-xl font-semibold">{value}</div>
  </div>
);

export default AIApplicationTracker;
