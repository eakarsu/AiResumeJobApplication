// VIZ 1: Application Funnel — vertical funnel of applied → reviewed → interview → offer → accepted
import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, FunnelChart, Funnel, Tooltip, LabelList } from 'recharts';

interface Stage { stage: string; count: number; fill: string; }
interface FunnelData {
  stages: Stage[];
  totals: { applied: number; accepted: number; conversionPct: number };
  asOf: string;
}

const ApplicationFunnel: React.FC = () => {
  const [data, setData] = useState<FunnelData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/custom-views/funnel')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setErr(String(e?.message || e)));
  }, []);

  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;
  if (!data) return <div className="p-4 text-gray-500">Loading funnel…</div>;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Application Funnel</h3>
        <span className="text-xs text-gray-500">
          {data.totals.applied} applied → {data.totals.accepted} accepted
          ({data.totals.conversionPct}% conversion)
        </span>
      </div>
      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer>
          <FunnelChart>
            <Tooltip />
            <Funnel
              dataKey="count"
              nameKey="stage"
              data={data.stages}
              isAnimationActive
              orientation="vertical"
            >
              <LabelList position="right" fill="#111" stroke="none" dataKey="stage" />
              <LabelList position="center" fill="#fff" stroke="none" dataKey="count" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ApplicationFunnel;
