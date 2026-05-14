import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Sparkles, Loader2, AlertTriangle, CalendarClock, Star, AlertCircle, MessageSquare } from 'lucide-react';

interface SchedulingResult {
  ranked_slots?: Array<{ start: string; end: string; timezone?: string; score?: number; reasoning?: string; risk_flags?: string[] }>;
  top_recommendation?: { start: string; end: string; reasoning?: string };
  conflicts?: string[];
  suggestions_for_candidate?: Array<{ action: string; why?: string }>;
  message_to_recruiter?: string;
  summary?: string;
  [k: string]: any;
}

const AIInterviewSchedulingOptimizer: React.FC = () => {
  const navigate = useNavigate();
  const [candidateAvailability, setCandidateAvailability] = useState('');
  const [recruiterAvailability, setRecruiterAvailability] = useState('');
  const [interviewType, setInterviewType] = useState('technical');
  const [duration, setDuration] = useState(60);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [priorities, setPriorities] = useState('energy_peak, prep_buffer, morning_freshness');
  const [constraints, setConstraints] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SchedulingResult | null>(null);

  const parseSlots = (s: string): any => {
    if (!s.trim()) return undefined;
    try { return JSON.parse(s); } catch { return s; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateAvailability.trim() || !recruiterAvailability.trim()) {
      setError('Both candidate and recruiter availability are required.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/interview-scheduling-optimizer', {
        candidateAvailability: parseSlots(candidateAvailability),
        recruiterAvailability: parseSlots(recruiterAvailability),
        interviewType,
        durationMinutes: Number(duration) || 60,
        timezone,
        priorities: priorities.split(',').map(s => s.trim()).filter(Boolean),
        constraints: constraints ? (() => { try { return JSON.parse(constraints); } catch { return { notes: constraints }; } })() : undefined,
      });
      setResult(res.data?.scheduling || res.data);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message || 'Scheduling request failed';
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
          <CalendarClock className="text-indigo-600" /> Interview Scheduling Optimizer
        </h1>
        <p className="text-gray-500 mt-2">Rank slots based on energy, prep buffer, and recruiter constraints.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Candidate availability *</label>
            <textarea
              value={candidateAvailability}
              onChange={(e) => setCandidateAvailability(e.target.value)}
              rows={6}
              className="w-full border rounded-lg px-3 py-2 font-mono text-xs"
              placeholder='[{"start":"2026-05-12T09:00","end":"2026-05-12T11:00"}, ...]'
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recruiter availability *</label>
            <textarea
              value={recruiterAvailability}
              onChange={(e) => setRecruiterAvailability(e.target.value)}
              rows={6}
              className="w-full border rounded-lg px-3 py-2 font-mono text-xs"
              placeholder='[{"start":"2026-05-12T10:00","end":"2026-05-12T12:00"}, ...]'
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Interview type</label>
            <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="phone_screen">Phone screen</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="system_design">System design</option>
              <option value="onsite">Onsite</option>
              <option value="final">Final round</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <input
              type="number"
              min={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Timezone</label>
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priorities (comma-separated)</label>
          <input
            value={priorities}
            onChange={(e) => setPriorities(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Constraints (optional)</label>
          <textarea
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            rows={2}
            className="w-full border rounded-lg px-3 py-2"
            placeholder='Free-form notes or JSON, e.g. {"avoidLateNights":true}'
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
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {loading ? 'Optimizing...' : 'Optimize Schedule'}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-xl shadow border p-6 space-y-5">
          {result.summary && <p className="text-gray-700">{result.summary}</p>}

          {result.top_recommendation && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <h3 className="font-semibold mb-1 flex items-center gap-2 text-indigo-700">
                <Star size={16} /> Top Recommendation
              </h3>
              <p className="text-sm">
                <span className="font-mono">{result.top_recommendation.start}</span> →{' '}
                <span className="font-mono">{result.top_recommendation.end}</span>
              </p>
              {result.top_recommendation.reasoning && (
                <p className="text-sm text-gray-700 mt-1">{result.top_recommendation.reasoning}</p>
              )}
            </div>
          )}

          {Array.isArray(result.ranked_slots) && result.ranked_slots.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Ranked Slots</h3>
              <ul className="space-y-2">
                {result.ranked_slots.map((s, i) => (
                  <li key={i} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{s.start} → {s.end}</span>
                      {s.score != null && <span className="text-xs uppercase text-gray-500">Score {s.score}</span>}
                    </div>
                    {s.reasoning && <p className="text-gray-700 mt-1">{s.reasoning}</p>}
                    {Array.isArray(s.risk_flags) && s.risk_flags.length > 0 && (
                      <p className="text-xs text-orange-700 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {s.risk_flags.join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(result.suggestions_for_candidate) && result.suggestions_for_candidate.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Suggestions</h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {result.suggestions_for_candidate.map((s, i) => (
                  <li key={i}>{s.action}{s.why ? ` — ${s.why}` : ''}</li>
                ))}
              </ul>
            </div>
          )}

          {result.message_to_recruiter && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><MessageSquare size={16} /> Message to Recruiter</h3>
              <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs whitespace-pre-wrap">{result.message_to_recruiter}</pre>
            </div>
          )}

          {Array.isArray(result.conflicts) && result.conflicts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-red-700">Conflicts</h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {result.conflicts.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInterviewSchedulingOptimizer;
