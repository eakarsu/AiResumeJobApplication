import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Interview } from '../types';
import { Plus, Calendar, Clock, Video, Phone, Building2 } from 'lucide-react';
import DataTable, { Column } from '../components/DataTable';
import ExportButtons from '../components/ExportButtons';
import BulkActionBar from '../components/BulkActionBar';
import { useTableSort } from '../hooks/useTableSort';
import { useSelection } from '../hooks/useSelection';
import { SkeletonTable } from '../components/Skeleton';

const Interviews: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', position: '', interviewType: 'phone', scheduledDate: '', duration: 60 });
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => { fetchInterviews(); }, [filter]);

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

  const { sort, toggleSort, sortedData } = useTableSort(interviews, 'scheduledDate');
  const { selectedIds, toggle, toggleAll, clearSelection, allSelected, selectedCount } = useSelection(sortedData);

  const handleCreate = async () => {
    try {
      const response = await interviewsAPI.create(formData);
      setShowModal(false);
      addToast('success', 'Interview added');
      navigate(`/interviews/${response.data.id}`);
    } catch (error) {
      addToast('error', 'Failed to create interview');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedCount} interview(s)?`)) return;
    try {
      await interviewsAPI.bulkDelete(Array.from(selectedIds));
      setInterviews(interviews.filter(i => !selectedIds.has(i.id)));
      clearSelection();
      addToast('success', `Deleted ${selectedCount} interview(s)`);
    } catch (error) {
      addToast('error', 'Failed to delete interviews');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-blue-500" />;
      case 'phone': return <Phone className="w-4 h-4 text-green-500" />;
      case 'onsite': return <Building2 className="w-4 h-4 text-orange-500" />;
      default: return <Calendar className="w-4 h-4 text-gray-500" />;
    }
  };

  const columns: Column<Interview>[] = [
    {
      key: 'companyName', label: 'Company', sortable: true,
      render: (i) => <span className="font-medium text-gray-900">{i.companyName}</span>
    },
    { key: 'position', label: 'Position', sortable: true },
    {
      key: 'interviewType', label: 'Type', sortable: true,
      render: (i) => <div className="flex items-center space-x-1.5">{getTypeIcon(i.interviewType)}<span className="capitalize">{i.interviewType}</span></div>
    },
    {
      key: 'scheduledDate', label: 'Date', sortable: true,
      render: (i) => (
        <div>
          <p className="text-gray-900">{new Date(i.scheduledDate).toLocaleDateString()}</p>
          <p className="text-xs text-gray-500">{new Date(i.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      )
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (i) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          i.status === 'scheduled' ? 'bg-green-100 text-green-700' :
          i.status === 'completed' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>{i.status}</span>
      )
    },
    {
      key: 'duration', label: 'Duration', sortable: true,
      render: (i) => i.duration ? <span className="text-gray-500">{i.duration} min</span> : <span className="text-gray-400">-</span>
    },
  ];

  const exportColumns = [
    { key: 'companyName', label: 'Company' }, { key: 'position', label: 'Position' },
    { key: 'interviewType', label: 'Type' }, { key: 'scheduledDate', label: 'Date' },
    { key: 'status', label: 'Status' },
  ];

  if (loading) return <SkeletonTable rows={6} cols={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="text-gray-500">Manage your interview schedule</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportButtons data={sortedData} columns={exportColumns} filename="interviews" />
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" /><span>Add Interview</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-2">
        {(['all', 'upcoming', 'completed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {interviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h3>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4">Add Interview</button>
        </div>
      ) : (
        <DataTable data={sortedData} columns={columns} sort={sort} onSort={toggleSort}
          selectable selectedIds={selectedIds} onToggle={toggle} onToggleAll={toggleAll} allSelected={allSelected}
          onRowClick={(i) => navigate(`/interviews/${i.id}`)} getRowId={(i) => i.id} />
      )}

      <BulkActionBar selectedCount={selectedCount} onDelete={handleBulkDelete} onClear={clearSelection} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Interview</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Company *" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="input-field" />
              <input type="text" placeholder="Position *" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input-field" />
              <select value={formData.interviewType} onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })} className="input-field">
                <option value="phone">Phone</option><option value="video">Video</option><option value="onsite">On-site</option>
                <option value="technical">Technical</option><option value="behavioral">Behavioral</option><option value="panel">Panel</option>
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
