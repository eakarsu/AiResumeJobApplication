import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { User, Mail, Phone, MapPin, Linkedin, Globe, Save, Lock, Loader2, Crown } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    location: user?.location || '',
    linkedinUrl: user?.linkedinUrl || '',
    portfolioUrl: user?.portfolioUrl || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setChangingPassword(true);
    setMessage({ type: '', text: '' });
    try {
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500">Manage your account settings</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-bold text-2xl">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-500">{user?.email}</p>
            {user?.isPremium && (
              <div className="flex items-center mt-1 text-yellow-600">
                <Crown className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium capitalize">{user.premiumTier} Plan</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="input-with-icon" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" value={user?.email || ''} disabled className="input-with-icon bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-with-icon" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="City, State" className="input-with-icon" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="url" value={formData.linkedinUrl} onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })} className="input-with-icon" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="url" value={formData.portfolioUrl} onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })} className="input-with-icon" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary mt-6 flex items-center">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2" />Change Password
        </h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="input-field" />
          </div>
          <button onClick={handlePasswordChange} disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword} className="btn-primary flex items-center">
            {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
            Change Password
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-4 flex items-center">
          <Crown className="w-5 h-5 mr-2 text-yellow-500" />Subscription
        </h2>
        {user?.isPremium ? (
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Crown className="w-8 h-8 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800 capitalize">{user.premiumTier} Plan</h3>
                <p className="text-sm text-yellow-600">Active subscription</p>
              </div>
            </div>
            <ul className="text-sm text-yellow-700 space-y-2">
              <li>Unlimited AI credits</li>
              <li>Priority support</li>
              <li>All premium features</li>
            </ul>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">You're currently on the Free plan</p>
            <button className="btn-primary">Upgrade to Pro</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
