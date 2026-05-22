// VIZ 2: Skill Match Radar — user skills vs target job requirements (7 dimensions)
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend, Tooltip,
} from 'recharts';

interface Dim { skill: string; user: number; required: number; }
interface RadarData { target: string; dimensions: Dim[]; gap: number; matchPct: number; }

const SkillMatchRadar: React.FC<{ target?: string }> = ({ target }) => {
  const [data, setData] = useState<RadarData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const qs = target ? `?target=${encodeURIComponent(target)}` : '';
    fetch('/api/custom-views/skill-radar' + qs)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setErr(String(e?.message || e)));
  }, [target]);

  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;
  if (!data) return <div className="p-4 text-gray-500">Loading radar…</div>;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Skill Match — {data.target}</h3>
        <span className="text-xs text-gray-500">
          {data.matchPct}% match • gap score {data.gap}
        </span>
      </div>
      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer>
          <RadarChart data={data.dimensions}>
            <PolarGrid />
            <PolarAngleAxis dataKey="skill" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="You" dataKey="user" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
            <Radar name="Target" dataKey="required" stroke="#ec4899" fill="#ec4899" fillOpacity={0.25} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SkillMatchRadar;
