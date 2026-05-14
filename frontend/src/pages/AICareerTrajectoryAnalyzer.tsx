import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Sparkles, Loader2, AlertTriangle, TrendingUp, Target, BookOpen } from 'lucide-react';

interface Path {
  title: string;
  rationale?: string;
  fitScore?: number;
  oneYearMilestones?: string[];
  threeYearMilestones?: string[];
  skillsToAcquire?: string[];
  estimatedSalaryRange?: { min?: number; max?: number };
  [k: string]: any;
}

interface CareerResult {
  summary?: string;
  paths?: Path[];
  oneYearPlan?: string[];
  threeYearPlan?: string[];
  skillGaps?: { skill: string; closurePlan?: string; priority?: string }[];
  riskFactors?: string[];
  [k: string]: any;
}

const AICareerTrajectoryAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState(5);
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [constraints, setConstraints] = useState('');
  const [targetIndustries, setTargetIndustries] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CareerResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole.trim() || !skills.trim()) {
      setError('Current role and skills are required.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const skillsArr = skills.split(',').map(s => s.trim()).filter(Boolean);
      const industriesArr = targetIndustries.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.post('/ai/career-trajectory-analyzer', {
        currentRole,
        yearsExperience: Number(yearsExperience),
        skills: skillsArr,
        interests,
        constraints,
        targetIndustries: industriesArr,
      });
      setResult(res.data?.analysis || res.data);
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
          <TrendingUp className="text-emerald-500" /> Career Trajectory Analyzer
        </h1>
        <p className="text-gray-500 mt-2">Multi-path career projection with skill-gap closure plans and 1- and 3-year milestones.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current role *</label>
            <input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Years experience</label>
            <input type="number" min="0" max="50" value={yearsExperience} onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Skills (comma separated) *</label>
          <textarea value={skills} onChange={(e) => setSkills(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2" required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Interests / passions</label>
          <textarea value={interests} onChange={(e) => setInterests(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Constraints (location, family, comp floor, etc.)</label>
          <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Target industries (comma separated)</label>
          <input value={targetIndustries} onChange={(e) => setTargetIndustries(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. fintech, climate tech, biotech" />
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
          {loading ? 'Analyzing...' : 'Analyze Trajectory'}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-xl shadow border p-6 space-y-5">
          {result.summary && <p className="text-gray-700">{result.summary}</p>}

          {Array.isArray(result.paths) && result.paths.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-emerald-700">
                <Target size={16} /> Career Paths
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.paths.map((p, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{p.title}</h4>
                      {p.fitScore != null && <span className="text-sm font-bold text-emerald-700">{p.fitScore}/100</span>}
                    </div>
                    {p.rationale && <p className="text-sm text-gray-600 mt-1">{p.rationale}</p>}
                    {p.estimatedSalaryRange && (p.estimatedSalaryRange.min || p.estimatedSalaryRange.max) && (
                      <p className="text-xs text-gray-500 mt-1">
                        Salary: ${p.estimatedSalaryRange.min?.toLocaleString() ?? '?'} - ${p.estimatedSalaryRange.max?.toLocaleString() ?? '?'}
                      </p>
                    )}
                    {Array.isArray(p.oneYearMilestones) && p.oneYearMilestones.length > 0 && (
                      <SmallList title="1-year" items={p.oneYearMilestones} />
                    )}
                    {Array.isArray(p.threeYearMilestones) && p.threeYearMilestones.length > 0 && (
                      <SmallList title="3-year" items={p.threeYearMilestones} />
                    )}
                    {Array.isArray(p.skillsToAcquire) && p.skillsToAcquire.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.skillsToAcquire.map((s, j) => (
                          <span key={j} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(result.oneYearPlan) && result.oneYearPlan.length > 0 && (
            <ListSection title="1-Year Plan" items={result.oneYearPlan} />
          )}
          {Array.isArray(result.threeYearPlan) && result.threeYearPlan.length > 0 && (
            <ListSection title="3-Year Plan" items={result.threeYearPlan} />
          )}

          {Array.isArray(result.skillGaps) && result.skillGaps.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2"><BookOpen size={16} /> Skill Gaps</h3>
              <div className="space-y-2">
                {result.skillGaps.map((g, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{g.skill}</span>
                      {g.priority && <span className="text-xs text-gray-500">{g.priority}</span>}
                    </div>
                    {g.closurePlan && <p className="text-sm text-gray-600 mt-1">{g.closurePlan}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(result.riskFactors) && result.riskFactors.length > 0 && (
            <ListSection title="Risk Factors" items={result.riskFactors} />
          )}
        </div>
      )}
    </div>
  );
};

const SmallList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div className="mt-2">
    <p className="text-xs uppercase text-gray-500">{title}</p>
    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-0.5">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  </div>
);

const ListSection: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
      {items.map((it, i) => <li key={i}>{typeof it === 'string' ? it : JSON.stringify(it)}</li>)}
    </ul>
  </div>
);

export default AICareerTrajectoryAnalyzer;
