import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Resume } from '../types';
import { Plus, FileText, Sparkles, Star } from 'lucide-react';
import DataTable, { Column } from '../components/DataTable';
import ExportButtons from '../components/ExportButtons';
import BulkActionBar from '../components/BulkActionBar';
import { useTableSort } from '../hooks/useTableSort';
import { useSelection } from '../hooks/useSelection';
import { SkeletonTable } from '../components/Skeleton';

const Resumes: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await resumesAPI.getAll();
      setResumes(response.data);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const { sort, toggleSort, sortedData } = useTableSort(resumes, 'updatedAt');
  const { selectedIds, toggle, toggleAll, clearSelection, allSelected, selectedCount } = useSelection(sortedData);

  const handleCreate = async () => {
    if (!newResumeTitle.trim()) return;
    setCreating(true);
    setError('');
    try {
      const response = await resumesAPI.create({
        title: newResumeTitle,
        experience: [],
        education: [],
        skills: []
      });
      setShowCreateModal(false);
      setNewResumeTitle('');
      addToast('success', 'Resume created');
      navigate(`/resumes/${response.data.id}`);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create resume');
    } finally {
      setCreating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedCount} resume(s)?`)) return;
    try {
      await resumesAPI.bulkDelete(Array.from(selectedIds));
      setResumes(resumes.filter(r => !selectedIds.has(r.id)));
      clearSelection();
      addToast('success', `Deleted ${selectedCount} resume(s)`);
    } catch (error) {
      addToast('error', 'Failed to delete resumes');
    }
  };

  const columns: Column<Resume>[] = [
    {
      key: 'title', label: 'Title', sortable: true,
      render: (r) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
            <FileText className="w-4 h-4 text-primary-600" />
          </div>
          <span className="font-medium text-gray-900">{r.title}</span>
        </div>
      )
    },
    {
      key: 'skills', label: 'Skills', sortable: false,
      render: (r) => <span className="text-gray-500">{r.skills?.length || 0} skills</span>
    },
    {
      key: 'atsScore', label: 'ATS Score', sortable: true,
      render: (r) => r.atsScore ? (
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">{r.atsScore}%</span>
        </div>
      ) : <span className="text-gray-400">-</span>
    },
    {
      key: 'isAiGenerated', label: 'AI', sortable: false,
      render: (r) => r.isAiGenerated ? (
        <div className="flex items-center space-x-1 text-primary-600">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs">Enhanced</span>
        </div>
      ) : null
    },
    {
      key: 'updatedAt', label: 'Updated', sortable: true,
      render: (r) => <span className="text-gray-500">{new Date(r.updatedAt).toLocaleDateString()}</span>
    },
  ];

  const exportColumns = [
    { key: 'title', label: 'Title' },
    { key: 'atsScore', label: 'ATS Score' },
    { key: 'updatedAt', label: 'Updated' },
  ];

  if (loading) return <SkeletonTable rows={6} cols={5} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resumes</h1>
          <p className="text-gray-500">Create and manage your AI-powered resumes</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportButtons data={sortedData} columns={exportColumns} filename="resumes" />
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" /><span>New Resume</span>
          </button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
          <p className="text-gray-500 mb-6">Create your first resume to get started</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">Create Resume</button>
        </div>
      ) : (
        <DataTable
          data={sortedData}
          columns={columns}
          sort={sort}
          onSort={toggleSort}
          selectable
          selectedIds={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          allSelected={allSelected}
          onRowClick={(r) => navigate(`/resumes/${r.id}`)}
          getRowId={(r) => r.id}
        />
      )}

      <BulkActionBar
        selectedCount={selectedCount}
        onDelete={handleBulkDelete}
        onClear={clearSelection}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Resume</h2>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            <input
              type="text"
              value={newResumeTitle}
              onChange={(e) => setNewResumeTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Resume title (e.g., 'Senior Developer Resume')"
              className="input-field mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button onClick={() => { setShowCreateModal(false); setError(''); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} disabled={!newResumeTitle.trim() || creating} className="btn-primary flex-1 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resumes;
