import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumesAPI } from '../services/api';
import { Resume } from '../types';
import { Plus, FileText, Sparkles, MoreVertical, Trash2, Edit, Star } from 'lucide-react';

const Resumes: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      navigate(`/resumes/${response.data.id}`);
    } catch (error: any) {
      console.error('Failed to create resume:', error);
      setError(error.response?.data?.error || 'Failed to create resume');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumesAPI.delete(id);
      setResumes(resumes.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete resume:', error);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Resumes</h1>
          <p className="text-gray-500">Create and manage your AI-powered resumes</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Resume</span>
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
          <p className="text-gray-500 mb-6">Create your first resume to get started</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create Resume
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              onClick={() => navigate(`/resumes/${resume.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                <button
                  onClick={(e) => handleDelete(resume.id, e)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{resume.title}</h3>
              <p className="text-sm text-gray-500 mb-3">
                {resume.skills.length} skills • Updated {new Date(resume.updatedAt).toLocaleDateString()}
              </p>
              <div className="flex items-center justify-between">
                {resume.atsScore && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{resume.atsScore}% ATS Score</span>
                  </div>
                )}
                {resume.isAiGenerated && (
                  <div className="flex items-center space-x-1 text-primary-600">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs">AI Enhanced</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Resume</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
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
              <button onClick={() => { setShowCreateModal(false); setError(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newResumeTitle.trim() || creating}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
