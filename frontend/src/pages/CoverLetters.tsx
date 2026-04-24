import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coverLettersAPI, resumesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CoverLetter, Resume } from '../types';
import { Plus, Mail, Sparkles, Loader2 } from 'lucide-react';
import DataTable, { Column } from '../components/DataTable';
import ExportButtons from '../components/ExportButtons';
import BulkActionBar from '../components/BulkActionBar';
import { useTableSort } from '../hooks/useTableSort';
import { useSelection } from '../hooks/useSelection';
import { SkeletonTable } from '../components/Skeleton';

const CoverLetters: React.FC = () => {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'generate'>('create');
  const [formData, setFormData] = useState({
    title: '', content: '', targetCompany: '', targetPosition: '', tone: 'professional', resumeId: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [clRes, resumeRes] = await Promise.all([coverLettersAPI.getAll(), resumesAPI.getAll()]);
      setCoverLetters(clRes.data);
      setResumes(resumeRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const { sort, toggleSort, sortedData } = useTableSort(coverLetters, 'updatedAt');
  const { selectedIds, toggle, toggleAll, clearSelection, allSelected, selectedCount } = useSelection(sortedData);

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    setCreating(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await coverLettersAPI.create(formData);
      setShowModal(false);
      addToast('success', 'Cover letter created');
      navigate(`/cover-letters/${response.data.id}`);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create cover letter' });
    } finally {
      setCreating(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.targetCompany || !formData.targetPosition) return;
    setGenerating(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await coverLettersAPI.generate({
        company: formData.targetCompany, jobTitle: formData.targetPosition,
        resumeId: formData.resumeId || undefined, tone: formData.tone
      });
      setShowModal(false);
      addToast('success', 'Cover letter generated');
      navigate(`/cover-letters/${response.data.id}`);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to generate cover letter' });
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedCount} cover letter(s)?`)) return;
    try {
      await coverLettersAPI.bulkDelete(Array.from(selectedIds));
      setCoverLetters(coverLetters.filter(cl => !selectedIds.has(cl.id)));
      clearSelection();
      addToast('success', `Deleted ${selectedCount} cover letter(s)`);
    } catch (error) {
      addToast('error', 'Failed to delete cover letters');
    }
  };

  const openModal = (mode: 'create' | 'generate') => {
    setModalMode(mode);
    setFormData({ title: '', content: '', targetCompany: '', targetPosition: '', tone: 'professional', resumeId: '' });
    setShowModal(true);
  };

  const columns: Column<CoverLetter>[] = [
    {
      key: 'title', label: 'Title', sortable: true,
      render: (cl) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <Mail className="w-4 h-4 text-purple-600" />
          </div>
          <span className="font-medium text-gray-900">{cl.title}</span>
        </div>
      )
    },
    { key: 'targetCompany', label: 'Company', sortable: true, render: (cl) => <span className="text-gray-600">{cl.targetCompany || '-'}</span> },
    { key: 'targetPosition', label: 'Position', sortable: true, render: (cl) => <span className="text-gray-600">{cl.targetPosition || '-'}</span> },
    {
      key: 'isAiGenerated', label: 'AI', sortable: false,
      render: (cl) => cl.isAiGenerated ? <div className="flex items-center text-primary-600"><Sparkles className="w-4 h-4 mr-1" /><span className="text-xs">Generated</span></div> : null
    },
    { key: 'updatedAt', label: 'Updated', sortable: true, render: (cl) => <span className="text-gray-500">{new Date(cl.updatedAt).toLocaleDateString()}</span> },
  ];

  const exportColumns = [
    { key: 'title', label: 'Title' }, { key: 'targetCompany', label: 'Company' },
    { key: 'targetPosition', label: 'Position' }, { key: 'updatedAt', label: 'Updated' },
  ];

  if (loading) return <SkeletonTable rows={6} cols={5} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cover Letters</h1>
          <p className="text-gray-500">Create personalized cover letters with AI</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportButtons data={sortedData} columns={exportColumns} filename="cover-letters" />
          <button onClick={() => openModal('generate')} className="btn-primary flex items-center space-x-2">
            <Sparkles className="w-5 h-5" /><span>AI Generate</span>
          </button>
          <button onClick={() => openModal('create')} className="btn-secondary flex items-center space-x-2">
            <Plus className="w-5 h-5" /><span>Create</span>
          </button>
        </div>
      </div>

      {coverLetters.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cover letters yet</h3>
          <p className="text-gray-500 mb-6">Generate your first cover letter with AI</p>
          <button onClick={() => openModal('generate')} className="btn-primary"><Sparkles className="w-5 h-5 mr-2 inline" />Generate with AI</button>
        </div>
      ) : (
        <DataTable data={sortedData} columns={columns} sort={sort} onSort={toggleSort}
          selectable selectedIds={selectedIds} onToggle={toggle} onToggleAll={toggleAll} allSelected={allSelected}
          onRowClick={(cl) => navigate(`/cover-letters/${cl.id}`)} getRowId={(cl) => cl.id} />
      )}

      <BulkActionBar selectedCount={selectedCount} onDelete={handleBulkDelete} onClear={clearSelection} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{modalMode === 'generate' ? 'Generate Cover Letter with AI' : 'Create Cover Letter'}</h2>
            {message.text && <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</div>}
            {modalMode === 'generate' ? (
              <div className="space-y-4">
                <input type="text" value={formData.targetCompany} onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })} placeholder="Company Name *" className="input-field" />
                <input type="text" value={formData.targetPosition} onChange={(e) => setFormData({ ...formData, targetPosition: e.target.value })} placeholder="Position *" className="input-field" />
                <select value={formData.resumeId} onChange={(e) => setFormData({ ...formData, resumeId: e.target.value })} className="input-field">
                  <option value="">Select a resume (optional)</option>
                  {resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
                <select value={formData.tone} onChange={(e) => setFormData({ ...formData, tone: e.target.value })} className="input-field">
                  <option value="professional">Professional</option>
                  <option value="creative">Creative</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Cover Letter Title *" className="input-field" autoFocus />
                <input type="text" value={formData.targetCompany} onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })} placeholder="Company Name (optional)" className="input-field" />
                <input type="text" value={formData.targetPosition} onChange={(e) => setFormData({ ...formData, targetPosition: e.target.value })} placeholder="Position (optional)" className="input-field" />
              </div>
            )}
            <div className="flex space-x-3 mt-6">
              <button onClick={() => { setShowModal(false); setMessage({ type: '', text: '' }); }} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={modalMode === 'generate' ? handleGenerate : handleCreate}
                disabled={modalMode === 'generate' ? (!formData.targetCompany || !formData.targetPosition || generating) : (!formData.title.trim() || creating)}
                className="btn-primary flex-1 flex items-center justify-center disabled:opacity-50"
              >
                {(generating || creating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {modalMode === 'generate' ? (generating ? 'Generating...' : 'Generate') : (creating ? 'Creating...' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverLetters;
