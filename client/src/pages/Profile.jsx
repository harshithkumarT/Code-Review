import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Lock,
  Camera,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  LogOut,
  Save,
  KeyRound,
} from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'avatar' | 'password' | 'danger'
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Edit Profile Form
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // 2. Change Password Form
  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    reset: resetPassForm,
    watch: watchPass,
    formState: { errors: passErrors },
  } = useForm();

  const newPasswordVal = watchPass('newPassword');

  // Submit Profile Update
  const onUpdateProfile = async (data) => {
    setSuccessMsg('');
    setErrorMsg('');
    setSubmitting(true);
    try {
      await API.put('/users/profile', data);
      setSuccessMsg('Profile updated successfully! Refreshing session...');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile details.');
    } fontally: {
      setSubmitting(false);
    }
  };

  // Submit Avatar Upload
  const onAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Avatar image size must be under 2MB.');
      return;
    }

    setSuccessMsg('');
    setErrorMsg('');
    setSubmitting(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await API.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMsg('Profile picture updated successfully!');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Change Password
  const onChangePassword = async (data) => {
    setSuccessMsg('');
    setErrorMsg('');
    setSubmitting(true);
    try {
      await API.put('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccessMsg('Password changed successfully!');
      resetPassForm();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete Account
  const onDeleteAccount = async () => {
    if (
      !window.confirm(
        '⚠️ PERMANENT WARNING: Are you sure you want to delete your account? All saved code reviews and history will be permanently erased.'
      )
    )
      return;

    setSubmitting(true);
    try {
      await API.delete('/users/account');
      await logout();
      navigate('/register');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete account.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Profile Overview Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative group">
            <img
              src={user?.profileImage}
              alt={user?.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-indigo-500/40 object-cover shadow-2xl"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border border-slate-900 transition-all cursor-pointer"
              title="Upload new picture"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={onAvatarFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full capitalize font-medium">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member since:{' '}
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
            </p>
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Settings Tab Bar */}
        <div className="flex flex-wrap border-b border-slate-800 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'details'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> Edit Profile
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'password'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Change Password
          </button>

          <button
            onClick={() => setActiveTab('danger')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'danger'
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <Trash2 className="w-4 h-4" /> Danger Zone
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {/* 1. Edit Profile Form */}
      {activeTab === 'details' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" /> General Profile Settings
          </h2>

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                {...regProfile('name', { required: 'Name is required' })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              {profileErrors.name && (
                <p className="text-[11px] text-rose-400 mt-1">{profileErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                {...regProfile('email', { required: 'Email is required' })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              {profileErrors.email && (
                <p className="text-[11px] text-rose-400 mt-1">{profileErrors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile Changes
            </button>
          </form>
        </div>
      )}

      {/* 2. Change Password Form */}
      {activeTab === 'password' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" /> Security & Password Update
          </h2>

          <form onSubmit={handlePassSubmit(onChangePassword)} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                {...regPass('currentPassword', { required: 'Current password is required' })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
              {passErrors.currentPassword && (
                <p className="text-[11px] text-rose-400 mt-1">{passErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                {...regPass('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
              {passErrors.newPassword && (
                <p className="text-[11px] text-rose-400 mt-1">{passErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                {...regPass('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (val) => val === newPasswordVal || 'Passwords do not match',
                })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
              {passErrors.confirmPassword && (
                <p className="text-[11px] text-rose-400 mt-1">{passErrors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* 3. Danger Zone: Delete Account */}
      {activeTab === 'danger' && (
        <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" /> Permanent Account Deletion
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              Once you delete your account, your profile, authentication credentials, saved code reviews, and history records will be permanently erased from MongoDB. This action cannot be undone.
            </p>
          </div>

          <button
            onClick={onDeleteAccount}
            disabled={submitting}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Permanently Delete My Account
          </button>
        </div>
      )}
    </div>
  );
}
