import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { networkAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { NetworkContact } from '../types';
import { Plus, Users, Search, Mail, Phone, Linkedin } from 'lucide-react';
import DataTable, { Column } from '../components/DataTable';
import ExportButtons from '../components/ExportButtons';
import BulkActionBar from '../components/BulkActionBar';
import { useTableSort } from '../hooks/useTableSort';
import { useSelection } from '../hooks/useSelection';
import { SkeletonTable } from '../components/Skeleton';

const Network: React.FC = () => {
  const [contacts, setContacts] = useState<NetworkContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', company: '', position: '', relationship: 'colleague', linkedinUrl: ''
  });
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => { fetchContacts(); }, [search]);

  const fetchContacts = async () => {
    try {
      const response = await networkAPI.getAll({ search });
      setContacts(response.data.contacts);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const { sort, toggleSort, sortedData } = useTableSort(contacts, 'lastName');
  const { selectedIds, toggle, toggleAll, clearSelection, allSelected, selectedCount } = useSelection(sortedData);

  const handleCreate = async () => {
    if (!formData.firstName || !formData.lastName) return;
    try {
      const response = await networkAPI.create(formData);
      setShowModal(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', company: '', position: '', relationship: 'colleague', linkedinUrl: '' });
      addToast('success', 'Contact added');
      navigate(`/network/${response.data.id}`);
    } catch (error) {
      addToast('error', 'Failed to create contact');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedCount} contact(s)?`)) return;
    try {
      await networkAPI.bulkDelete(Array.from(selectedIds));
      setContacts(contacts.filter(c => !selectedIds.has(c.id)));
      clearSelection();
      addToast('success', `Deleted ${selectedCount} contact(s)`);
    } catch (error) {
      addToast('error', 'Failed to delete contacts');
    }
  };

  const getRelationshipColor = (rel?: string) => {
    const colors: Record<string, string> = {
      colleague: 'bg-blue-100 text-blue-700', recruiter: 'bg-purple-100 text-purple-700',
      mentor: 'bg-green-100 text-green-700', friend: 'bg-yellow-100 text-yellow-700'
    };
    return colors[rel || ''] || 'bg-gray-100 text-gray-700';
  };

  const columns: Column<NetworkContact>[] = [
    {
      key: 'lastName', label: 'Name', sortable: true,
      render: (c) => (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-primary-700 font-medium text-xs">{c.firstName[0]}{c.lastName[0]}</span>
          </div>
          <span className="font-medium text-gray-900">{c.firstName} {c.lastName}</span>
        </div>
      )
    },
    { key: 'company', label: 'Company', sortable: true, render: (c) => <span className="text-gray-600">{c.company || '-'}</span> },
    { key: 'position', label: 'Position', sortable: true, render: (c) => <span className="text-gray-600">{c.position || '-'}</span> },
    {
      key: 'relationship', label: 'Relationship', sortable: true,
      render: (c) => c.relationship ? <span className={`px-2 py-0.5 rounded-full text-xs ${getRelationshipColor(c.relationship)}`}>{c.relationship}</span> : <span className="text-gray-400">-</span>
    },
    {
      key: 'email', label: 'Contact', sortable: false,
      render: (c) => (
        <div className="flex items-center space-x-2">
          {c.email && <Mail className="w-4 h-4 text-gray-400" />}
          {c.phone && <Phone className="w-4 h-4 text-gray-400" />}
          {c.linkedinUrl && <Linkedin className="w-4 h-4 text-gray-400" />}
        </div>
      )
    },
  ];

  const exportColumns = [
    { key: 'firstName', label: 'First Name' }, { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' }, { key: 'company', label: 'Company' },
    { key: 'position', label: 'Position' }, { key: 'relationship', label: 'Relationship' },
  ];

  if (loading) return <SkeletonTable rows={6} cols={5} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network</h1>
          <p className="text-gray-500">Manage your professional contacts</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportButtons data={sortedData} columns={exportColumns} filename="contacts" />
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" /><span>Add Contact</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." className="input-with-icon" />
          </div>
          <button onClick={() => fetchContacts()} className="btn-primary px-6 flex items-center gap-2"><Search className="w-4 h-4" /><span>Search</span></button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
          <p className="text-gray-500 mb-6">Start building your professional network</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Add Contact</button>
        </div>
      ) : (
        <DataTable data={sortedData} columns={columns} sort={sort} onSort={toggleSort}
          selectable selectedIds={selectedIds} onToggle={toggle} onToggleAll={toggleAll} allSelected={allSelected}
          onRowClick={(c) => navigate(`/network/${c.id}`)} getRowId={(c) => c.id} />
      )}

      <BulkActionBar selectedCount={selectedCount} onDelete={handleBulkDelete} onClear={clearSelection} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Add Contact</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="First Name *" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="input-field" />
                <input type="text" placeholder="Last Name *" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="input-field" />
              </div>
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" />
              <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" />
              <input type="text" placeholder="Company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="input-field" />
              <input type="text" placeholder="Position" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input-field" />
              <select value={formData.relationship} onChange={(e) => setFormData({ ...formData, relationship: e.target.value })} className="input-field">
                <option value="colleague">Colleague</option><option value="recruiter">Recruiter</option>
                <option value="mentor">Mentor</option><option value="friend">Friend</option><option value="other">Other</option>
              </select>
              <input type="url" placeholder="LinkedIn URL" value={formData.linkedinUrl} onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })} className="input-field" />
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleCreate} disabled={!formData.firstName || !formData.lastName} className="btn-primary flex-1">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Network;
