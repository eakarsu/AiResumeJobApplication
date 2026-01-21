import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewsAPI } from '../services/api';
import { Interview } from '../types';
import { ArrowLeft, Save, Sparkles, Loader2, Calendar, Clock, MapPin, Link as LinkIcon, User } from 'lucide-react';

const InterviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchInterview();
  }, [id]);

  const fetchInterview = async () => {
    try {
      const response = await interviewsAPI.getOne(id!);
      setInterview(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await interviewsAPI.update(id!, formData);
      setInterview({ ...interview!, ...formData });
      setMessage({ type: 'success', text: 'Interview saved successfully!' });
    } catch (error: any) {
      console.error('Failed to save:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save interview' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setGenerating(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await interviewsAPI.generateQuestions(id!, {
        count: 10,
        experienceLevel: 'mid',
        skills: interview?.position ? [interview.position] : []
      });
      setInterview({ ...interview!, prepQuestions: response.data });
      setMessage({ type: 'success', text: `Generated ${response.data.length} prep questions!` });
    } catch (error: any) {
      console.error('Failed to generate questions:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to generate questions. Check your OpenRouter API key.' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (!interview) {
    return <div className="text-center py-12">Interview not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/interviews')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{interview.position}</h1>
            <p className="text-gray-500">{interview.companyName}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleGenerateQuestions} disabled={generating} className="btn-secondary flex items-center space-x-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Generate Prep Questions</span>
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save</span>
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
          {/* Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Interview Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.interviewType} onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })} className="input-field">
                  <option value="phone">Phone</option>
                  <option value="video">Video</option>
                  <option value="onsite">On-site</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="panel">Panel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field">
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input type="datetime-local" value={formData.scheduledDate?.slice(0, 16)} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                <input type="number" value={formData.duration || ''} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer</label>
                <input type="text" value={formData.interviewerName || ''} onChange={(e) => setFormData({ ...formData, interviewerName: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                <input type="url" value={formData.meetingLink || ''} onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Notes</h2>
            <textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Preparation notes..." className="input-field min-h-[100px]" />
          </div>

          {/* Feedback */}
          {formData.status === 'completed' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">Feedback</h2>
              <textarea value={formData.feedback || ''} onChange={(e) => setFormData({ ...formData, feedback: e.target.value })} placeholder="How did it go?" className="input-field min-h-[100px] mb-4" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setFormData({ ...formData, rating: n })} className={`w-10 h-10 rounded-lg ${n <= (formData.rating || 0) ? 'bg-yellow-400' : 'bg-gray-100'}`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Prep Questions */}
          {interview.prepQuestions && interview.prepQuestions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">Practice Questions</h2>
              <div className="space-y-4">
                {interview.prepQuestions.map((q, index) => (
                  <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">Q{index + 1}</span>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{q.difficulty}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{q.category}</span>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900 mb-2">{q.question}</p>
                    {q.suggestedAnswer && <p className="text-sm text-gray-600 mb-2"><strong>Suggested:</strong> {q.suggestedAnswer}</p>}
                    {q.tips && <p className="text-sm text-primary-600"><strong>Tip:</strong> {q.tips}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Quick Info</h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3" />
                {new Date(interview.scheduledDate).toLocaleDateString()}
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-3" />
                {new Date(interview.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {interview.duration && (
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3" />
                  {interview.duration} minutes
                </div>
              )}
              {interview.location && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3" />
                  {interview.location}
                </div>
              )}
              {interview.meetingLink && (
                <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary-600 hover:underline">
                  <LinkIcon className="w-5 h-5 mr-3" />
                  Join Meeting
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewDetail;
