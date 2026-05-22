// NON-VIZ 1: Resume PDF Generator — form (sections, work history, skills, education) → PDF (pdfkit) ATS-friendly
import React, { useState } from 'react';

interface Job { company: string; role: string; period: string; bullets: string; }
interface Edu { school: string; degree: string; year: string; }

const ResumeBuilder: React.FC = () => {
  const [fullName, setFullName] = useState('Jane Doe');
  const [email, setEmail] = useState('jane@example.com');
  const [phone, setPhone] = useState('(555) 123-4567');
  const [summary, setSummary] = useState(
    'Senior full-stack engineer with 6+ years building React/TypeScript products at scale.'
  );
  const [skills, setSkills] = useState('TypeScript, React, Node.js, PostgreSQL, AWS');
  const [jobs, setJobs] = useState<Job[]>([
    { company: 'Acme Co', role: 'Senior Engineer', period: '2022 - Present',
      bullets: 'Shipped features used by 10k+ users\nMentored 4 engineers\nCut p95 latency 40%' },
  ]);
  const [edu, setEdu] = useState<Edu[]>([
    { school: 'State University', degree: 'B.S. Computer Science', year: '2019' },
  ]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const addJob = () => setJobs((j) => [...j, { company: '', role: '', period: '', bullets: '' }]);
  const addEdu = () => setEdu((e) => [...e, { school: '', degree: '', year: '' }]);

  const updateJob = (i: number, field: keyof Job, v: string) =>
    setJobs((js) => js.map((j, k) => (k === i ? { ...j, [field]: v } : j)));
  const updateEdu = (i: number, field: keyof Edu, v: string) =>
    setEdu((es) => es.map((e, k) => (k === i ? { ...e, [field]: v } : e)));

  const generate = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const payload = {
        fullName, email, phone, summary,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        workHistory: jobs.map((j) => ({
          company: j.company, role: j.role, period: j.period,
          bullets: j.bullets.split('\n').map((b) => b.trim()).filter(Boolean),
        })),
        education: edu,
      };
      const res = await fetch('/api/custom-views/resume-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('PDF generation failed: ' + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fullName.replace(/\s+/g, '_')}_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('Resume PDF downloaded.');
    } catch (e: any) {
      setStatus('Error: ' + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Resume Builder (ATS-friendly PDF)</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
        <input className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
      </div>

      <textarea className={input} rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary" />
      <input className={input} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills (comma-separated)" />

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-800">Work history</h4>
          <button onClick={addJob} className="text-sm text-blue-600 hover:underline">+ Add role</button>
        </div>
        {jobs.map((j, i) => (
          <div key={i} className="border border-gray-200 rounded p-3 mb-2 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input className={input} value={j.role} onChange={(e) => updateJob(i, 'role', e.target.value)} placeholder="Role" />
              <input className={input} value={j.company} onChange={(e) => updateJob(i, 'company', e.target.value)} placeholder="Company" />
              <input className={input} value={j.period} onChange={(e) => updateJob(i, 'period', e.target.value)} placeholder="Period (2022 - Present)" />
            </div>
            <textarea className={input} rows={3} value={j.bullets} onChange={(e) => updateJob(i, 'bullets', e.target.value)} placeholder="Bullets (one per line)" />
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-800">Education</h4>
          <button onClick={addEdu} className="text-sm text-blue-600 hover:underline">+ Add school</button>
        </div>
        {edu.map((e, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <input className={input} value={e.degree} onChange={(ev) => updateEdu(i, 'degree', ev.target.value)} placeholder="Degree" />
            <input className={input} value={e.school} onChange={(ev) => updateEdu(i, 'school', ev.target.value)} placeholder="School" />
            <input className={input} value={e.year} onChange={(ev) => updateEdu(i, 'year', ev.target.value)} placeholder="Year" />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={generate}
          disabled={busy}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? 'Generating…' : 'Generate ATS PDF'}
        </button>
        {status && <span className="text-sm text-gray-600">{status}</span>}
      </div>
    </div>
  );
};

export default ResumeBuilder;
