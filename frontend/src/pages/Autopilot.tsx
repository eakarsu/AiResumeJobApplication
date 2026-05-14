import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Config {
  id: string;
  enabled: boolean;
  query: string;
  location: string;
  minSalary: number | null;
  experienceLevel: string | null;
  resumeId: string | null;
  maxPerDay: number;
  lastRunAt: string | null;
}
interface Draft {
  id: string;
  jobId: string;
  matchScore: number;
  resumeId: string | null;
  coverLetterId: string | null;
  status: string;
  createdAt: string;
}

export default function Autopilot() {
  const [config, setConfig] = useState<Config | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    enabled: false,
    query: '',
    location: '',
    minSalary: '',
    experienceLevel: '',
    resumeId: '',
    maxPerDay: 5,
  });

  const refreshConfig = async () => {
    try {
      const [cfgRes, resumesRes] = await Promise.all([
        api.get('/autopilot/config'),
        api.get('/resumes?page=1&limit=50'),
      ]);
      setConfig(cfgRes.data);
      const r = Array.isArray(resumesRes.data) ? resumesRes.data : resumesRes.data?.data || [];
      setResumes(r);
      if (cfgRes.data) {
        setForm({
          enabled: !!cfgRes.data.enabled,
          query: cfgRes.data.query || '',
          location: cfgRes.data.location || '',
          minSalary: cfgRes.data.minSalary?.toString() || '',
          experienceLevel: cfgRes.data.experienceLevel || '',
          resumeId: cfgRes.data.resumeId || '',
          maxPerDay: cfgRes.data.maxPerDay || 5,
        });
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load config');
    }
  };

  const refreshDrafts = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/autopilot/drafts?${params.toString()}`);
      setDrafts(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load drafts');
    }
  };

  useEffect(() => {
    Promise.all([refreshConfig(), refreshDrafts()]).finally(() => setLoading(false));
    /* eslint-disable-next-line */
  }, []);
  useEffect(() => { refreshDrafts(); /* eslint-disable-next-line */ }, [page, statusFilter]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put('/autopilot/config', {
        ...form,
        minSalary: form.minSalary ? Number(form.minSalary) : null,
      });
      await refreshConfig();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await api.post('/autopilot/run');
      alert(`Created ${res.data?.draftsCreated || 0} draft(s)`);
      await refreshDrafts();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/autopilot/drafts/${id}`, { status });
      await refreshDrafts();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Update failed');
    }
  };

  if (loading) return <div className="p-8">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Application Autopilot</h1>
        <p className="text-gray-500 text-sm">
          Daily automated job search → AI scoring → tailored bullets &amp; cover letter, queued for one-click review.
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded">{error}</div>}

      <form onSubmit={save} className="bg-white border rounded p-4 grid md:grid-cols-2 gap-3">
        <label className="flex items-center gap-2 col-span-2">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
          Enabled
        </label>
        <input className="border p-2 rounded" placeholder="Search query (e.g. Senior Python)" value={form.query} onChange={(e) => setForm({ ...form, query: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        <input className="border p-2 rounded" type="number" placeholder="Min salary" value={form.minSalary} onChange={(e) => setForm({ ...form, minSalary: e.target.value })} />
        <select className="border p-2 rounded" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
          <option value="">Any experience</option>
          <option value="entry">Entry</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead</option>
          <option value="executive">Executive</option>
        </select>
        <select className="border p-2 rounded" value={form.resumeId} onChange={(e) => setForm({ ...form, resumeId: e.target.value })}>
          <option value="">Use latest resume</option>
          {resumes.map((r: any) => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>
        <input className="border p-2 rounded" type="number" min={1} max={20} placeholder="Max drafts per run" value={form.maxPerDay} onChange={(e) => setForm({ ...form, maxPerDay: Number(e.target.value) || 5 })} />

        <div className="col-span-2 flex gap-2">
          <button disabled={saving} type="submit" className="bg-primary-600 text-white px-4 py-2 rounded">
            {saving ? 'Saving…' : 'Save config'}
          </button>
          <button type="button" disabled={running || !config?.enabled} onClick={run} className="bg-emerald-600 text-white px-4 py-2 rounded">
            {running ? 'Running…' : 'Run autopilot now'}
          </button>
          {config?.lastRunAt && (
            <span className="text-xs text-gray-500 self-center">
              Last run: {new Date(config.lastRunAt).toLocaleString()}
            </span>
          )}
        </div>
      </form>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Drafts</h2>
        <select className="border p-1 rounded text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="pending_review">Pending review</option>
          <option value="approved">Approved</option>
          <option value="dismissed">Dismissed</option>
          <option value="applied">Applied</option>
        </select>
      </div>

      <ul className="border rounded divide-y">
        {drafts.length === 0 && <li className="p-3 text-gray-500 text-sm">No drafts yet — run autopilot.</li>}
        {drafts.map((d) => (
          <li key={d.id} className="p-3 flex items-center justify-between text-sm">
            <div>
              <div>Job <code>{d.jobId.slice(0, 8)}…</code> · score <strong>{d.matchScore}</strong> · status <em>{d.status}</em></div>
              <div className="text-xs text-gray-500">{new Date(d.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex gap-1">
              {d.coverLetterId && (
                <a className="text-primary-600 underline" href={`/cover-letters/${d.coverLetterId}`}>Cover letter</a>
              )}
              <button onClick={() => updateStatus(d.id, 'approved')} className="text-emerald-700 underline">Approve</button>
              <button onClick={() => updateStatus(d.id, 'dismissed')} className="text-red-700 underline">Dismiss</button>
              <button onClick={() => updateStatus(d.id, 'applied')} className="text-blue-700 underline">Mark applied</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-center text-sm">
        <button className="border px-3 py-1 rounded" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button className="border px-3 py-1 rounded" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
