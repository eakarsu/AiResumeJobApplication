import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Offer {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  experienceYears: number | null;
  baseSalary: number;
  bonus: number | null;
  totalComp: number | null;
  isAnonymous: boolean;
  createdAt: string;
}

export default function CompensationTracker() {
  const [mine, setMine] = useState<Offer[]>([]);
  const [agg, setAgg] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [form, setForm] = useState({
    jobTitle: '',
    company: '',
    location: '',
    experienceYears: '',
    baseSalary: '',
    bonus: '',
    equity: '',
    signOnBonus: '',
    totalComp: '',
    notes: '',
    isAnonymous: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMine = async () => {
    try {
      const res = await api.get(`/compensation/mine?page=${page}&limit=10`);
      setMine(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Load failed');
    }
  };

  const refreshAgg = async () => {
    try {
      const params = new URLSearchParams();
      if (filterTitle) params.set('jobTitle', filterTitle);
      if (filterLocation) params.set('location', filterLocation);
      const res = await api.get(`/compensation/aggregate?${params.toString()}`);
      setAgg(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Aggregate failed');
    }
  };

  useEffect(() => { refreshMine(); /* eslint-disable-next-line */ }, [page]);
  useEffect(() => { refreshAgg(); /* eslint-disable-next-line */ }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/compensation', {
        ...form,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
        baseSalary: Number(form.baseSalary),
        bonus: form.bonus ? Number(form.bonus) : null,
        signOnBonus: form.signOnBonus ? Number(form.signOnBonus) : null,
        totalComp: form.totalComp ? Number(form.totalComp) : null,
      });
      setForm({ ...form, jobTitle: '', company: '', baseSalary: '', notes: '' });
      await Promise.all([refreshMine(), refreshAgg()]);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Submit failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compensation Tracker</h1>
        <p className="text-gray-500 text-sm">
          Anonymously contribute offer data and see real percentiles for any role/location.
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded">{error}</div>}

      <form onSubmit={submit} className="bg-white border rounded p-4 grid md:grid-cols-2 gap-2 text-sm">
        <input className="border p-2 rounded" required placeholder="Job title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
        <input className="border p-2 rounded" required placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <input className="border p-2 rounded" required placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input className="border p-2 rounded" type="number" step="0.5" placeholder="YOE" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
        <input className="border p-2 rounded" required type="number" placeholder="Base salary (USD)" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} />
        <input className="border p-2 rounded" type="number" placeholder="Bonus" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Equity (e.g. 50k vest 4yr)" value={form.equity} onChange={(e) => setForm({ ...form, equity: e.target.value })} />
        <input className="border p-2 rounded" type="number" placeholder="Sign-on bonus" value={form.signOnBonus} onChange={(e) => setForm({ ...form, signOnBonus: e.target.value })} />
        <input className="border p-2 rounded" type="number" placeholder="Total comp" value={form.totalComp} onChange={(e) => setForm({ ...form, totalComp: e.target.value })} />
        <textarea className="border p-2 rounded col-span-2" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <label className="flex items-center gap-2 col-span-2">
          <input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} />
          Submit anonymously
        </label>
        <button disabled={busy} className="bg-primary-600 text-white px-4 py-2 rounded col-span-2">
          {busy ? 'Submitting…' : 'Submit offer'}
        </button>
      </form>

      <div className="bg-white border rounded p-4 space-y-2">
        <h2 className="font-semibold">Aggregate stats</h2>
        <div className="flex gap-2 text-sm">
          <input className="border p-1 rounded" placeholder="Job title filter" value={filterTitle} onChange={(e) => setFilterTitle(e.target.value)} />
          <input className="border p-1 rounded" placeholder="Location filter" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} />
          <button onClick={refreshAgg} className="border px-2 rounded">Compute</button>
        </div>
        {agg && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center mt-2 text-sm">
            <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Sample size</div><div className="font-bold">{agg.sampleSize}</div></div>
            <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Min</div><div className="font-bold">${agg.base?.min?.toLocaleString?.() || 0}</div></div>
            <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Median</div><div className="font-bold">${agg.base?.median?.toLocaleString?.() || 0}</div></div>
            <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">P75</div><div className="font-bold">${agg.base?.p75?.toLocaleString?.() || 0}</div></div>
            <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Max</div><div className="font-bold">${agg.base?.max?.toLocaleString?.() || 0}</div></div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Your submissions</h2>
        <ul className="border rounded divide-y text-sm">
          {mine.length === 0 && <li className="p-3 text-gray-500">None yet.</li>}
          {mine.map((o) => (
            <li key={o.id} className="p-3 flex justify-between">
              <div>
                <div>{o.jobTitle} at {o.company} · {o.location}</div>
                <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div>${o.baseSalary.toLocaleString()}</div>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center text-sm mt-2">
          <button className="border px-3 py-1 rounded" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {page} / {totalPages}</span>
          <button className="border px-3 py-1 rounded" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
