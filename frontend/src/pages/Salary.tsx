import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salaryAPI, aiAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SalaryResearch } from '../types';
import { DollarSign, Search, Sparkles, Loader2, MapPin } from 'lucide-react';
import DataTable, { Column } from '../components/DataTable';
import ExportButtons from '../components/ExportButtons';
import BulkActionBar from '../components/BulkActionBar';
import { useTableSort } from '../hooks/useTableSort';
import { useSelection } from '../hooks/useSelection';
import { SkeletonTable } from '../components/Skeleton';

const Salary: React.FC = () => {
  const [salaries, setSalaries] = useState<SalaryResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ jobTitle: '', location: '', experienceLevel: '' });
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => { fetchSalaries(); }, []);

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

  const { sort, toggleSort, sortedData } = useTableSort(salaries, 'salaryMedian');
  const { selectedIds, toggle, toggleAll, clearSelection, allSelected, selectedCount } = useSelection(sortedData);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchSalaries(); };

  const handleGetInsights = async () => {
    if (!search.jobTitle || !search.location) return;
    setAnalyzing(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await aiAPI.getSalaryInsights({
        jobTitle: search.jobTitle, location: search.location, experienceLevel: search.experienceLevel || 'mid'
      });
      setInsights(response.data);
      setMessage({ type: 'success', text: 'Salary insights generated!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to get salary insights' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedCount} salary record(s)?`)) return;
    try {
      await salaryAPI.bulkDelete(Array.from(selectedIds));
      setSalaries(salaries.filter(s => !selectedIds.has(s.id)));
      clearSelection();
      addToast('success', `Deleted ${selectedCount} salary record(s)`);
    } catch (error) {
      addToast('error', 'Failed to delete');
    }
  };

  const formatSalary = (amount: number) => `$${(amount / 1000).toFixed(0)}k`;

  const columns: Column<SalaryResearch>[] = [
    {
      key: 'jobTitle', label: 'Job Title', sortable: true,
      render: (s) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <span className="font-medium text-gray-900">{s.jobTitle}</span>
        </div>
      )
    },
    {
      key: 'location', label: 'Location', sortable: true,
      render: (s) => <div className="flex items-center text-gray-600"><MapPin className="w-3 h-3 mr-1" />{s.location}</div>
    },
    { key: 'experienceLevel', label: 'Level', sortable: true, render: (s) => <span className="capitalize text-gray-600">{s.experienceLevel}</span> },
    {
      key: 'salaryMin', label: 'Range', sortable: true,
      render: (s) => <span className="text-gray-900">{formatSalary(s.salaryMin)} - {formatSalary(s.salaryMax)}</span>
    },
    {
      key: 'salaryMedian', label: 'Median', sortable: true,
      render: (s) => <span className="font-semibold text-green-600">{formatSalary(s.salaryMedian)}</span>
    },
  ];

  const exportColumns = [
    { key: 'jobTitle', label: 'Job Title' }, { key: 'location', label: 'Location' },
    { key: 'experienceLevel', label: 'Level' }, { key: 'salaryMin', label: 'Min Salary' },
    { key: 'salaryMax', label: 'Max Salary' }, { key: 'salaryMedian', label: 'Median Salary' },
  ];

  if (loading) return <SkeletonTable rows={6} cols={5} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Research</h1>
          <p className="text-gray-500">Explore market salary data</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportButtons data={sortedData} columns={exportColumns} filename="salary-data" />
          <button onClick={() => setShowInsightsModal(true)} className="btn-primary flex items-center space-x-2">
            <Sparkles className="w-5 h-5" /><span>AI Insights</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input type="text" value={search.jobTitle} onChange={(e) => setSearch({ ...search, jobTitle: e.target.value })} placeholder="Job title" className="input-with-icon" />
          </div>
          <button type="submit" className="btn-primary px-6 flex items-center gap-2"><Search className="w-4 h-4" /><span>Search</span></button>
        </form>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input type="text" value={search.location} onChange={(e) => setSearch({ ...search, location: e.target.value })} placeholder="Location" className="input-with-icon" />
          </div>
          <select value={search.experienceLevel} onChange={(e) => setSearch({ ...search, experienceLevel: e.target.value })} className="input-field w-auto min-w-[140px]">
            <option value="">All Levels</option><option value="entry">Entry</option><option value="mid">Mid</option>
            <option value="senior">Senior</option><option value="lead">Lead</option>
          </select>
        </div>
      </div>

      {salaries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No salary data found</h3>
          <p className="text-gray-500">Try different search criteria or get AI insights</p>
        </div>
      ) : (
        <DataTable data={sortedData} columns={columns} sort={sort} onSort={toggleSort}
          selectable selectedIds={selectedIds} onToggle={toggle} onToggleAll={toggleAll} allSelected={allSelected}
          onRowClick={(s) => navigate(`/salary/${s.id}`)} getRowId={(s) => s.id} />
      )}

      <BulkActionBar selectedCount={selectedCount} onDelete={handleBulkDelete} onClear={clearSelection} />

      {showInsightsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">AI Salary Insights</h2>
            {message.text && <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</div>}
            {!insights ? (
              <>
                <div className="space-y-4">
                  <input type="text" value={search.jobTitle} onChange={(e) => setSearch({ ...search, jobTitle: e.target.value })} placeholder="Job title *" className="input-field" />
                  <input type="text" value={search.location} onChange={(e) => setSearch({ ...search, location: e.target.value })} placeholder="Location *" className="input-field" />
                  <select value={search.experienceLevel} onChange={(e) => setSearch({ ...search, experienceLevel: e.target.value })} className="input-field">
                    <option value="">Experience Level</option><option value="entry">Entry</option>
                    <option value="mid">Mid</option><option value="senior">Senior</option><option value="lead">Lead</option>
                  </select>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button onClick={() => { setShowInsightsModal(false); setMessage({ type: '', text: '' }); }} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleGetInsights} disabled={!search.jobTitle || !search.location || analyzing} className="btn-primary flex-1 flex items-center justify-center">
                    {analyzing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Get Insights
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">{search.jobTitle} in {search.location}</p>
                  <div className="flex items-center justify-center space-x-4">
                    <div><p className="text-2xl font-bold text-gray-900">{formatSalary(insights.salaryRange.min)}</p><p className="text-xs text-gray-500">Min</p></div>
                    <div><p className="text-3xl font-bold text-green-600">{formatSalary(insights.salaryRange.median)}</p><p className="text-xs text-gray-500">Median</p></div>
                    <div><p className="text-2xl font-bold text-gray-900">{formatSalary(insights.salaryRange.max)}</p><p className="text-xs text-gray-500">Max</p></div>
                  </div>
                </div>
                {insights.factors?.length > 0 && (
                  <div className="mb-4"><h3 className="font-medium mb-2">Factors Affecting Salary</h3>
                    <ul className="list-disc pl-5 text-gray-600 space-y-1">{insights.factors.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul>
                  </div>
                )}
                {insights.negotiationTips?.length > 0 && (
                  <div className="bg-primary-50 rounded-lg p-4"><h3 className="font-medium mb-2 text-primary-800">Negotiation Tips</h3>
                    <ul className="list-disc pl-5 text-primary-700 space-y-1">{insights.negotiationTips.map((tip: string, i: number) => <li key={i}>{tip}</li>)}</ul>
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
