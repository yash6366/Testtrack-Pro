import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/apiClient';
import { 
  Edit2, 
  Save, 
  X, 
  User, 
  Mail, 
  Shield, 
  Camera, 
  CheckCircle, 
  Clock,
  Calendar,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({ name: '' });

  // Load full profile data
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/users/me');
        setProfile(response);
        setEditData({ name: response.name || '' });
      } catch {
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await apiClient.patch('/api/users/me', {
        name: editData.name,
      });

      setProfile(prev => ({ ...prev, ...response.user }));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditData({ name: profile?.name || '' });
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPEG, PNG, and WebP images are allowed' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    setUploadingPhoto(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.upload('/api/users/me/photo', formData);
      
      setProfile(prev => ({ ...prev, picture: response.photoUrl }));
      setMessage({ type: 'success', text: 'Profile photo updated!' });
      
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to upload photo',
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) {
      return;
    }

    setUploadingPhoto(true);
    setMessage({ type: '', text: '' });

    try {
      await apiClient.delete('/api/users/me/photo');
      
      setProfile(prev => ({ ...prev, picture: null }));
      setMessage({ type: 'success', text: 'Profile photo removed!' });
      
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to remove photo',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20';
      case 'DEVELOPER':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20';
      case 'TESTER':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-500/20';
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
      : 'bg-rose-500/10 text-rose-600 dark:text-rose-300';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout
        user={user}
        dashboardLabel="Profile"
        headerTitle="My Profile"
        headerSubtitle="Loading..."
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      user={user}
      dashboardLabel="Profile"
      headerTitle="My Profile"
      headerSubtitle="View and manage your profile information"
      onLogout={handleLogout}
    >
      <div className="mb-4">
        <BackButton label="Back to Dashboard" fallback="/dashboard" />
      </div>

      {message.text && (
        <div
          className={`tt-card p-4 mb-6 ${
            message.type === 'success'
              ? 'border-[var(--success)] text-[var(--success)]'
              : 'border-[var(--danger)] text-[var(--danger)]'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <div className="lg:col-span-1">
          <div className="tt-card p-6">
            <div className="flex flex-col items-center">
              {/* Profile Photo with Upload */}
              <div className="relative group">
                {profile?.picture ? (
                  <img 
                    src={profile.picture} 
                    alt={profile.name || 'Profile'} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-[var(--border)]"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-[var(--border)]">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                
                {/* Upload/Change Photo Button */}
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    title="Upload photo"
                  >
                    {uploadingPhoto ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </button>
                  {profile?.picture && (
                    <button
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="p-2 bg-white/20 rounded-full hover:bg-rose-500/50 transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="h-5 w-5 text-white" />
                    </button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Upload hint */}
              <p className="text-xs text-[var(--muted)] mt-2">
                Hover to change photo
              </p>

              {/* Full Name */}
              <h2 className="text-2xl font-bold mt-4 mb-1">{profile?.name}</h2>
              
              {/* Email with Verified Badge */}
              <div className="flex items-center gap-1.5 text-sm text-[var(--muted)] mb-3">
                <span>{profile?.email}</span>
                {profile?.isVerified && (
                  <CheckCircle className="h-4 w-4 text-blue-500" title="Verified" />
                )}
              </div>

              {/* Role Badge */}
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getRoleBadgeColor(
                  profile?.role,
                )}`}
              >
                {profile?.role || 'User'}
              </span>

              {/* Profile Details */}
              <div className="w-full mt-6 pt-6 border-t border-[var(--border)] space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)] flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Status
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(profile?.isActive)}`}>
                    {profile?.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                {/* Member Since */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)] flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </span>
                  <span className="font-medium">
                    {formatDate(profile?.createdAt)}
                  </span>
                </div>

                {/* Last Login */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)] flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last Login
                  </span>
                  <span className="font-medium text-xs">
                    {formatDateTime(profile?.lastLoginAt)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full mt-6 space-y-3">
                <Link
                  to="/settings"
                  className="block w-full text-center tt-btn-secondary"
                >
                  Account Settings
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="tt-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 tt-btn-secondary"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <User className="h-4 w-4 text-[var(--muted)]" />
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-[var(--foreground)]">{profile?.name || 'Not set'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Mail className="h-4 w-4 text-[var(--muted)]" />
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-[var(--foreground)]">{profile?.email}</p>
                  {profile?.isVerified ? (
                    <span className="flex items-center gap-1 text-xs text-blue-500">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-xs text-amber-500">Not verified</span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">Email cannot be changed</p>
              </div>

              {/* Role */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Shield className="h-4 w-4 text-[var(--muted)]" />
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(profile?.role)}`}>
                    {profile?.role || 'User'}
                  </span>
                  <span className="text-xs text-[var(--muted)]">Managed by administrators</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 tt-btn-secondary"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 tt-btn-secondary"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Assigned Projects */}
          <div className="tt-card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Assigned Projects
            </h2>
            
            {profile?.projectAllocations?.length > 0 ? (
              <div className="space-y-3">
                {profile.projectAllocations.map((allocation) => (
                  <div 
                    key={allocation.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]"
                  >
                    <div>
                      <h3 className="font-medium">{allocation.project?.name}</h3>
                      <p className="text-sm text-[var(--muted)]">
                        Key: {allocation.project?.key} • Status: {allocation.project?.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(allocation.projectRole)}`}>
                        {allocation.projectRole}
                      </span>
                      <p className="text-xs text-[var(--muted)] mt-1">
                        Since {formatDate(allocation.allocatedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--muted)]">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No projects assigned yet</p>
                <p className="text-sm mt-1">Contact an administrator to get assigned to projects</p>
              </div>
            )}
          </div>

          {/* Connected Accounts */}
          {/* ...existing code... */}
            <div className="tt-card p-6">
              <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
              <div className="space-y-3">
                {/* ...existing code... */}
                  <div 
                    // ...existing code...
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-strong)] flex items-center justify-center">
                        {/* ...existing code... */}
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )}
                        {/* ...existing code... */}
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        {/* ...existing code... */}
                        {/* ...existing code... */}
                      </div>
                    </div>
                    <span className="text-xs text-[var(--muted)]">
                      {/* ...existing code... */}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
