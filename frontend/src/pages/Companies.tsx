import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesAPI, aiAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CompanyResearch } from '../types';
import { Building2, Search, Sparkles, Loader2, Star, Bookmark, BookmarkCheck, MapPin } from 'lucide-react';
import DataTable, { Column } from '../components/DataTable';
import ExportButtons from '../components/ExportButtons';
import BulkActionBar from '../components/BulkActionBar';
import { useTableSort } from '../hooks/useTableSort';
import { useSelection } from '../hooks/useSelection';
import { SkeletonTable } from '../components/Skeleton';

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
  const { addToast } = useToast();

  useEffect(() => { fetchCompanies(); }, []);

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

  const { sort, toggleSort, sortedData } = useTableSort(companies, 'companyName');
  const { selectedIds, toggle, toggleAll, clearSelection, allSelected, selectedCount } = useSelection(sortedData);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchCompanies(); };

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
      addToast('success', 'Company analyzed');
      navigate(`/companies/${response.data.savedCompany?.id || response.data.id}`);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to analyze company' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedCount} company research(es)?`)) return;
    try {
      await companiesAPI.bulkDelete(Array.from(selectedIds));
      setCompanies(companies.filter(c => !selectedIds.has(c.id)));
      clearSelection();
      addToast('success', `Deleted ${selectedCount} company research(es)`);
    } catch (error) {
      addToast('error', 'Failed to delete');
    }
  };

  const columns: Column<CompanyResearch>[] = [
    {
      key: 'companyName', label: 'Company', sortable: true,
      render: (c) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
            <Building2 className="w-4 h-4 text-primary-600" />
          </div>
          <span className="font-medium text-gray-900">{c.companyName}</span>
        </div>
      )
    },
    { key: 'industry', label: 'Industry', sortable: true, render: (c) => <span className="text-gray-600">{c.industry || '-'}</span> },
    { key: 'size', label: 'Size', sortable: true, render: (c) => <span className="capitalize text-gray-600">{c.size || '-'}</span> },
    { key: 'headquarters', label: 'HQ', sortable: true, render: (c) => c.headquarters ? <div className="flex items-center text-gray-500"><MapPin className="w-3 h-3 mr-1" />{c.headquarters}</div> : <span className="text-gray-400">-</span> },
    {
      key: 'glassdoorRating', label: 'Rating', sortable: true,
      render: (c) => c.glassdoorRating ? <div className="flex items-center"><Star className="w-4 h-4 text-yellow-500 mr-1" /><span className="font-medium">{c.glassdoorRating}</span></div> : <span className="text-gray-400">-</span>
    },
    {
      key: 'isBookmarked', label: '', sortable: false,
      render: (c) => (
        <button onClick={(e) => handleBookmark(c.id, e)} className={`p-1 rounded ${c.isBookmarked ? 'text-primary-600' : 'text-gray-400 hover:text-primary-500'}`}>
          {c.isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      )
    },
  ];

  const exportColumns = [
    { key: 'companyName', label: 'Company' }, { key: 'industry', label: 'Industry' },
    { key: 'size', label: 'Size' }, { key: 'headquarters', label: 'HQ' }, { key: 'glassdoorRating', label: 'Rating' },
  ];

  if (loading) return <SkeletonTable rows={6} cols={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Research</h1>
          <p className="text-gray-500">Research companies before applying</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportButtons data={sortedData} columns={exportColumns} filename="companies" />
          <button onClick={() => setShowAnalyzeModal(true)} className="btn-primary flex items-center space-x-2">
            <Sparkles className="w-5 h-5" /><span>AI Analysis</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies..." className="input-with-icon" />
          </div>
          <button type="submit" className="btn-primary px-6 flex items-center gap-2"><Search className="w-4 h-4" /><span>Search</span></button>
        </div>
      </form>

      {companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-500">Try AI analysis to research a company</p>
        </div>
      ) : (
        <DataTable data={sortedData} columns={columns} sort={sort} onSort={toggleSort}
          selectable selectedIds={selectedIds} onToggle={toggle} onToggleAll={toggleAll} allSelected={allSelected}
          onRowClick={(c) => navigate(`/companies/${c.id}`)} getRowId={(c) => c.id} />
      )}

      <BulkActionBar selectedCount={selectedCount} onDelete={handleBulkDelete} onClear={clearSelection} />

      {showAnalyzeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">AI Company Analysis</h2>
            {message.text && <div className={`p-3 rounded-lg mb-4 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message.text}</div>}
            <div className="space-y-4">
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name *" className="input-field" />
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Target role (optional)" className="input-field" />
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => { setShowAnalyzeModal(false); setMessage({ type: '', text: '' }); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAnalyze} disabled={!companyName || analyzing} className="btn-primary flex-1 flex items-center justify-center">
                {analyzing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Analyze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
