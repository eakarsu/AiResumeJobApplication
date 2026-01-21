import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesAPI, aiAPI } from '../services/api';
import { CompanyResearch } from '../types';
import { Building2, Search, Sparkles, Loader2, Star, Bookmark, BookmarkCheck, Users, MapPin } from 'lucide-react';

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const loadTestData = () => {
    setCompanyName('Microsoft');
    setRole('Senior Software Engineer');
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getAll({ search });
      setCompanies(response.data.companies);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  const handleBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await companiesAPI.toggleBookmark(id);
      setCompanies(companies.map(c => c.id === id ? { ...c, isBookmarked: !c.isBookmarked } : c));
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!companyName) return;
    setAnalyzing(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await aiAPI.analyzeCompany(companyName, role);
      navigate(`/companies/${response.data.savedCompany?.id || response.data.id}`);
    } catch (error: any) {
      console.error('Failed to analyze company:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to analyze company. Check your OpenRouter API key.' });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Research</h1>
          <p className="text-gray-500">Research companies before applying</p>
        </div>
        <button onClick={() => setShowAnalyzeModal(true)} className="btn-primary flex items-center space-x-2">
          <Sparkles className="w-5 h-5" /><span>AI Company Analysis</span>
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies..." className="input-with-icon" />
          </div>
          <button type="submit" className="btn-primary px-6 flex items-center gap-2 whitespace-nowrap">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </form>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-500">Try AI analysis to research a company</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div key={company.id} onClick={() => navigate(`/companies/${company.id}`)} className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <button onClick={(e) => handleBookmark(company.id, e)} className={`p-2 rounded-lg ${company.isBookmarked ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                  {company.isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
              </div>
              <h3 className="font-semibold text-gray-900">{company.companyName}</h3>
              <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                {company.industry && <span>{company.industry}</span>}
                {company.size && <span className="capitalize">{company.size}</span>}
              </div>
              {company.glassdoorRating && (
                <div className="flex items-center mt-2">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium">{company.glassdoorRating}</span>
                </div>
              )}
              {company.headquarters && (
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1" />{company.headquarters}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Analyze Modal */}
      {showAnalyzeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">AI Company Analysis</h2>
              <button onClick={loadTestData} className="text-sm text-primary-600 hover:underline">Load Test Data</button>
            </div>
            {message.text && (
              <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            <div className="space-y-4">
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name *" className="input-field" />
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Target role (optional)" className="input-field" />
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => { setShowAnalyzeModal(false); setMessage({ type: '', text: '' }); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAnalyze} disabled={!companyName || analyzing} className="btn-primary flex-1 flex items-center justify-center">
                {analyzing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Analyze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
