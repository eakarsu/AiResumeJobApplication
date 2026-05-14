import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface UploadRow {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  parsedJson: any;
  resumeId: string | null;
  createdAt: string;
}

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [createResume, setCreateResume] = useState(true);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any>(null);

  const refresh = async () => {
    try {
      const res = await api.get('/resume-upload?page=1&limit=20');
      setUploads(res.data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    setParsedPreview(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('createResume', String(createResume));
      const res = await api.post('/resume-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setParsedPreview(res.data?.parsed);
      setFile(null);
      await refresh();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume Upload &amp; Parse</h1>
        <p className="text-gray-500 text-sm">
          Drop a PDF / DOCX / TXT and the AI extracts a structured resume — optionally creating a new resume row.
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded">{error}</div>}

      <form onSubmit={submit} className="bg-white border rounded p-4 space-y-3">
        <input
          type="file"
          accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={createResume}
            onChange={(e) => setCreateResume(e.target.checked)}
          />
          Create a Resume row from the parsed result
        </label>
        <button
          disabled={!file || submitting}
          type="submit"
          className="bg-primary-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? 'Uploading…' : 'Upload &amp; parse'}
        </button>
      </form>

      {parsedPreview && (
        <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
          <h2 className="font-semibold mb-1">Parsed preview</h2>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(parsedPreview, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">Recent uploads</h2>
        <ul className="divide-y border rounded">
          {uploads.length === 0 && <li className="p-3 text-gray-500 text-sm">No uploads yet.</li>}
          {uploads.map((u) => (
            <li key={u.id} className="p-3 text-sm flex items-center justify-between">
              <div>
                <div className="font-medium">{u.originalName}</div>
                <div className="text-xs text-gray-500">
                  {Math.round(u.size / 1024)} KB · {u.mimeType} · {new Date(u.createdAt).toLocaleString()}
                </div>
              </div>
              {u.resumeId && (
                <a className="text-primary-600 underline text-sm" href={`/resumes/${u.resumeId}`}>View resume</a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
