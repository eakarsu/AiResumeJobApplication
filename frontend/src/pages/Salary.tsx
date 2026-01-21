import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salaryAPI, aiAPI } from '../services/api';
import { SalaryResearch } from '../types';
import { DollarSign, Search, Sparkles, Loader2, MapPin, Briefcase } from 'lucide-react';

const Salary: React.FC = () => {
  const [salaries, setSalaries] = useState<SalaryResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ jobTitle: '', location: '', experienceLevel: '' });
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const loadTestData = () => {
    setSearch({ jobTitle: 'Software Engineer', location: 'San Francisco', experienceLevel: 'senior' });
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    try {
      const response = await salaryAPI.getAll(search);
      setSalaries(response.data.salaries);
    } catch (error) {
      console.error('Failed to fetch salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSalaries();
  };

  const handleGetInsights = async () => {
    if (!search.jobTitle || !search.location) return;
    setAnalyzing(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await aiAPI.getSalaryInsights({
        jobTitle: search.jobTitle,
        location: search.location,
        experienceLevel: search.experienceLevel || 'mid'
      });
      setInsights(response.data);
      setMessage({ type: 'success', text: 'Salary insights generated!' });
    } catch (error: any) {
      console.error('Failed to get insights:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to get salary insights. Check your OpenRouter API key.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const formatSalary = (amount: number) => `$${(amount / 1000).toFixed(0)}k`;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Research</h1>
          <p className="text-gray-500">Explore market salary data</p>
        </div>
        <button onClick={() => setShowInsightsModal(true)} className="btn-primary flex items-center space-x-2">
          <Sparkles className="w-5 h-5" /><span>AI Salary Insights</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input type="text" value={search.jobTitle} onChange={(e) => setSearch({ ...search, jobTitle: e.target.value })} placeholder="Job title" className="input-with-icon" />
          </div>
          <button type="submit" className="btn-primary px-6 flex items-center gap-2 whitespace-nowrap">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input type="text" value={search.location} onChange={(e) => setSearch({ ...search, location: e.target.value })} placeholder="Location" className="input-with-icon" />
          </div>
          <select value={search.experienceLevel} onChange={(e) => setSearch({ ...search, experienceLevel: e.target.value })} className="input-field w-auto min-w-[140px]">
            <option value="">All Levels</option>
            <option value="entry">Entry</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {salaries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No salary data found</h3>
          <p className="text-gray-500">Try different search criteria or get AI insights</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salaries.map((salary) => (
            <div key={salary.id} onClick={() => navigate(`/salary/${salary.id}`)} className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs capitalize">{salary.experienceLevel}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{salary.jobTitle}</h3>
              <p className="text-sm text-gray-500 mb-3">{salary.location}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Range</p>
                  <p className="font-semibold text-gray-900">{formatSalary(salary.salaryMin)} - {formatSalary(salary.salaryMax)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Median</p>
                  <p className="font-semibold text-green-600">{formatSalary(salary.salaryMedian)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Insights Modal */}
      {showInsightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">AI Salary Insights</h2>
              {!insights && <button onClick={loadTestData} className="text-sm text-primary-600 hover:underline">Load Test Data</button>}
            </div>
            {message.text && (
              <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            {!insights ? (
              <>
                <div className="space-y-4">
                  <input type="text" value={search.jobTitle} onChange={(e) => setSearch({ ...search, jobTitle: e.target.value })} placeholder="Job title *" className="input-field" />
                  <input type="text" value={search.location} onChange={(e) => setSearch({ ...search, location: e.target.value })} placeholder="Location *" className="input-field" />
                  <select value={search.experienceLevel} onChange={(e) => setSearch({ ...search, experienceLevel: e.target.value })} className="input-field">
                    <option value="">Experience Level</option>
                    <option value="entry">Entry</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button onClick={() => { setShowInsightsModal(false); setMessage({ type: '', text: '' }); }} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleGetInsights} disabled={!search.jobTitle || !search.location || analyzing} className="btn-primary flex-1 flex items-center justify-center">
                    {analyzing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Get Insights
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">{search.jobTitle} in {search.location}</p>
                  <div className="flex items-center justify-center space-x-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatSalary(insights.salaryRange.min)}</p>
                      <p className="text-xs text-gray-500">Min</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-green-600">{formatSalary(insights.salaryRange.median)}</p>
                      <p className="text-xs text-gray-500">Median</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatSalary(insights.salaryRange.max)}</p>
                      <p className="text-xs text-gray-500">Max</p>
                    </div>
                  </div>
                </div>
                {insights.factors?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Factors Affecting Salary</h3>
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                      {insights.factors.map((f: string, i: number) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}
                {insights.negotiationTips?.length > 0 && (
                  <div className="bg-primary-50 rounded-lg p-4">
                    <h3 className="font-medium mb-2 text-primary-800">Negotiation Tips</h3>
                    <ul className="list-disc pl-5 text-primary-700 space-y-1">
                      {insights.negotiationTips.map((tip: string, i: number) => <li key={i}>{tip}</li>)}
                    </ul>
                  </div>
                )}
                <button onClick={() => { setInsights(null); setShowInsightsModal(false); }} className="btn-primary w-full mt-6">Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;
