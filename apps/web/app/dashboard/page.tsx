'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';
import { supabase } from '@/utils/supabase';
import toast from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { HamburgerButton } from '@/components/HamburgerButton';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { formatLabel, initializeLabelTranslations } from '@/utils/labelFormatter';

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { theme, toggleTheme, mounted: themeMounted } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Inicjalizuj cache tłumaczeń tagów z OpenFoodFacts
    initializeLabelTranslations();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login');
      }
    });
  }, [router]);

  const productsQuery = trpc.products.list.useQuery(
    undefined,
    { 
      enabled: mounted,
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        if (error.data?.code === 'UNAUTHORIZED') {
          router.push('/auth/login');
        }
      },
    }
  );

  // Zawsze upewnij się że products jest tablicą
  const products = Array.isArray(productsQuery.data) ? productsQuery.data : [];
  const isLoading = productsQuery.isLoading;
  const error = productsQuery.error;
  const isError = productsQuery.isError;
  const refetch = productsQuery.refetch;

  // Sprawdź czy to rzeczywisty błąd HTTP/tRPC (nie puste dane)
  // Puste dane (products = []) to NORMALNA sytuacja, nie błąd!
  const isRealError = isError && error && error.data?.code && 
    error.data.code !== 'UNAUTHORIZED' && 
    productsQuery.data === undefined; // Tylko jeśli NIE mamy danych wcale

  const expiringQuery = trpc.products.expiringSoon.useQuery(
    { days: 3 },
    { 
      enabled: mounted,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  // Zawsze upewnij się że expiring jest tablicą
  const expiring = Array.isArray(expiringQuery.data) ? expiringQuery.data : [];

  // Fetch statistics
  const { data: stats } = trpc.products.stats.useQuery(undefined, {
    enabled: mounted,
    refetchOnWindowFocus: false,
  });

  const utils = trpc.useUtils();
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success(t('products.productDeleted'));
      utils.products.list.invalidate();
      utils.products.expiringSoon.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDelete = (id: string) => {
    if (confirm(t('products.deleteConfirm'))) {
      deleteMutation.mutate({ id });
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Pokaż modal błędu TYLKO dla rzeczywistych błędów HTTP/tRPC (400, 404, 500, 503, etc.)
  // NIE pokazuj dla pustych danych - to jest normalna sytuacja
  if (isRealError) {
    const errorCode = error.data?.code;
    const httpStatus = error.data?.httpStatus;
    
    // Sprawdź czy to rzeczywisty błąd HTTP (nie puste dane)
    const isHttpError = errorCode === 'INTERNAL_SERVER_ERROR' || 
                       errorCode === 'BAD_REQUEST' ||
                       errorCode === 'NOT_FOUND' ||
                       errorCode === 'TIMEOUT' ||
                       errorCode === 'TOO_MANY_REQUESTS' ||
                       httpStatus >= 400;
    
    if (isHttpError) {
      console.error('Dashboard HTTP error:', error);
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">{t('common.error')}</h1>
            <p className="text-gray-600 mb-2">{error.message || t('dashboard.unknownError')}</p>
            <p className="text-sm text-gray-500 mb-4">
              {errorCode === 'INTERNAL_SERVER_ERROR' 
                ? t('dashboard.serverError')
                : errorCode === 'BAD_REQUEST'
                ? t('dashboard.invalidRequest')
                : errorCode === 'NOT_FOUND'
                ? t('dashboard.resourceNotFound')
                : errorCode === 'TIMEOUT'
                ? t('dashboard.requestTimeout')
                : `${t('common.error')} ${httpStatus || errorCode}. ${t('dashboard.errorOccurred')}`}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {t('dashboard.retry')}
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fridge-ice via-white to-fridge-light dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Top Navigation - Mobile: niebieski pasek z hamburgerem */}
        <nav className="lg:hidden bg-gradient-to-r from-fridge-primary to-fridge-secondary shadow-md sticky top-0 z-30">
          <div className="px-4 h-16 flex items-center">
            <HamburgerButton
              isOpen={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            />
          </div>
        </nav>

        {/* Top Navigation - Desktop: pełna nawigacja */}
        <nav className="hidden lg:block bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-fridge-cold/20 dark:border-gray-700/20 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <HamburgerButton
                  isOpen={sidebarOpen}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                />
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🧊</span>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-fridge-primary to-fridge-secondary bg-clip-text text-transparent">
                    {t('common.appName')}
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard/add"
                  className="px-4 py-2 bg-gradient-to-r from-fridge-primary to-fridge-secondary text-white rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  ➕ {t('products.addProduct')}
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="p-4 sm:p-6 lg:p-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Expired Products */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-2 border-red-300 dark:border-red-700 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">⛔</span>
                <span className="text-4xl font-bold text-red-600">
                  {stats?.expired || 0}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">{t('dashboard.expiredProducts')}</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{t('dashboard.productsPastExpiry')}</p>
            </div>

            {/* Expiring Soon */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">⚠️</span>
                <span className="text-4xl font-bold text-orange-600">
                  {stats?.expiringSoon || 0}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">{t('dashboard.expiringSoonProducts')}</h3>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">{t('dashboard.expiresWithin3Days')}</p>
            </div>

            {/* Wasted Last Month */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">💔</span>
                <span className="text-4xl font-bold text-purple-600">
                  {stats?.wastedLastMonth || 0}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300">{t('dashboard.wastedProducts')}</h3>
              <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">{t('dashboard.expiredInLast30Days')}</p>
            </div>
          </div>

          {/* Expiring Soon Alert */}
          {expiring && expiring.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-lg font-bold text-orange-800">
                {t('dashboard.expiringSoonProducts')} ({expiring.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {expiring.map((product) => (
                <div
                  key={product.id}
                  className="bg-white/60 rounded-lg p-3 text-sm text-orange-900"
                >
                  <span className="font-semibold">{product.name}</span>
                    <span className="text-orange-700">
                    {' '}- {t('products.expires')} {new Date(product.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-fridge-primary border-t-transparent mb-4"></div>
            <p className="text-fridge-dark text-lg">{t('dashboard.loadingProducts')}</p>
          </div>
        ) : (!Array.isArray(products) || products.length === 0) ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <span className="text-8xl block mb-4">🧊</span>
              <h2 className="text-2xl font-bold text-fridge-dark mb-2">{t('dashboard.emptyFridge')}</h2>
              <p className="text-fridge-dark/70 mb-6">{t('dashboard.startTracking')}</p>
            </div>
            <Link
              href="/dashboard/add"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-fridge-primary to-fridge-secondary text-white rounded-xl hover:shadow-xl transition-all font-semibold text-lg"
            >
              <span>➕</span>
              <span>{t('dashboard.addFirstProduct')}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const expiryDate = new Date(product.expiryDate);
              const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isExpiringSoon = daysUntilExpiry <= 3;
              const isExpired = daysUntilExpiry < 0;

              return (
                <Link
                  key={product.id}
                  href={`/dashboard/products/${product.id}`}
                  className={`block bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-2 cursor-pointer ${
                    isExpired
                      ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20'
                      : isExpiringSoon
                      ? 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/20'
                      : 'border-fridge-cold dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-fridge-dark dark:text-gray-200">{product.name}</h3>
                      {product.brand && (
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-xs font-semibold text-fridge-primary dark:text-fridge-primary/80">🏷️</span>
                          <span className="text-sm text-fridge-dark/70 dark:text-gray-400 font-medium">{product.brand}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {product.location && (
                        <span className="px-2 py-1 bg-fridge-light text-fridge-dark text-xs rounded-full">
                          {product.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Etykiety z OpenFoodFacts */}
                  {product.labels && product.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.labels.map((label: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-fridge-primary/20 text-fridge-primary dark:bg-fridge-primary/30 dark:text-fridge-primary rounded-full text-xs font-medium"
                        >
                          {formatLabel(label, locale)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-fridge-dark/60">📅</span>
                      <span className={`font-medium ${
                        isExpired ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-orange-600 dark:text-orange-400' : 'text-fridge-dark dark:text-gray-300'
                      }`}>
                        {isExpired
                          ? `${t('products.expired')} ${Math.abs(daysUntilExpiry)} ${t('products.days')} ${t('products.ago')}`
                          : isExpiringSoon
                          ? `${t('products.expires')} ${t('dashboard.expiresWithin3Days').toLowerCase()} (${daysUntilExpiry} ${t('products.days')})`
                          : `${t('products.expires')}: ${expiryDate.toLocaleDateString()}`}
                      </span>
                    </div>

                    {product.quantity > 1 && (
                      <div className="flex items-center space-x-2 text-sm text-fridge-dark/70 dark:text-gray-400">
                        <span>📦</span>
                        <span>{t('products.quantity')}: {product.quantity}</span>
                      </div>
                    )}

                    {product.category && (
                      <div className="flex items-center space-x-2 text-sm text-fridge-dark/70 dark:text-gray-400">
                        <span>🏷️</span>
                        <span>{product.category.icon && <span className="mr-1">{product.category.icon}</span>}{product.category.name}</span>
                      </div>
                    )}

                    {/* Wartości odżywcze */}
                    {product.nutritionData && typeof product.nutritionData === 'object' && (
                      <div className="mt-3 pt-3 border-t border-fridge-cold/30 dark:border-gray-700">
                        <div className="text-xs font-semibold text-fridge-dark/80 dark:text-gray-400 mb-2">💪 {t('products.nutrition')}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {product.nutritionData.calories && (
                            <div className="text-fridge-dark/70 dark:text-gray-400">
                              <span className="font-medium">{product.nutritionData.calories}</span> kcal
                            </div>
                          )}
                          {product.nutritionData.protein && (
                            <div className="text-fridge-dark/70 dark:text-gray-400">
                              <span className="font-medium">{product.nutritionData.protein}g</span> {t('products.protein')}
                            </div>
                          )}
                          {product.nutritionData.carbs && (
                            <div className="text-fridge-dark/70 dark:text-gray-400">
                              <span className="font-medium">{product.nutritionData.carbs}g</span> {t('products.carbs')}
                            </div>
                          )}
                          {product.nutritionData.fat && (
                            <div className="text-fridge-dark/70 dark:text-gray-400">
                              <span className="font-medium">{product.nutritionData.fat}g</span> {t('products.fat')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Alergeny */}
                    {product.allergens && (
                      <div className="mt-2 pt-2 border-t border-fridge-cold/30 dark:border-gray-700">
                        <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">⚠️ {t('products.allergens')}</div>
                        <div className="text-xs text-red-600/80 dark:text-red-400/80">{product.allergens}</div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(product.id);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                  >
                    🗑️ {t('common.delete')}
                  </button>
                </Link>
              );
            })}
          </div>
        )}
        </main>
      </div>
    </div>
  );
}

