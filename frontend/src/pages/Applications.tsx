import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import { JobApplication } from '../types';
import { Plus, ClipboardList, Building2, Calendar, MoreVertical, Trash2 } from 'lucide-react';

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', position: '', location: '', status: 'applied' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      const response = await applicationsAPI.getAll({ status: filter || undefined });
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await applicationsAPI.create(formData);
      setShowModal(false);
      navigate(`/applications/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create application:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this application?')) return;
    try {
      await applicationsAPI.delete(id);
      setApplications(applications.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete application:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'status-applied', screening: 'status-screening', interview: 'status-interview',
      offer: 'status-offer', rejected: 'status-rejected', accepted: 'status-accepted', withdrawn: 'status-withdrawn'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statuses = ['', 'applied', 'screening', 'interview', 'offer', 'rejected', 'accepted', 'withdrawn'];

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500">Track your job applications</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" /><span>Add Application</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications {filter && `with status "${filter}"`}</h3>
          <p className="text-gray-500 mb-6">Start tracking your job applications</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Add Application</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id} onClick={() => navigate(`/applications/${app.id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-900">{app.companyName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{app.position}</td>
                  <td className="px-6 py-4">
                    <span className={`status-badge ${getStatusColor(app.status)}`}>{app.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{new Date(app.applicationDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={`w-2 h-2 rounded-full mr-1 ${n <= app.priority ? 'bg-yellow-400' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={(e) => handleDelete(app.id, e)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Application</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Company Name *" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="input-field" />
              <input type="text" placeholder="Position *" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input-field" />
              <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field" />
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field">
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
              </select>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} disabled={!formData.companyName || !formData.position} className="btn-primary flex-1">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
