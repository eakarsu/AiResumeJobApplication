import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../services/api';
import {
  DollarSign,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Sparkles,
  MapPin,
  Briefcase,
  Award,
  CheckCircle,
  Lightbulb,
  Target,
  ChevronRight,
  Database
} from 'lucide-react';

interface SalaryInsights {
  salaryRange: {
    min: number;
    max: number;
    median: number;
  };
  factors: string[];
  negotiationTips: string[];
}

const AISalaryNegotiator: React.FC = () => {
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [skills, setSkills] = useState('');
  const [industry, setIndustry] = useState('');
  const [currentOffer, setCurrentOffer] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<SalaryInsights | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const samplePresets = [
    {
      label: 'Sr. Engineer (SF)',
      jobTitle: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      experienceLevel: 'senior',
      skills: 'React, Node.js, TypeScript, AWS, Python',
      industry: 'Technology',
      currentOffer: '180000'
    },
    {
      label: 'Data Scientist (NYC)',
      jobTitle: 'Data Scientist',
      location: 'New York, NY',
      experienceLevel: 'mid',
      skills: 'Python, TensorFlow, SQL, Tableau, Statistics',
      industry: 'Finance',
      currentOffer: '145000'
    },
    {
      label: 'Product Manager (Seattle)',
      jobTitle: 'Senior Product Manager',
      location: 'Seattle, WA',
      experienceLevel: 'senior',
      skills: 'Product Strategy, A/B Testing, SQL, Agile, Roadmapping',
      industry: 'Technology',
      currentOffer: '175000'
    },
    {
      label: 'DevOps (Remote)',
      jobTitle: 'DevOps Engineer',
      location: 'Remote, US',
      experienceLevel: 'mid',
      skills: 'Kubernetes, Docker, Terraform, AWS, CI/CD, Python',
      industry: 'Technology',
      currentOffer: '140000'
    }
  ];

  const loadSamplePreset = (index: number) => {
    const preset = samplePresets[index];
    setJobTitle(preset.jobTitle);
    setLocation(preset.location);
    setExperienceLevel(preset.experienceLevel);
    setSkills(preset.skills);
    setIndustry(preset.industry);
    setCurrentOffer(preset.currentOffer);
  };

  const handleAnalyze = async () => {
    if (!jobTitle || !location || !experienceLevel) return;
    setLoading(true);
    setInsights(null);
    setMessage({ type: '', text: '' });

    try {
      const response = await aiAPI.getSalaryInsights({
        jobTitle,
        location,
        experienceLevel,
        skills: skills ? skills.split(',').map(s => s.trim()) : undefined,
        industry: industry || undefined
      });
      setInsights(response.data);
      const saved = response.data.salaryResearchId;
      setMessage({
        type: 'success',
        text: saved
          ? 'Salary insights generated and saved to database!'
          : 'Salary insights generated! (Could not save to database)'
      });
    } catch (error: any) {
      console.error('Failed to get insights:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to analyze. Check your OpenRouter API key.' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getOfferPosition = () => {
    if (!currentOffer || !insights) return null;
    const offer = parseInt(currentOffer);
    const { min, max, median } = insights.salaryRange;
    const range = max - min;
    const position = ((offer - min) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const getOfferAssessment = () => {
    if (!currentOffer || !insights) return null;
    const offer = parseInt(currentOffer);
    const { min, max, median } = insights.salaryRange;

    if (offer >= max) return { status: 'excellent', text: 'Excellent offer! Above market rate', color: 'text-green-600', bg: 'bg-green-100' };
    if (offer >= median) return { status: 'good', text: 'Good offer - at or above median', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (offer >= min) return { status: 'fair', text: 'Fair offer - room to negotiate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'low', text: 'Below market - negotiate higher', color: 'text-red-600', bg: 'bg-red-100' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="w-7 h-7 mr-3 text-emerald-600" />
            AI Salary Negotiator
          </h1>
          <p className="text-gray-500">Get market insights and negotiation strategies</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Input Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Position Details</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">Samples:</span>
            {samplePresets.map((preset, i) => (
              <button
                key={i}
                onClick={() => loadSamplePreset(i)}
                className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-2" />
              Job Title *
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              className="input-field"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Location *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, CA"
              className="input-field"
            />
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Award className="w-4 h-4 inline mr-2" />
              Experience Level *
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="input-field"
            >
              <option value="entry">Entry Level (0-2 years)</option>
              <option value="mid">Mid Level (3-5 years)</option>
              <option value="senior">Senior (5-8 years)</option>
              <option value="lead">Lead/Staff (8+ years)</option>
              <option value="executive">Executive (10+ years)</option>
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Technology, Finance"
              className="input-field"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Skills (comma-separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g., React, Python, AWS"
              className="input-field"
            />
          </div>

          {/* Current Offer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current/Expected Offer ($)
            </label>
            <input
              type="number"
              value={currentOffer}
              onChange={(e) => setCurrentOffer(e.target.value)}
              placeholder="e.g., 150000"
              className="input-field"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!jobTitle || !location || !experienceLevel || loading}
          className="btn-primary mt-6 flex items-center justify-center w-full md:w-auto"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Get Salary Insights
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {insights && (
        <div className="space-y-6">
          {/* Saved Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm w-fit">
            <Database className="w-4 h-4" />
            <span>Results saved to database</span>
            <CheckCircle className="w-4 h-4" />
          </div>

          {/* Salary Range Card */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-8 text-white">
            <h2 className="text-xl font-semibold mb-6">Market Salary Range</h2>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <p className="text-white/80 text-sm mb-1">Minimum</p>
                <p className="text-3xl font-bold">{formatCurrency(insights.salaryRange.min)}</p>
              </div>
              <div className="text-center">
                <p className="text-white/80 text-sm mb-1">Median</p>
                <p className="text-4xl font-bold">{formatCurrency(insights.salaryRange.median)}</p>
                <p className="text-sm text-white/60">50th percentile</p>
              </div>
              <div className="text-center">
                <p className="text-white/80 text-sm mb-1">Maximum</p>
                <p className="text-3xl font-bold">{formatCurrency(insights.salaryRange.max)}</p>
              </div>
            </div>

            {/* Visual Range Bar */}
            <div className="relative">
              <div className="h-4 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
              {/* Markers */}
              <div className="absolute top-0 left-0 w-full h-4">
                <div className="absolute top-0 left-0 w-1 h-4 bg-white rounded-full" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-4 bg-white rounded-full" />
                <div className="absolute top-0 right-0 w-1 h-4 bg-white rounded-full" />
                {/* Current Offer Marker */}
                {getOfferPosition() !== null && (
                  <div
                    className="absolute top-0 w-3 h-6 -mt-1 bg-yellow-400 rounded-full border-2 border-white shadow-lg"
                    style={{ left: `${getOfferPosition()}%`, transform: 'translateX(-50%)' }}
                  />
                )}
              </div>
            </div>

            {/* Offer Assessment */}
            {currentOffer && getOfferAssessment() && (
              <div className={`mt-6 p-4 rounded-lg ${getOfferAssessment()!.bg}`}>
                <p className={`font-semibold ${getOfferAssessment()!.color}`}>
                  Your offer: {formatCurrency(parseInt(currentOffer))} - {getOfferAssessment()!.text}
                </p>
              </div>
            )}
          </div>

          {/* Factors Affecting Salary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center text-gray-900">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
              Factors Affecting Your Salary
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {insights.factors.map((factor, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <Target className="w-5 h-5 text-emerald-600 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{factor}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Negotiation Tips */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center text-gray-900">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              Negotiation Strategies
            </h3>
            <div className="space-y-3">
              {insights.negotiationTips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-yellow-700 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold mb-4 text-blue-700">Pro Negotiation Tips</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <p className="text-sm text-gray-700">Always negotiate the total compensation package, not just base salary</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <p className="text-sm text-gray-700">Get the offer in writing before accepting</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <p className="text-sm text-gray-700">Be prepared to walk away if the offer doesn't meet your minimum</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <p className="text-sm text-gray-700">Consider equity, bonuses, PTO, and other benefits</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/salary')}
              className="btn-primary flex items-center"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Save Research
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => { setInsights(null); }}
              className="btn-secondary flex items-center"
            >
              New Analysis
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!insights && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Know Your Worth</h3>
          <p className="text-gray-500">Enter position details to get market salary insights and negotiation tips</p>
        </div>
      )}
    </div>
  );
};

export default AISalaryNegotiator;
