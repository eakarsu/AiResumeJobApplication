import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Sparkles, Loader2, AlertTriangle, MessageSquare, ArrowRight } from 'lucide-react';

interface NegotiationResult {
  counterOffer?: { base?: number; bonus?: number; equity?: any; perks?: string[]; rationale?: string };
  recruiterReply?: string;
  branches?: Array<{ scenario: string; suggestedResponse: string; expectedOutcome?: string }>;
  summary?: string;
  scriptedMessage?: string;
  redFlags?: string[];
  [k: string]: any;
}

const AIOfferNegotiationSimulator: React.FC = () => {
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [offeredBase, setOfferedBase] = useState('');
  const [offeredBonus, setOfferedBonus] = useState('');
  const [offeredEquity, setOfferedEquity] = useState('');
  const [targetBase, setTargetBase] = useState('');
  const [competingOffers, setCompetingOffers] = useState('');
  const [yearsExperience, setYearsExperience] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NegotiationResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !offeredBase) {
      setError('Job title and offered base are required.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/offer-negotiation-simulator', {
        jobTitle,
        companyName,
        location,
        offer: {
          base: Number(offeredBase),
          bonus: offeredBonus ? Number(offeredBonus) : undefined,
          equity: offeredEquity || undefined,
        },
        targetBase: targetBase ? Number(targetBase) : undefined,
        competingOffers,
        yearsExperience: Number(yearsExperience),
      });
      setResult(res.data?.simulation || res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Simulation failed');
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
          <MessageSquare className="text-purple-500" /> Offer Negotiation Simulator
        </h1>
        <p className="text-gray-500 mt-2">Simulate the counter-offer conversation with branching responses.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Job title *</label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company name</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Years experience</label>
            <input type="number" min="0" max="50" value={yearsExperience} onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Offered base ($) *</label>
            <input type="number" value={offeredBase} onChange={(e) => setOfferedBase(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Offered bonus ($)</label>
            <input type="number" value={offeredBonus} onChange={(e) => setOfferedBonus(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Offered equity</label>
            <input value={offeredEquity} onChange={(e) => setOfferedEquity(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. 0.1% / 1000 RSU" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Target base ($)</label>
            <input type="number" value={targetBase} onChange={(e) => setTargetBase(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Competing offers</label>
            <input value={competingOffers} onChange={(e) => setCompetingOffers(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. $180k base from Y" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {loading ? 'Simulating...' : 'Simulate Negotiation'}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-xl shadow border p-6 space-y-5">
          {result.summary && <p className="text-gray-700">{result.summary}</p>}

          {result.counterOffer && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-purple-800">Suggested Counter-Offer</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {result.counterOffer.base != null && <Stat label="Base" value={`$${result.counterOffer.base.toLocaleString()}`} />}
                {result.counterOffer.bonus != null && <Stat label="Bonus" value={`$${result.counterOffer.bonus.toLocaleString()}`} />}
                {result.counterOffer.equity && <Stat label="Equity" value={String(result.counterOffer.equity)} />}
              </div>
              {Array.isArray(result.counterOffer.perks) && result.counterOffer.perks.length > 0 && (
                <p className="text-sm text-gray-700 mt-2">Perks: {result.counterOffer.perks.join(', ')}</p>
              )}
              {result.counterOffer.rationale && <p className="text-sm text-gray-600 mt-2 italic">{result.counterOffer.rationale}</p>}
            </div>
          )}

          {result.scriptedMessage && (
            <div>
              <h3 className="font-semibold mb-2">Scripted Message</h3>
              <pre className="bg-gray-50 border rounded-lg p-3 text-sm whitespace-pre-wrap">{result.scriptedMessage}</pre>
            </div>
          )}

          {result.recruiterReply && (
            <div>
              <h3 className="font-semibold mb-2">Predicted Recruiter Reply</h3>
              <pre className="bg-gray-50 border rounded-lg p-3 text-sm whitespace-pre-wrap">{result.recruiterReply}</pre>
            </div>
          )}

          {Array.isArray(result.branches) && result.branches.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Branching Responses</h3>
              <div className="space-y-3">
                {result.branches.map((b, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="text-xs uppercase text-gray-500 mb-1">Scenario</div>
                    <p className="text-sm font-medium">{b.scenario}</p>
                    <div className="flex items-start gap-2 mt-2">
                      <ArrowRight size={14} className="text-purple-500 mt-1" />
                      <p className="text-sm text-gray-700">{b.suggestedResponse}</p>
                    </div>
                    {b.expectedOutcome && <p className="text-xs text-gray-500 mt-2">Expected: {b.expectedOutcome}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(result.redFlags) && result.redFlags.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h3 className="font-semibold text-red-800 mb-1">Red Flags</h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {result.redFlags.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white rounded-md border px-3 py-2">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-base font-semibold text-purple-700">{value}</div>
  </div>
);

export default AIOfferNegotiationSimulator;
