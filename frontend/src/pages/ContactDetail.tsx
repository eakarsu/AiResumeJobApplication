import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { networkAPI, aiAPI } from '../services/api';
import { NetworkContact } from '../types';
import { ArrowLeft, Save, Mail, Phone, Linkedin, Building2, Sparkles, Loader2, Plus, Calendar, MessageSquare } from 'lucide-react';

const ContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<NetworkContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [interactionData, setInteractionData] = useState({ type: 'email', notes: '', outcome: '' });
  const [messageData, setMessageData] = useState({ purpose: '', platform: 'LinkedIn' });
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchContact();
  }, [id]);

  const fetchContact = async () => {
    try {
      const response = await networkAPI.getOne(id!);
      setContact(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await networkAPI.update(id!, formData);
      setContact({ ...contact!, ...formData });
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddInteraction = async () => {
    try {
      await networkAPI.addInteraction(id!, interactionData);
      fetchContact();
      setShowInteractionModal(false);
      setInteractionData({ type: 'email', notes: '', outcome: '' });
    } catch (error) {
      console.error('Failed to add interaction:', error);
    }
  };

  const handleGenerateMessage = async () => {
    setGenerating(true);
    try {
      const response = await aiAPI.generateNetworkingMessage({
        contactId: id,
        purpose: messageData.purpose,
        platform: messageData.platform,
        recipientInfo: `${contact?.firstName} ${contact?.lastName}, ${contact?.position} at ${contact?.company}`
      });
      setGeneratedMessage(response.data.message);
    } catch (error) {
      console.error('Failed to generate message:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (!contact) {
    return <div className="text-center py-12">Contact not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/network')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-lg">{contact.firstName[0]}{contact.lastName[0]}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{contact.firstName} {contact.lastName}</h1>
              {(contact.position || contact.company) && (
                <p className="text-gray-500">{contact.position}{contact.position && contact.company && ' at '}{contact.company}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowMessageModal(true)} className="btn-secondary flex items-center space-x-2">
            <Sparkles className="w-4 h-4" /><span>AI Message</span>
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}<span>Save</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" value={formData.firstName || ''} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="First Name" className="input-field" />
              <input type="text" value={formData.lastName || ''} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Last Name" className="input-field" />
              <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email" className="input-field" />
              <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone" className="input-field" />
              <input type="text" value={formData.company || ''} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Company" className="input-field" />
              <input type="text" value={formData.position || ''} onChange={(e) => setFormData({ ...formData, position: e.target.value })} placeholder="Position" className="input-field" />
              <select value={formData.relationship || ''} onChange={(e) => setFormData({ ...formData, relationship: e.target.value })} className="input-field">
                <option value="">Relationship</option>
                <option value="colleague">Colleague</option>
                <option value="recruiter">Recruiter</option>
                <option value="mentor">Mentor</option>
                <option value="friend">Friend</option>
              </select>
              <input type="url" value={formData.linkedinUrl || ''} onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })} placeholder="LinkedIn URL" className="input-field" />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Notes</h2>
            <textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Notes about this contact..." className="input-field min-h-[120px]" />
          </div>

          {/* Interactions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Interactions</h2>
              <button onClick={() => setShowInteractionModal(true)} className="btn-secondary text-sm flex items-center">
                <Plus className="w-4 h-4 mr-1" />Add
              </button>
            </div>
            {contact.interactions && contact.interactions.length > 0 ? (
              <div className="space-y-4">
                {contact.interactions.map((int) => (
                  <div key={int.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs capitalize">{int.type}</span>
                      <span className="text-sm text-gray-500">{new Date(int.date).toLocaleDateString()}</span>
                    </div>
                    {int.notes && <p className="text-gray-700 text-sm">{int.notes}</p>}
                    {int.outcome && <p className="text-sm text-green-600 mt-1">Outcome: {int.outcome}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No interactions logged</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center text-gray-700 hover:text-primary-600">
                  <Mail className="w-5 h-5 mr-3" />Send Email
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center text-gray-700 hover:text-primary-600">
                  <Phone className="w-5 h-5 mr-3" />Call
                </a>
              )}
              {contact.linkedinUrl && (
                <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-primary-600">
                  <Linkedin className="w-5 h-5 mr-3" />LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Tags</h2>
            <input
              type="text"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })}
              placeholder="Tags (comma separated)"
              className="input-field mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Interaction Modal */}
      {showInteractionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Log Interaction</h2>
            <div className="space-y-4">
              <select value={interactionData.type} onChange={(e) => setInteractionData({ ...interactionData, type: e.target.value })} className="input-field">
                <option value="email">Email</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="linkedin">LinkedIn</option>
                <option value="other">Other</option>
              </select>
              <textarea value={interactionData.notes} onChange={(e) => setInteractionData({ ...interactionData, notes: e.target.value })} placeholder="Notes" className="input-field min-h-[100px]" />
              <input type="text" value={interactionData.outcome} onChange={(e) => setInteractionData({ ...interactionData, outcome: e.target.value })} placeholder="Outcome" className="input-field" />
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowInteractionModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAddInteraction} className="btn-primary flex-1">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Generate AI Message</h2>
            {!generatedMessage ? (
              <>
                <div className="space-y-4">
                  <input type="text" value={messageData.purpose} onChange={(e) => setMessageData({ ...messageData, purpose: e.target.value })} placeholder="Purpose (e.g., Ask for referral, Request informational interview)" className="input-field" />
                  <select value={messageData.platform} onChange={(e) => setMessageData({ ...messageData, platform: e.target.value })} className="input-field">
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Email">Email</option>
                    <option value="Text">Text</option>
                  </select>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button onClick={() => setShowMessageModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleGenerateMessage} disabled={!messageData.purpose || generating} className="btn-primary flex-1 flex items-center justify-center">
                    {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Generate
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="whitespace-pre-wrap">{generatedMessage}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(generatedMessage); alert('Copied to clipboard!'); }} className="btn-secondary w-full mb-3">Copy to Clipboard</button>
                <button onClick={() => { setGeneratedMessage(''); setShowMessageModal(false); }} className="btn-primary w-full">Done</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetail;
