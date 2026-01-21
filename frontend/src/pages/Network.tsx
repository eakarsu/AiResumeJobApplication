import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { networkAPI } from '../services/api';
import { NetworkContact } from '../types';
import { Plus, Users, Search, Mail, Phone, Linkedin, Building2, Trash2 } from 'lucide-react';

const Network: React.FC = () => {
  const [contacts, setContacts] = useState<NetworkContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', company: '', position: '', relationship: 'colleague', linkedinUrl: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchContacts();
  }, [search]);

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

  const handleCreate = async () => {
    if (!formData.firstName || !formData.lastName) return;
    try {
      const response = await networkAPI.create(formData);
      setShowModal(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', company: '', position: '', relationship: 'colleague', linkedinUrl: '' });
      navigate(`/network/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create contact:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this contact?')) return;
    try {
      await networkAPI.delete(id);
      setContacts(contacts.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getRelationshipColor = (rel?: string) => {
    const colors: Record<string, string> = {
      colleague: 'bg-blue-100 text-blue-700',
      recruiter: 'bg-purple-100 text-purple-700',
      mentor: 'bg-green-100 text-green-700',
      friend: 'bg-yellow-100 text-yellow-700'
    };
    return colors[rel || ''] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network</h1>
          <p className="text-gray-500">Manage your professional contacts</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" /><span>Add Contact</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="input-with-icon"
            />
          </div>
          <button onClick={() => fetchContacts()} className="btn-primary px-6 flex items-center gap-2 whitespace-nowrap">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Contacts Grid */}
      {contacts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
          <p className="text-gray-500 mb-6">Start building your professional network</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Add Contact</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div key={contact.id} onClick={() => navigate(`/network/${contact.id}`)} className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-semibold">{contact.firstName[0]}{contact.lastName[0]}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {contact.relationship && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getRelationshipColor(contact.relationship)}`}>{contact.relationship}</span>
                  )}
                  <button onClick={(e) => handleDelete(contact.id, e)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{contact.firstName} {contact.lastName}</h3>
              {(contact.position || contact.company) && (
                <p className="text-sm text-gray-500">
                  {contact.position}{contact.position && contact.company && ' at '}{contact.company}
                </p>
              )}
              <div className="flex items-center space-x-3 mt-3">
                {contact.email && <Mail className="w-4 h-4 text-gray-400" />}
                {contact.phone && <Phone className="w-4 h-4 text-gray-400" />}
                {contact.linkedinUrl && <Linkedin className="w-4 h-4 text-gray-400" />}
              </div>
              {contact.tags && contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {contact.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
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
                <option value="colleague">Colleague</option>
                <option value="recruiter">Recruiter</option>
                <option value="mentor">Mentor</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
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
