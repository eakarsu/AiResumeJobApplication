import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coverLettersAPI } from '../services/api';
import { CoverLetter } from '../types';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const CoverLetterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchLetter();
  }, [id]);

  const fetchLetter = async () => {
    try {
      const response = await coverLettersAPI.getOne(id!);
      setLetter(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch cover letter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await coverLettersAPI.update(id!, formData);
      setLetter(response.data);
      setFormData(response.data);
      setMessage({ type: 'success', text: 'Cover letter saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      console.error('Failed to save cover letter:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save cover letter' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!letter) {
    return <div className="text-center py-12">Cover letter not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/cover-letters')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none"
          />
        </div>
        <div className="flex items-center space-x-4">
          {message.text && (
            <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Content</h2>
            <textarea
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your cover letter..."
              className="input-field min-h-[500px] font-serif text-base leading-relaxed"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Company</label>
                <input
                  type="text"
                  value={formData.targetCompany || ''}
                  onChange={(e) => setFormData({ ...formData, targetCompany: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Position</label>
                <input
                  type="text"
                  value={formData.targetPosition || ''}
                  onChange={(e) => setFormData({ ...formData, targetPosition: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                <select
                  value={formData.tone || 'professional'}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="input-field"
                >
                  <option value="professional">Professional</option>
                  <option value="creative">Creative</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterDetail;
