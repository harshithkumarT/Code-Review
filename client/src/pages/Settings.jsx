import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import API from '../services/api';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Globe,
  Bell,
  Cpu,
  Trash2,
  Check,
  Save,
  ShieldAlert,
  Loader2,
  Key,
} from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Settings State initialized from localStorage or defaults
  const [defaultLanguage, setDefaultLanguage] = useState(localStorage.getItem('pref_language') || 'JavaScript');
  const [aiProvider, setAiProvider] = useState(localStorage.getItem('pref_ai_provider') || 'gemini');
  const [emailNotifications, setEmailNotifications] = useState(
    localStorage.getItem('pref_email_notif') !== 'false'
  );
  const [inAppToasts, setInAppToasts] = useState(
    localStorage.getItem('pref_toast_notif') !== 'false'
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const supportedLanguages = ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'TypeScript'];

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaving(true);

    // Save preferences to localStorage (theme is already saved by ThemeContext)
    localStorage.setItem('pref_language', defaultLanguage);
    localStorage.setItem('pref_ai_provider', aiProvider);
    localStorage.setItem('pref_email_notif', emailNotifications);
    localStorage.setItem('pref_toast_notif', inAppToasts);

    setTimeout(() => {
      setSaving(false);
      toast.success('System preferences saved successfully!');
    }, 600);
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        '⚠️ PERMANENT WARNING: Are you sure you want to delete your account? All saved code reviews and history will be permanently erased.'
      )
    )
      return;

    setDeleting(true);
    try {
      await API.delete('/users/account');
      toast.success('Account permanently deleted.');
      await logout();
      navigate('/register');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="p-3 bg-indigo-600/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 rounded-2xl">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Preferences & Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure theme, AI review defaults, notifications, and account settings.</p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Theme & Appearance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl transition-colors duration-300">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Appearance & Theme
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                theme === 'dark'
                  ? 'bg-indigo-600/15 border-indigo-500 text-slate-900 dark:text-white shadow-lg shadow-indigo-600/10'
                  : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Dark Mode (Default)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">High-contrast dark theme</p>
                </div>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />}
            </div>

            <div
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                theme === 'light'
                  ? 'bg-indigo-600/15 border-indigo-500 text-slate-900 dark:text-white shadow-lg shadow-indigo-600/10'
                  : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Sun className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Light Mode</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Clean light theme</p>
                </div>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />}
            </div>
          </div>
        </div>

        {/* 2. Language & AI Model Preference */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl transition-colors duration-300">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Language & AI Model Defaults
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Default Programming Language
              </label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Engine Model Provider */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                AI Engine Provider Model
              </label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
              >
                <option value="gemini">Google Gemini 1.5 Pro (Fast Analysis)</option>
                <option value="openai">OpenAI GPT-4o (High Precision)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Notification Preferences */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl transition-colors duration-300">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Notification Preferences
          </h2>

          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">In-App Toast Notifications</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Show floating toast popups on AI completion and system events</p>
              </div>
              <input
                type="checkbox"
                checked={inAppToasts}
                onChange={(e) => setInAppToasts(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Email Notifications</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Receive weekly code health summaries and review updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Save Settings Action Button */}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save System Preferences
        </button>
      </form>

      {/* 4. Danger Zone: Delete Account */}
      <div className="bg-white dark:bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl transition-colors duration-300">
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-rose-500 dark:text-rose-400 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500 dark:text-rose-400" /> Account Danger Zone
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
            Deleting your account will permanently purge your profile, saved code reviews, bookmarks, and history records from MongoDB. This action cannot be undone.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Permanently Delete Account
        </button>
      </div>
    </div>
  );
}
