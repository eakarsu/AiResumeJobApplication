import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coverLettersAPI, resumesAPI } from '../services/api';
import { CoverLetter, Resume } from '../types';
import { Plus, Mail, Sparkles, Trash2, Loader2 } from 'lucide-react';

const CoverLetters: React.FC = () => {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'generate'>('create');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetCompany: '',
    targetPosition: '',
    tone: 'professional',
    resumeId: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const loadTestData = () => {
    setFormData({
      ...formData,
      targetCompany: 'Google',
      targetPosition: 'Senior Software Engineer',
      tone: 'professional'
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clRes, resumeRes] = await Promise.all([
        coverLettersAPI.getAll(),
        resumesAPI.getAll()
      ]);
      setCoverLetters(clRes.data);
      setResumes(resumeRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) return;
    setCreating(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await coverLettersAPI.create(formData);
      setShowModal(false);
      navigate(`/cover-letters/${response.data.id}`);
    } catch (error: any) {
      console.error('Failed to create cover letter:', error);
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
        company: formData.targetCompany,
        jobTitle: formData.targetPosition,
        resumeId: formData.resumeId || undefined,
        tone: formData.tone
      });
      setShowModal(false);
      navigate(`/cover-letters/${response.data.id}`);
    } catch (error: any) {
      console.error('Failed to generate cover letter:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to generate cover letter. Check your OpenRouter API key.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this cover letter?')) return;
    try {
      await coverLettersAPI.delete(id);
      setCoverLetters(coverLetters.filter(cl => cl.id !== id));
    } catch (error) {
      console.error('Failed to delete cover letter:', error);
    }
  };

  const openModal = (mode: 'create' | 'generate') => {
    setModalMode(mode);
    setFormData({
      title: '',
      content: '',
      targetCompany: '',
      targetPosition: '',
      tone: 'professional',
      resumeId: ''
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cover Letters</h1>
          <p className="text-gray-500">Create personalized cover letters with AI</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => openModal('generate')} className="btn-primary flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>AI Generate</span>
          </button>
          <button onClick={() => openModal('create')} className="btn-secondary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Manually</span>
          </button>
        </div>
      </div>

      {coverLetters.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cover letters yet</h3>
          <p className="text-gray-500 mb-6">Generate your first cover letter with AI</p>
          <button onClick={() => openModal('generate')} className="btn-primary">
            <Sparkles className="w-5 h-5 mr-2 inline" />
            Generate with AI
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coverLetters.map((letter) => (
            <div
              key={letter.id}
              onClick={() => navigate(`/cover-letters/${letter.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <button
                  onClick={(e) => handleDelete(letter.id, e)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{letter.title}</h3>
              {letter.targetCompany && (
                <p className="text-sm text-gray-500">
                  {letter.targetCompany} • {letter.targetPosition}
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">
                  {new Date(letter.updatedAt).toLocaleDateString()}
                </span>
                {letter.isAiGenerated && (
                  <div className="flex items-center space-x-1 text-primary-600">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs">AI Generated</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {modalMode === 'generate' ? 'Generate Cover Letter with AI' : 'Create Cover Letter'}
              </h2>
              {modalMode === 'generate' && (
                <button onClick={loadTestData} className="text-sm text-primary-600 hover:underline">Load Test Data</button>
              )}
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}

            {modalMode === 'generate' ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.targetCompany}
                  onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                  placeholder="Company Name *"
                  className="input-field"
                />
                <input
                  type="text"
                  value={formData.targetPosition}
                  onChange={(e) => setFormData({ ...formData, targetPosition: e.target.value })}
                  placeholder="Position *"
                  className="input-field"
                />
                <select
                  value={formData.resumeId}
                  onChange={(e) => setFormData({ ...formData, resumeId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select a resume (optional)</option>
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
                <select
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="input-field"
                >
                  <option value="professional">Professional</option>
                  <option value="creative">Creative</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Cover Letter Title *"
                  className="input-field"
                  autoFocus
                />
                <input
                  type="text"
                  value={formData.targetCompany}
                  onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                  placeholder="Company Name (optional)"
                  className="input-field"
                />
                <input
                  type="text"
                  value={formData.targetPosition}
                  onChange={(e) => setFormData({ ...formData, targetPosition: e.target.value })}
                  placeholder="Position (optional)"
                  className="input-field"
                />
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button onClick={() => { setShowModal(false); setMessage({ type: '', text: '' }); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={modalMode === 'generate' ? handleGenerate : handleCreate}
                disabled={
                  modalMode === 'generate'
                    ? (!formData.targetCompany || !formData.targetPosition || generating)
                    : (!formData.title.trim() || creating)
                }
                className="btn-primary flex-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
