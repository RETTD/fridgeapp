'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { theme, toggleTheme, mounted: themeMounted } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const menuItems = [
    { href: '/dashboard', label: t('dashboard.title'), icon: '🏠' },
    { href: '/dashboard/search', label: t('search.title'), icon: '🔍' },
    { href: '/dashboard/add', label: t('products.addProduct'), icon: '➕' },
    { href: '/dashboard/settings', label: t('settings.title'), icon: '⚙️' },
  ];

  return (
    <>
      {/* Overlay - tylko na mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - ukryty domyślnie, otwiera się po kliknięciu hamburgera */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-fridge-primary to-fridge-secondary text-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
              <div className="p-6 border-b border-white/20">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">🧊</span>
                  <h1 className="text-2xl font-bold text-white">{t('common.appName')}</h1>
                </div>
              </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle */}
          <div className="p-4 border-t border-white/20">
            <button
              onClick={toggleTheme}
              disabled={!themeMounted}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
                <span>{theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}</span>
              </div>
              <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-white/20 transition-colors">
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
            >
              <span className="text-xl">🚪</span>
              <span>{t('auth.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

