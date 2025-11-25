'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';
import { supabase } from '@/utils/supabase';
import toast from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { HamburgerButton } from '@/components/HamburgerButton';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { formatLabel } from '@/utils/labelFormatter';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const t = useTranslations();
  const locale = useLocale();
  const { theme, toggleTheme, mounted: themeMounted } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login');
      }
    });
  }, [router]);

  const { data: product, isLoading, error } = trpc.products.get.useQuery(
    { id: productId },
    {
      enabled: mounted && !!productId,
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        if (error.data?.code === 'UNAUTHORIZED') {
          router.push('/auth/login');
        } else if (error.data?.code === 'NOT_FOUND') {
          router.push('/dashboard');
        }
      },
    }
  );

  const utils = trpc.useUtils();
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success(t('products.productDeleted'));
      utils.products.list.invalidate();
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    if (confirm(t('products.deleteConfirm'))) {
      deleteMutation.mutate({ id: productId });
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-fridge-dark dark:text-gray-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-fridge-dark dark:text-gray-300 mb-4">{t('products.productNotFound')}</p>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-fridge-primary text-white rounded-lg hover:bg-fridge-secondary transition-colors"
          >
            {t('common.back')}
          </Link>
        </div>
      </div>
    );
  }

  const expiryDate = new Date(product.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 3;
  const isExpired = daysUntilExpiry < 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-fridge-ice via-white to-fridge-light dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Top Navigation */}
        <nav className="lg:hidden bg-gradient-to-r from-fridge-primary to-fridge-secondary shadow-md sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <HamburgerButton onClick={() => setSidebarOpen(!sidebarOpen)} />
            <h1 className="text-white font-bold text-lg">{t('products.productDetails')}</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </nav>

        <main className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Back button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-fridge-primary hover:text-fridge-secondary mb-6 transition-colors"
          >
            <span>←</span>
            <span>{t('common.back')}</span>
          </Link>

          {/* Product Card */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8 border-2 ${
              isExpired
                ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20'
                : isExpiringSoon
                ? 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/20'
                : 'border-fridge-cold dark:border-gray-700'
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-fridge-dark dark:text-gray-200 mb-2">
                  {product.name}
                </h1>
                {product.brand && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">🏷️</span>
                    <p className="text-lg text-fridge-dark/70 dark:text-gray-400 font-medium">{product.brand}</p>
                  </div>
                )}
              </div>
              {product.location && (
                <span className="ml-4 px-3 py-1 bg-fridge-light dark:bg-gray-700 text-fridge-dark dark:text-gray-200 text-sm rounded-full">
                  {product.location === 'fridge'
                    ? '🧊 Fridge'
                    : product.location === 'freezer'
                    ? '❄️ Freezer'
                    : '📦 Pantry'}
                </span>
              )}
            </div>

            {/* Etykiety */}
            {product.labels && product.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.labels.map((label: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-fridge-primary/20 text-fridge-primary dark:bg-fridge-primary/30 dark:text-fridge-primary rounded-full text-sm font-medium"
                  >
                    {formatLabel(label, locale)}
                  </span>
                ))}
              </div>
            )}

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Expiry Date */}
              <div className="bg-fridge-light dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">📅</span>
                  <h3 className="font-semibold text-fridge-dark dark:text-gray-200">
                    {t('products.expiryDate')}
                  </h3>
                </div>
                <p
                  className={`text-lg font-medium ${
                    isExpired
                      ? 'text-red-600 dark:text-red-400'
                      : isExpiringSoon
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-fridge-dark dark:text-gray-300'
                  }`}
                >
                  {isExpired
                    ? `${t('products.expired')} ${Math.abs(daysUntilExpiry)} ${t('products.days')} ${t('products.ago')}`
                    : isExpiringSoon
                    ? `${t('products.expires')} ${t('dashboard.expiresWithin3Days').toLowerCase()} (${daysUntilExpiry} ${t('products.days')})`
                    : expiryDate.toLocaleDateString()}
                </p>
                <p className="text-sm text-fridge-dark/60 dark:text-gray-400 mt-1">
                  {expiryDate.toLocaleString()}
                </p>
              </div>

              {/* Quantity */}
              <div className="bg-fridge-light dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">📦</span>
                  <h3 className="font-semibold text-fridge-dark dark:text-gray-200">
                    {t('products.quantity')}
                  </h3>
                </div>
                <p className="text-2xl font-bold text-fridge-dark dark:text-gray-300">
                  {product.quantity}
                </p>
              </div>

              {/* Category */}
              {product.category && (
                <div className="bg-fridge-light dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🏷️</span>
                    <h3 className="font-semibold text-fridge-dark dark:text-gray-200">
                      {t('products.category')}
                    </h3>
                  </div>
                  <p className="text-lg text-fridge-dark dark:text-gray-300">
                    {product.category.icon && <span className="mr-2">{product.category.icon}</span>}
                    {product.category.name}
                  </p>
                </div>
              )}

              {/* Barcode */}
              {product.barcode && (
                <div className="bg-fridge-light dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🔢</span>
                    <h3 className="font-semibold text-fridge-dark dark:text-gray-200">
                      {t('products.barcode')}
                    </h3>
                  </div>
                  <p className="text-lg font-mono text-fridge-dark dark:text-gray-300">
                    {product.barcode}
                  </p>
                </div>
              )}

            </div>

            {/* Nutrition Data */}
            {product.nutritionData && typeof product.nutritionData === 'object' && (
              <div className="bg-fridge-light dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-fridge-dark dark:text-gray-200 mb-4 flex items-center">
                  <span className="mr-2">💪</span>
                  {t('products.nutrition')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {product.nutritionData.calories && (
                    <div>
                      <p className="text-sm text-fridge-dark/60 dark:text-gray-400 mb-1">Calories</p>
                      <p className="text-2xl font-bold text-fridge-dark dark:text-gray-300">
                        {product.nutritionData.calories}
                        <span className="text-sm font-normal ml-1">kcal</span>
                      </p>
                    </div>
                  )}
                  {product.nutritionData.protein && (
                    <div>
                      <p className="text-sm text-fridge-dark/60 dark:text-gray-400 mb-1">
                        {t('products.protein')}
                      </p>
                      <p className="text-2xl font-bold text-fridge-dark dark:text-gray-300">
                        {product.nutritionData.protein}
                        <span className="text-sm font-normal ml-1">g</span>
                      </p>
                    </div>
                  )}
                  {product.nutritionData.carbs && (
                    <div>
                      <p className="text-sm text-fridge-dark/60 dark:text-gray-400 mb-1">
                        {t('products.carbs')}
                      </p>
                      <p className="text-2xl font-bold text-fridge-dark dark:text-gray-300">
                        {product.nutritionData.carbs}
                        <span className="text-sm font-normal ml-1">g</span>
                      </p>
                    </div>
                  )}
                  {product.nutritionData.fat && (
                    <div>
                      <p className="text-sm text-fridge-dark/60 dark:text-gray-400 mb-1">
                        {t('products.fat')}
                      </p>
                      <p className="text-2xl font-bold text-fridge-dark dark:text-gray-300">
                        {product.nutritionData.fat}
                        <span className="text-sm font-normal ml-1">g</span>
                      </p>
                    </div>
                  )}
                  {product.nutritionData.fiber && (
                    <div>
                      <p className="text-sm text-fridge-dark/60 dark:text-gray-400 mb-1">Fiber</p>
                      <p className="text-2xl font-bold text-fridge-dark dark:text-gray-300">
                        {product.nutritionData.fiber}
                        <span className="text-sm font-normal ml-1">g</span>
                      </p>
                    </div>
                  )}
                  {product.nutritionData.sugars && (
                    <div>
                      <p className="text-sm text-fridge-dark/60 dark:text-gray-400 mb-1">Sugars</p>
                      <p className="text-2xl font-bold text-fridge-dark dark:text-gray-300">
                        {product.nutritionData.sugars}
                        <span className="text-sm font-normal ml-1">g</span>
                      </p>
                    </div>
                  )}
                  {product.nutritionData.salt && (
                    <div>
                      <p className="text-sm text-fridge-dark/60 dark:text-gray-400 mb-1">Salt</p>
                      <p className="text-2xl font-bold text-fridge-dark dark:text-gray-300">
                        {product.nutritionData.salt}
                        <span className="text-sm font-normal ml-1">g</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ingredients */}
            {product.ingredients && (
              <div className="bg-fridge-light dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-fridge-dark dark:text-gray-200 mb-3 flex items-center">
                  <span className="mr-2">🥘</span>
                  {t('recipes.ingredients')}
                </h3>
                <p className="text-fridge-dark dark:text-gray-300 whitespace-pre-wrap">
                  {product.ingredients}
                </p>
              </div>
            )}

            {/* Allergens */}
            {product.allergens && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 mb-6 border-2 border-red-200 dark:border-red-800">
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-3 flex items-center">
                  <span className="mr-2">⚠️</span>
                  {t('products.allergens')}
                </h3>
                <p className="text-red-700 dark:text-red-300">{product.allergens}</p>
              </div>
            )}

            {/* Notes */}
            {product.notes && (
              <div className="bg-fridge-light dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-fridge-dark dark:text-gray-200 mb-3 flex items-center">
                  <span className="mr-2">📝</span>
                  {t('products.notes')}
                </h3>
                <p className="text-fridge-dark dark:text-gray-300 whitespace-pre-wrap">
                  {product.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link
                href={`/dashboard/add?edit=${product.id}`}
                className="flex-1 px-6 py-3 bg-fridge-primary text-white rounded-lg hover:bg-fridge-secondary transition-colors font-semibold text-center"
              >
                ✏️ {t('common.edit')}
              </Link>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold"
              >
                🗑️ {t('common.delete')}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

