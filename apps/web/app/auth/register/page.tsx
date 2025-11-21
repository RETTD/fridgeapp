'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || undefined,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(t('auth.accountCreated'));
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fridge-ice via-white to-fridge-light">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-fridge-cold/30">
        <div className="text-center">
          <div className="mb-4">
            <span className="text-6xl block">🧊</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-fridge-primary to-fridge-secondary bg-clip-text text-transparent">
            {t('auth.joinFridgeApp')}
          </h2>
          <p className="mt-2 text-fridge-dark/70">{t('auth.createAccount')}</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-fridge-dark mb-2">
                {t('auth.nameOptional')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="w-full px-4 py-3 border-2 border-fridge-cold rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all text-fridge-dark placeholder:text-gray-400"
                placeholder={t('auth.yourName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-fridge-dark mb-2">
                {t('auth.emailAddress')} *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border-2 border-fridge-cold rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all text-fridge-dark placeholder:text-gray-400"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-fridge-dark mb-2">
                {t('auth.password')} *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-fridge-cold rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all text-fridge-dark placeholder:text-gray-400"
                placeholder={t('auth.min6Characters')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-fridge-primary to-fridge-secondary hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fridge-primary disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>{t('auth.creatingAccount')}</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>{t('auth.signUp')}</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-fridge-primary hover:text-fridge-secondary font-medium transition-colors"
            >
              {t('auth.alreadyHaveAccount')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

