// NON-VIZ 2: Cover Letter Builder — pick job + tone + paste resume highlights → POST returns letter; download as PDF
import React, { useState } from 'react';

const TONES = ['formal', 'friendly', 'enthusiastic', 'confident'] as const;
type Tone = typeof TONES[number];

const CoverLetterBuilder: React.FC = () => {
  const [jobTitle, setJobTitle] = useState('Senior Full-Stack Engineer');
  const [company, setCompany] = useState('Acme Co');
  const [applicantName, setApplicantName] = useState('Jane Doe');
  const [tone, setTone] = useState<Tone>('formal');
  const [highlights, setHighlights] = useState(
    'Shipped React/TS dashboard used by 10k+ daily users\nLed migration to TypeScript reducing prod incidents 35%\nMentored 4 engineers; ran weekly code-review club'
  );
  const [letter, setLetter] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const input =
    'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const buildLetter = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/custom-views/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, tone, highlights, applicantName }),
      });
      if (!res.ok) throw new Error('Build failed: ' + res.status);
      const data = await res.json();
      setLetter(data.letter || '');
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/custom-views/cover-letter?format=pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, tone, highlights, applicantName, format: 'pdf' }),
      });
      if (!res.ok) throw new Error('PDF failed: ' + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover_letter_${company.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Cover Letter Builder</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className={input} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Job title" />
        <input className={input} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
        <input className={input} value={applicantName} onChange={(e) => setApplicantName(e.target.value)} placeholder="Your name" />
        <select className={input} value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
          {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <label className="block text-sm text-gray-700">Resume highlights (one per line)</label>
      <textarea className={input} rows={5} value={highlights} onChange={(e) => setHighlights(e.target.value)} />

      <div className="flex gap-2">
        <button
          onClick={buildLetter}
          disabled={busy}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Generate letter'}
        </button>
        <button
          onClick={downloadPdf}
          disabled={busy}
          className="px-4 py-2 bg-gray-800 text-white rounded font-medium hover:bg-gray-900 disabled:opacity-50"
        >
          Download PDF
        </button>
      </div>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      {letter && (
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 border border-gray-200 rounded p-3 mt-2">
          {letter}
        </pre>
      )}
    </div>
  );
};

export default CoverLetterBuilder;
