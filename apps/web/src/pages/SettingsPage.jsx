import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, useTheme } from '@/hooks';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/apiClient';
import { Settings, Bell, Lock, Palette, Globe, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // General settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // Theme settings - use the global theme context
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState(localStorage.getItem('language') || i18n.language || 'en');
  const [fontStyle, setFontStyle] = useState(localStorage.getItem('fontStyle') || 'default');

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await apiClient.patch('/api/user/settings', {
        notifications: {
          email: emailNotifications,
          push: pushNotifications,
          weeklyReports,
        },
        preferences: {
          theme,
          language,
        },
      });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    // Handle 'auto' by checking system preference
    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(newTheme);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  const handleFontStyleChange = (newFontStyle) => {
    setFontStyle(newFontStyle);
    localStorage.setItem('fontStyle', newFontStyle);
    document.documentElement.setAttribute('data-font', newFontStyle);
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'All password fields are required' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      return;
    }

    setChangingPassword(true);
    setMessage({ type: '', text: '' });

    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to change password',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Please enter your password to confirm account deletion' });
      return;
    }

    setDeletingAccount(true);
    setMessage({ type: '', text: '' });

    try {
      await apiClient.delete('/api/users/me', {
        password: deletePassword,
        reason: deleteReason,
      });

      // Logout and redirect to login
      logout();
      navigate('/login', { state: { message: 'Your account has been deactivated.' } });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to delete account',
      });
      setDeletingAccount(false);
    }
  };

  const tabs = [
    { id: 'general', labelKey: 'settings.general', icon: Settings },
    { id: 'notifications', labelKey: 'settings.notifications', icon: Bell },
    { id: 'appearance', labelKey: 'settings.appearance', icon: Palette },
    { id: 'security', labelKey: 'settings.security', icon: Lock },
  ];

  return (
    <DashboardLayout
      user={user}
      dashboardLabel={t('settings.title')}
      headerTitle={t('settings.title')}
      headerSubtitle={t('settings.subtitle')}
      onLogout={handleLogout}
    >
      <div className="mb-4">
        <BackButton label={t('common.back')} fallback="/dashboard" />
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="tt-card p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                      : 'text-[var(--muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {t(tab.labelKey)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="tt-card p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('settings.general')}</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Globe className="inline h-4 w-4 mr-2" />
                      {t('settings.language')}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="sv">Svenska</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('settings.timezone')}
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option>UTC</option>
                      <option>America/New_York</option>
                      <option>America/Los_Angeles</option>
                      <option>Europe/London</option>
                      <option>Asia/Tokyo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('settings.notifications')}</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-[var(--bg-elevated)] transition">
                    <div>
                      <h3 className="font-medium">{t('settings.emailNotifications')}</h3>
                      <p className="text-sm text-[var(--muted)]">
                        {t('settings.emailNotificationsDesc')}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-[var(--bg-elevated)] transition">
                    <div>
                      <h3 className="font-medium">{t('settings.pushNotifications')}</h3>
                      <p className="text-sm text-[var(--muted)]">
                        {t('settings.pushNotificationsDesc')}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-[var(--bg-elevated)] transition">
                    <div>
                      <h3 className="font-medium">{t('settings.weeklyReports')}</h3>
                      <p className="text-sm text-[var(--muted)]">
                        {t('settings.weeklyReportsDesc')}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weeklyReports}
                        onChange={(e) => setWeeklyReports(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('settings.appearance')}</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3">{t('settings.theme')}</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: t('settings.light') },
                        { value: 'dark', label: t('settings.dark') },
                        { value: 'auto', label: t('settings.auto') },
                      ].map((themeOption) => (
                        <button
                          key={themeOption.value}
                          onClick={() => handleThemeChange(themeOption.value)}
                          className={`p-4 rounded-lg border-2 transition ${
                            theme === themeOption.value
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                              : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                          }`}
                        >
                          <div className="text-center">{themeOption.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">{t('settings.fontStyle')}</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'default', label: t('settings.fontDefault'), sample: 'IBM Plex Sans' },
                        { value: 'inter', label: 'Inter', sample: 'Inter' },
                        { value: 'roboto', label: 'Roboto', sample: 'Roboto' },
                        { value: 'openSans', label: 'Open Sans', sample: 'Open Sans' },
                        { value: 'nunito', label: 'Nunito', sample: 'Nunito' },
                        { value: 'poppins', label: 'Poppins', sample: 'Poppins' },
                        { value: 'lato', label: 'Lato', sample: 'Lato' },
                        { value: 'montserrat', label: 'Montserrat', sample: 'Montserrat' },
                        { value: 'sourceSans', label: 'Source Sans', sample: 'Source Sans 3' },
                      ].map((fontOption) => (
                        <button
                          key={fontOption.value}
                          onClick={() => handleFontStyleChange(fontOption.value)}
                          className={`p-4 rounded-lg border-2 transition ${
                            fontStyle === fontOption.value
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                              : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                          }`}
                          style={{ fontFamily: fontOption.sample }}
                        >
                          <div className="text-center">{fontOption.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">{t('settings.security')}</h2>
                <div className="space-y-6">
                  {/* Update Password Form */}
                  <div className="p-4 rounded-lg border border-[var(--border)]">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {t('settings.updatePassword')}
                    </h3>
                    <p className="text-sm text-[var(--muted)] mb-4">
                      {t('settings.updatePasswordDesc')}
                    </p>
                    
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('settings.currentPassword')}</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-4 py-2 pr-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder={t('settings.currentPassword')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">{t('settings.newPassword')}</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-4 py-2 pr-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder={t('settings.newPassword')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-1">{t('settings.passwordMinLength')}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">{t('settings.confirmNewPassword')}</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          placeholder={t('settings.confirmNewPassword')}
                        />
                      </div>

                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        className="px-6 py-2.5 rounded-lg bg-[var(--surface-strong)] text-[var(--foreground)] font-medium border border-[var(--border)] hover:bg-[var(--bg-elevated)] transition disabled:opacity-50"
                      >
                        {changingPassword ? t('common.saving') : t('settings.updatePassword')}
                      </button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="p-4 rounded-lg border border-[var(--border)]">
                    <h3 className="font-medium mb-2">{t('settings.twoFactorAuth')}</h3>
                    <p className="text-sm text-[var(--muted)] mb-4">
                      {t('settings.twoFactorAuthDesc')}
                    </p>
                    <button className="tt-btn-secondary" disabled>
                      {t('settings.enable2FA')} ({t('settings.comingSoon')})
                    </button>
                  </div>

                  {/* Delete Account */}
                  <div className="p-4 rounded-lg border border-rose-500/30 bg-rose-500/5">
                    <h3 className="font-medium mb-2 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      {t('settings.deleteAccount')}
                    </h3>
                    <p className="text-sm text-[var(--muted)] mb-4">
                      {t('settings.deleteAccountDesc')}
                    </p>
                    
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 rounded-lg border border-rose-500/50 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        {t('settings.deleteMyAccount')}
                      </button>
                    ) : (
                      <div className="space-y-4 max-w-md p-4 rounded-lg border border-rose-500/30 bg-rose-500/5">
                        <div className="flex items-start gap-3 text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium">{t('settings.deleteWarningTitle')}</p>
                            <p className="mt-1">{t('settings.deleteWarningDesc')}</p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">{t('settings.enterPasswordToConfirm')}</label>
                          <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-rose-500/30 bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder={t('settings.yourPassword')}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">{t('settings.reasonForLeaving')}</label>
                          <textarea
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                            rows={2}
                            placeholder={t('settings.reasonPlaceholder')}
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeletePassword('');
                              setDeleteReason('');
                            }}
                            className="tt-btn-secondary"
                          >
                            {t('common.cancel')}
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deletingAccount || !deletePassword}
                            className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingAccount ? t('common.deleting') : t('settings.permanentlyDeleteAccount')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-end gap-3">
              <BackButton
                label={t('common.cancel')}
                fallback="/dashboard"
                className="tt-btn tt-btn-outline px-4 py-2"
              />
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="tt-btn-secondary"
              >
                {saving ? t('common.saving') : t('common.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
