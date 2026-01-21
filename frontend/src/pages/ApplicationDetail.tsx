import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import { JobApplication } from '../types';
import { ArrowLeft, Save, Building2, Calendar, MapPin, User, Mail, Clock, CheckCircle, Loader2 } from 'lucide-react';

const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const response = await applicationsAPI.getOne(id!);
      setApplication(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await applicationsAPI.update(id!, formData);
      setApplication({ ...application!, ...formData });
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'status-applied', screening: 'status-screening', interview: 'status-interview',
      offer: 'status-offer', rejected: 'status-rejected', accepted: 'status-accepted', withdrawn: 'status-withdrawn'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (!application) {
    return <div className="text-center py-12">Application not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/applications')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{application.position}</h1>
            <p className="text-gray-500">{application.companyName}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Application Status</h2>
            <div className="flex flex-wrap gap-2">
              {['saved', 'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFormData({ ...formData, status })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.status === status ? `${getStatusColor(status)}` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input type="text" value={formData.companyName || ''} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input type="text" value={formData.position || ''} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                <input type="text" value={formData.salary || ''} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input type="text" value={formData.contactPerson || ''} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input type="email" value={formData.contactEmail || ''} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Notes</h2>
            <textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Add notes about this application..." className="input-field min-h-[150px]" />
          </div>

          {/* Next Action */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Next Action</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <input type="text" value={formData.nextAction || ''} onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })} placeholder="e.g., Follow up, Prepare for interview" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={formData.nextActionDate?.split('T')[0] || ''} onChange={(e) => setFormData({ ...formData, nextActionDate: e.target.value })} className="input-field" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Priority</h2>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setFormData({ ...formData, priority: n })} className={`w-10 h-10 rounded-lg ${n <= formData.priority ? 'bg-yellow-400' : 'bg-gray-100'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          {application.timeline && application.timeline.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">Timeline</h2>
              <div className="space-y-4">
                {application.timeline.map((event, index) => (
                  <div key={event.id} className="flex space-x-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                      {index < application.timeline!.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-gray-900 capitalize">{event.eventType.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{new Date(event.eventDate).toLocaleDateString()}</p>
                      {event.description && <p className="text-sm text-gray-600 mt-1">{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interviews */}
          {application.interviews && application.interviews.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">Interviews</h2>
              <div className="space-y-3">
                {application.interviews.map((interview) => (
                  <div key={interview.id} onClick={() => navigate(`/interviews/${interview.id}`)} className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <p className="font-medium text-gray-900 capitalize">{interview.interviewType}</p>
                    <p className="text-sm text-gray-500">{new Date(interview.scheduledDate).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
