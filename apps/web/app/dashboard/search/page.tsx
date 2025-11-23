'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';
import { Sidebar } from '@/components/Sidebar';
import { HamburgerButton } from '@/components/HamburgerButton';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { formatLabel } from '@/utils/labelFormatter';

export default function SearchPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { theme, toggleTheme, mounted: themeMounted } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'expiryDate' | 'createdAt' | 'name' | 'brand'>('expiryDate');

  // Search products with debounce
  const { data: products = [], isLoading } = trpc.products.list.useQuery(
    {
      filter: searchQuery || undefined,
      sortBy: sortBy,
    },
    {
      enabled: true, // Always enabled, filter handles empty search
    }
  );

  const utils = trpc.useUtils();
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
    },
    onError: (error) => {
      console.error('Delete error:', error);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm(t('products.deleteConfirm'))) {
      deleteMutation.mutate({ id });
    }
  };

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
                <button
                  onClick={toggleTheme}
                  disabled={!themeMounted}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                  title={theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
                >
                  <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
                </button>
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

        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Search Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">🔍</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-fridge-primary to-fridge-secondary bg-clip-text text-transparent">
                {t('search.title')}
              </h1>
            </div>

            {/* Search Bar */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg rounded-xl p-4 border-2 border-fridge-cold/30 dark:border-gray-700/30">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder={t('search.placeholder')}
                      className="w-full pl-12 pr-4 py-3 border-2 border-fridge-cold dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-white dark:bg-gray-700 text-fridge-dark dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    className="w-full px-4 py-3 border-2 border-fridge-cold dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-white dark:bg-gray-700 text-fridge-dark dark:text-gray-200"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  >
                    <option value="expiryDate">{t('search.sortByExpiry')}</option>
                    <option value="name">{t('search.sortByName')}</option>
                    <option value="brand">{t('search.sortByBrand')}</option>
                    <option value="createdAt">{t('search.sortByDateAdded')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-fridge-primary border-t-transparent mb-4"></div>
              <p className="text-fridge-dark dark:text-gray-300 text-lg">{t('search.searching')}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="mb-6">
                <span className="text-8xl block mb-4">🔍</span>
                <h2 className="text-2xl font-bold text-fridge-dark dark:text-gray-200 mb-2">
                  {searchQuery ? t('search.noResults') : t('search.startSearching')}
                </h2>
                <p className="text-fridge-dark/70 dark:text-gray-400 mb-6">
                  {searchQuery
                    ? `${t('search.noMatch')} "${searchQuery}"`
                    : t('search.enterProductName')}
                </p>
              </div>
              {!searchQuery && (
                <Link
                  href="/dashboard/add"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-fridge-primary to-fridge-secondary text-white rounded-xl hover:shadow-xl transition-all font-semibold text-lg"
                >
                  <span>➕</span>
                  <span>{t('dashboard.addFirstProduct')}</span>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-fridge-dark/70 dark:text-gray-400">
                  {t('search.found')} <span className="font-semibold text-fridge-primary">{products.length}</span>{' '}
                  {products.length === 1 ? t('search.product') : t('search.products')}
                  {searchQuery && ` ${t('search.noMatch').toLowerCase()} "${searchQuery}"`}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const expiryDate = new Date(product.expiryDate);
                  const daysUntilExpiry = Math.ceil(
                    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  const isExpiringSoon = daysUntilExpiry <= 3;
                  const isExpired = daysUntilExpiry < 0;

                  return (
                    <div
                      key={product.id}
                      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 transition-all hover:shadow-xl ${
                        isExpired
                          ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20'
                          : isExpiringSoon
                          ? 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/20'
                          : 'border-fridge-cold/30 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-fridge-dark dark:text-gray-200">
                            {product.name}
                          </h3>
                          {product.brand && (
                            <div className="mt-1 flex items-center space-x-2">
                              <span className="text-xs font-semibold text-fridge-primary dark:text-fridge-primary/80">🏷️</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{product.brand}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-500 hover:text-red-700 text-sm ml-2"
                          title="Delete product"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Etykiety z OpenFoodFacts */}
                      {product.labels && product.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.labels.map((label: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-fridge-primary/20 text-fridge-primary dark:bg-fridge-primary/30 dark:text-fridge-primary rounded-full text-xs font-medium"
                            >
                              {formatLabel(label, locale)}
                            </span>
                          ))}
                        </div>
                      )}

                      {product.category && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-1 bg-fridge-light dark:bg-gray-700 text-fridge-dark dark:text-gray-200 rounded-lg text-xs font-medium">
                            {product.category.icon && <span className="mr-1">{product.category.icon}</span>}
                            {product.category.name}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 dark:text-gray-400">📅</span>
                          <span
                            className={
                              isExpired
                                ? 'text-red-600 dark:text-red-400 font-semibold'
                                : isExpiringSoon
                                ? 'text-orange-600 dark:text-orange-400 font-semibold'
                                : 'text-fridge-dark dark:text-gray-300'
                            }
                          >
                            {isExpired
                              ? `${t('products.expired')} ${Math.abs(daysUntilExpiry)} ${t('products.days')} ${t('products.ago')}`
                              : isExpiringSoon
                              ? `${t('products.expires')} ${t('dashboard.expiresWithin3Days').toLowerCase()} (${daysUntilExpiry} ${t('products.days')})`
                              : `${t('products.expires')} ${expiryDate.toLocaleDateString()}`}
                          </span>
                        </div>

                        {product.quantity > 1 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500 dark:text-gray-400">📦</span>
                            <span className="text-fridge-dark dark:text-gray-300">{t('products.quantity')}: {product.quantity}</span>
                          </div>
                        )}

                        {product.location && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500 dark:text-gray-400">
                              {product.location === 'fridge'
                                ? '🧊'
                                : product.location === 'freezer'
                                ? '❄️'
                                : '📦'}
                            </span>
                            <span className="text-fridge-dark dark:text-gray-300 capitalize">{product.location}</span>
                          </div>
                        )}

                        {/* Wartości odżywcze */}
                        {product.nutritionData && typeof product.nutritionData === 'object' && (
                          <div className="mt-2 pt-2 border-t border-fridge-cold/30 dark:border-gray-700">
                            <div className="text-xs font-semibold text-fridge-dark/80 dark:text-gray-400 mb-1">💪 {t('products.nutrition')}</div>
                            <div className="grid grid-cols-2 gap-1 text-xs">
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
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

