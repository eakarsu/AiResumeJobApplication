import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { JobApplication } from '../types';
import { Plus, ClipboardList, Building2 } from 'lucide-react';
import DataTable, { Column } from '../components/DataTable';
import ExportButtons from '../components/ExportButtons';
import BulkActionBar from '../components/BulkActionBar';
import { useTableSort } from '../hooks/useTableSort';
import { useSelection } from '../hooks/useSelection';
import { SkeletonTable } from '../components/Skeleton';

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', position: '', location: '', status: 'applied' });
  const navigate = useNavigate();
  const { addToast } = useToast();

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

  const { sort, toggleSort, sortedData } = useTableSort(applications, 'applicationDate');
  const { selectedIds, toggle, toggleAll, clearSelection, allSelected, selectedCount } = useSelection(sortedData);

  const handleCreate = async () => {
    try {
      const response = await applicationsAPI.create(formData);
      setShowModal(false);
      addToast('success', 'Application created');
      navigate(`/applications/${response.data.id}`);
    } catch (error) {
      addToast('error', 'Failed to create application');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedCount} application(s)?`)) return;
    try {
      await applicationsAPI.bulkDelete(Array.from(selectedIds));
      setApplications(applications.filter(a => !selectedIds.has(a.id)));
      clearSelection();
      addToast('success', `Deleted ${selectedCount} application(s)`);
    } catch (error) {
      addToast('error', 'Failed to delete applications');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      await applicationsAPI.bulkUpdate(Array.from(selectedIds), { status });
      setApplications(applications.map(a => selectedIds.has(a.id) ? { ...a, status } : a));
      clearSelection();
      addToast('success', `Updated ${selectedCount} application(s) to "${status}"`);
    } catch (error) {
      addToast('error', 'Failed to update applications');
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

  const columns: Column<JobApplication>[] = [
    {
      key: 'companyName', label: 'Company', sortable: true,
      render: (app) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
            <Building2 className="w-4 h-4 text-gray-400" />
          </div>
          <span className="font-medium text-gray-900">{app.companyName}</span>
        </div>
      )
    },
    { key: 'position', label: 'Position', sortable: true },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (app) => <span className={`status-badge ${getStatusColor(app.status)}`}>{app.status}</span>
    },
    {
      key: 'applicationDate', label: 'Date', sortable: true,
      render: (app) => <span className="text-gray-500">{new Date(app.applicationDate).toLocaleDateString()}</span>
    },
    {
      key: 'priority', label: 'Priority', sortable: true,
      render: (app) => (
        <div className="flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`w-2 h-2 rounded-full mr-1 ${n <= app.priority ? 'bg-yellow-400' : 'bg-gray-200'}`} />
          ))}
        </div>
      )
    },
  ];

  const exportColumns = [
    { key: 'companyName', label: 'Company' },
    { key: 'position', label: 'Position' },
    { key: 'status', label: 'Status' },
    { key: 'applicationDate', label: 'Date' },
    { key: 'priority', label: 'Priority' },
  ];

  if (loading) return <SkeletonTable rows={8} cols={5} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500">Track your job applications</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportButtons data={sortedData} columns={exportColumns} filename="applications" />
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" /><span>Add Application</span>
          </button>
        </div>
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

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications {filter && `with status "${filter}"`}</h3>
          <p className="text-gray-500 mb-6">Start tracking your job applications</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Add Application</button>
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
          onRowClick={(app) => navigate(`/applications/${app.id}`)}
          getRowId={(app) => app.id}
        />
      )}

      <BulkActionBar
        selectedCount={selectedCount}
        onDelete={handleBulkDelete}
        onStatusUpdate={handleBulkStatusUpdate}
        onClear={clearSelection}
        statusOptions={['applied', 'screening', 'interview', 'offer', 'rejected', 'accepted', 'withdrawn']}
      />

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
