import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resumesAPI } from '../services/api';
import { Resume } from '../types';
import { ArrowLeft, Save, Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';

const ResumeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchResume();
  }, [id]);

  const fetchResume = async () => {
    try {
      const response = await resumesAPI.getOne(id!);
      setResume(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch resume:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await resumesAPI.update(id!, formData);
      setResume(response.data);
      setFormData(response.data);
      setMessage({ type: 'success', text: 'Resume saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      console.error('Failed to save resume:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save resume' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSummary = async () => {
    setAiLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await resumesAPI.generateSummary(id!);
      setFormData({ ...formData, summary: response.data.summary });
      setMessage({ type: 'success', text: 'AI summary generated! Remember to save.' });
    } catch (error: any) {
      console.error('Failed to generate summary:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to generate summary. Check your OpenRouter API key.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleOptimize = async () => {
    setAiLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await resumesAPI.optimize(id!);
      setMessage({ type: 'success', text: `ATS Score: ${response.data.score}/100. Suggestions: ${response.data.suggestions.slice(0, 2).join('; ')}` });
    } catch (error: any) {
      console.error('Failed to optimize resume:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to optimize resume. Check your OpenRouter API key.' });
    } finally {
      setAiLoading(false);
    }
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [
        ...formData.experience,
        { company: '', title: '', location: '', startDate: '', endDate: '', bullets: [''] }
      ]
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = [...formData.experience];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, experience: updated });
  };

  const removeExperience = (index: number) => {
    const updated = formData.experience.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, experience: updated });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [
        ...formData.education,
        { school: '', degree: '', location: '', graduationDate: '' }
      ]
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...formData.education];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, education: updated });
  };

  const removeEducation = (index: number) => {
    const updated = formData.education.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, education: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!resume) {
    return <div className="text-center py-12">Resume not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/resumes')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateSummary}
            disabled={aiLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Generate Summary</span>
          </button>
          <button
            onClick={handleOptimize}
            disabled={aiLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Optimize</span>
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Professional Summary</h2>
            <textarea
              value={formData.summary || ''}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Write a compelling summary of your professional experience..."
              className="input-field min-h-[120px]"
            />
          </div>

          {/* Experience */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Experience</h2>
              <button onClick={addExperience} className="btn-secondary text-sm flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="space-y-6">
              {formData.experience?.map((exp: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                  <button
                    onClick={() => removeExperience(index)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      placeholder="Company"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => updateExperience(index, 'title', e.target.value)}
                      placeholder="Job Title"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExperience(index, 'location', e.target.value)}
                      placeholder="Location"
                      className="input-field"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                        placeholder="Start Date"
                        className="input-field"
                      />
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                        placeholder="End Date"
                        className="input-field"
                      />
                    </div>
                  </div>
                  <textarea
                    value={exp.bullets?.join('\n') || ''}
                    onChange={(e) => updateExperience(index, 'bullets', e.target.value.split('\n'))}
                    placeholder="Achievements and responsibilities (one per line)"
                    className="input-field min-h-[100px]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Education</h2>
              <button onClick={addEducation} className="btn-secondary text-sm flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="space-y-4">
              {formData.education?.map((edu: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                  <button
                    onClick={() => removeEducation(index)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => updateEducation(index, 'school', e.target.value)}
                      placeholder="School"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      placeholder="Degree"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={edu.location}
                      onChange={(e) => updateEducation(index, 'location', e.target.value)}
                      placeholder="Location"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={edu.graduationDate}
                      onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                      placeholder="Graduation Date"
                      className="input-field"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Skills</h2>
            <textarea
              value={formData.skills?.join(', ') || ''}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
              placeholder="Enter skills separated by commas"
              className="input-field min-h-[120px]"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {formData.skills?.map((skill: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {resume.atsScore && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">ATS Score</h2>
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold text-primary-600">{resume.atsScore}%</span>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-primary-100">
                  <div
                    style={{ width: `${resume.atsScore}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeDetail;
