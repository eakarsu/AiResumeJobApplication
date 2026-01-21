import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewsAPI } from '../services/api';
import { Interview } from '../types';
import { Plus, Calendar, Clock, Video, Phone, Building2, MapPin, Trash2 } from 'lucide-react';

const Interviews: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', position: '', interviewType: 'phone', scheduledDate: '', duration: 60 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchInterviews();
  }, [filter]);

  const fetchInterviews = async () => {
    try {
      const params: any = {};
      if (filter === 'upcoming') params.upcoming = 'true';
      if (filter === 'completed') params.status = 'completed';
      const response = await interviewsAPI.getAll(params);
      setInterviews(response.data);
    } catch (error) {
      console.error('Failed to fetch interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await interviewsAPI.create(formData);
      setShowModal(false);
      navigate(`/interviews/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create interview:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this interview?')) return;
    try {
      await interviewsAPI.delete(id);
      setInterviews(interviews.filter(i => i.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'phone': return Phone;
      case 'onsite': return Building2;
      default: return Calendar;
    }
  };

  const isUpcoming = (date: string) => new Date(date) > new Date();

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="text-gray-500">Manage your interview schedule</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" /><span>Add Interview</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {(['all', 'upcoming', 'completed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Interviews List */}
      {interviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h3>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Add Interview</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviews.map((interview) => {
            const Icon = getTypeIcon(interview.interviewType);
            const upcoming = isUpcoming(interview.scheduledDate);
            return (
              <div key={interview.id} onClick={() => navigate(`/interviews/${interview.id}`)} className={`bg-white rounded-xl border p-5 card-hover ${upcoming ? 'border-primary-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${upcoming ? 'bg-primary-100' : 'bg-gray-100'}`}>
                    <Icon className={`w-6 h-6 ${upcoming ? 'text-primary-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${interview.status === 'scheduled' ? 'bg-green-100 text-green-700' : interview.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {interview.status}
                    </span>
                    <button onClick={(e) => handleDelete(interview.id, e)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{interview.position}</h3>
                <p className="text-gray-500 text-sm mb-3">{interview.companyName}</p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(interview.scheduledDate).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  {new Date(interview.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {interview.duration && ` (${interview.duration} min)`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Interview</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Company *" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="input-field" />
              <input type="text" placeholder="Position *" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input-field" />
              <select value={formData.interviewType} onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })} className="input-field">
                <option value="phone">Phone</option>
                <option value="video">Video</option>
                <option value="onsite">On-site</option>
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="panel">Panel</option>
              </select>
              <input type="datetime-local" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} className="input-field" />
              <input type="number" placeholder="Duration (minutes)" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })} className="input-field" />
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} disabled={!formData.companyName || !formData.position || !formData.scheduledDate} className="btn-primary flex-1">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interviews;
