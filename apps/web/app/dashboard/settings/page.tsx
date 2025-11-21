'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { trpc } from '@/utils/trpc';
import toast from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { HamburgerButton } from '@/components/HamburgerButton';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/components/ThemeProvider';

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { theme, toggleTheme, mounted: themeMounted } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Language state
  const [language, setLanguage] = useState<string>(locale);
  
  // Email state
  const [email, setEmail] = useState<string>('');
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Email update states
  const [showEmailUpdate, setShowEmailUpdate] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success(t('settings.settingsUpdated'));
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (settings?.language) {
      setLanguage(settings.language);
    }
    if (settings?.email) {
      setEmail(settings.email);
    }
  }, [settings]);

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
    updateMutation.mutate({ language: newLanguage as 'en' | 'pl' });
    document.cookie = `locale=${newLanguage}; path=/; max-age=31536000`;
  };


  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t('settings.passwordTooShort'));
      return;
    }

    try {
      // Change password using Supabase client (client-side for security)
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message || 'Failed to change password');
        return;
      }

      toast.success(t('settings.passwordChanged'));
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
    }
  };

  const handleEmailUpdate = () => {
    if (!newEmail.includes('@')) {
      toast.error(t('settings.invalidEmail'));
      return;
    }

    // Email update requires password verification - would need to implement
    // For now, just show a message that this feature needs password verification
    toast.error('Email update requires password verification. Feature coming soon.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fridge-ice via-white to-fridge-light dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Mobile Navigation */}
        <nav className="lg:hidden bg-gradient-to-r from-fridge-primary to-fridge-secondary shadow-md sticky top-0 z-30">
          <div className="px-4 h-16 flex items-center">
            <HamburgerButton
              isOpen={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            />
          </div>
        </nav>

        {/* Desktop Navigation */}
        <nav className="hidden lg:block bg-nav backdrop-blur-sm shadow-sm border-b border-nav sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <HamburgerButton
                  isOpen={sidebarOpen}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                />
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-fridge-primary hover:text-fridge-secondary transition-colors"
                >
                  <span>←</span>
                  <span>{t('common.back')}</span>
                </Link>
              </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={toggleTheme}
                      disabled={!themeMounted}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                      title={theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
                    >
                      <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🧊</span>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-fridge-primary to-fridge-secondary bg-clip-text text-transparent">
                        {t('common.appName')}
                      </h1>
                    </div>
                  </div>
            </div>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-card backdrop-blur-sm shadow-xl rounded-2xl p-6 border-2 border-card">
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-2xl">⚙️</span>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-fridge-primary to-fridge-secondary bg-clip-text text-transparent">
                  {t('settings.title')}
                </h1>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-fridge-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Language Setting */}
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">
                      {t('settings.language')}
                    </label>
                    <select
                      className="w-full px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary"
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      disabled={updateMutation.isLoading}
                    >
                      <option value="en">{t('settings.english')}</option>
                      <option value="pl">{t('settings.polish')}</option>
                    </select>
                    <p className="text-sm text-muted mt-2">
                      {t('settings.selectLanguage')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Section */}
            <div className="bg-card backdrop-blur-sm shadow-xl rounded-2xl p-6 border-2 border-card">
                  <h2 className="text-xl font-bold text-primary mb-4 flex items-center space-x-2">
                    <span>👤</span>
                    <span>{t('settings.profile')}</span>
                  </h2>

              <div className="space-y-4">
                {/* Email (read-only for now) */}
                <div>
                      <label className="block text-sm font-semibold text-primary mb-1.5">
                        {t('settings.email')}
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-2 border-2 border-input rounded-xl bg-gray-100 dark:bg-gray-700 text-muted cursor-not-allowed"
                    value={email}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed from here. Contact support if needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="bg-card backdrop-blur-sm shadow-xl rounded-2xl p-6 border-2 border-card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-primary flex items-center space-x-2">
                  <span>🔒</span>
                  <span>{t('settings.changePassword')}</span>
                </h2>
                <button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="px-4 py-2 bg-fridge-primary text-white rounded-xl hover:bg-fridge-secondary transition-all font-semibold text-sm"
                >
                  {showPasswordChange ? '✕' : '✏️'}
                </button>
              </div>

              {showPasswordChange && (
                <div className="space-y-4 pt-4 border-t border-card">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5">
                      {t('settings.currentPassword')}
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t('settings.currentPassword')}
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-semibold text-primary mb-1.5">
                          {t('settings.newPassword')}
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('settings.newPassword')}
                    />
                  </div>
                  <div>
                        <label className="block text-sm font-semibold text-primary mb-1.5">
                          {t('settings.confirmPassword')}
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('settings.confirmPassword')}
                    />
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    className="w-full px-4 py-2 bg-gradient-to-r from-fridge-primary to-fridge-secondary text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    {t('settings.changePassword')}
                  </button>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50/90 dark:bg-red-900/20 backdrop-blur-sm shadow-xl rounded-2xl p-6 border-2 border-red-200 dark:border-red-800">
              <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-4 flex items-center space-x-2">
                <span>⚠️</span>
                <span>{t('settings.dangerZone')}</span>
              </h2>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    {t('settings.deleteAccountWarning')}
                  </p>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold"
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    toast.error('Account deletion not implemented yet');
                  }
                }}
              >
                {t('settings.deleteAccount')}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
