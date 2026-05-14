import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function LinkedinSync() {
  const [profile, setProfile] = useState<any>(null);
  const [url, setUrl] = useState('');
  const [snippet, setSnippet] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const res = await api.get('/linkedin/profile');
      if (res.data) {
        setProfile(res.data);
        setUrl(res.data.url || '');
      }
    } catch {}
  };

  useEffect(() => { refresh(); }, []);

  const sync = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post('/linkedin/sync', { url, snippet, targetRole });
      setProfile(res.data?.profile);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Sync failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">LinkedIn Profile Sync</h1>
        <p className="text-gray-500 text-sm">
          Paste your public profile snippet — the AI extracts structure and identifies gaps vs a target role.
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded">{error}</div>}

      <form onSubmit={sync} className="bg-white border rounded p-4 space-y-3">
        <input
          required
          className="border p-2 rounded w-full"
          placeholder="LinkedIn URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="Target role (optional, e.g. Senior ML Engineer)"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
        />
        <textarea
          required
          className="border p-2 rounded w-full h-40"
          placeholder="Paste profile summary / about section / experience text…"
          value={snippet}
          onChange={(e) => setSnippet(e.target.value)}
        />
        <button disabled={busy} className="bg-primary-600 text-white px-4 py-2 rounded">
          {busy ? 'Analysing…' : 'Sync &amp; analyse'}
        </button>
      </form>

      {profile && (
        <div className="bg-white border rounded p-4 space-y-3">
          <h2 className="font-semibold">Parsed profile</h2>
          <div className="text-xs text-gray-500">Last synced: {new Date(profile.syncedAt).toLocaleString()}</div>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-gray-50 p-3 rounded">
            {JSON.stringify(profile.parsedJson, null, 2)}
          </pre>
          {profile.gapInsights && (
            <div className="bg-amber-50 p-3 rounded text-sm">
              <div className="font-semibold mb-1">Gap insights</div>
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(profile.gapInsights, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
