'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';
import { supabase } from '@/utils/supabase';
import toast from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { HamburgerButton } from '@/components/HamburgerButton';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';

interface Recipe {
  name: string;
  description: string;
  ingredients: Array<{ name: string; amount: string }>;
  steps: string[];
  cookingTime: string;
  servings: number;
  tips?: string;
}

export default function RecipesPage() {
  const router = useRouter();
  const t = useTranslations();
  const { theme, toggleTheme, mounted: themeMounted } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    }
  );

  const expiringQuery = trpc.products.expiringSoon.useQuery(
    { days: 3 },
    { 
      enabled: mounted,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  const products = Array.isArray(productsQuery.data) ? productsQuery.data : [];
  const expiring = Array.isArray(expiringQuery.data) ? expiringQuery.data : [];

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleGenerateRecipe = async () => {
    if (selectedProducts.size === 0) {
      toast.error(t('recipes.noProductsSelected'));
      return;
    }

    setIsGenerating(true);
    setRecipe(null);

    try {
      const selectedProductData = products.filter(p => selectedProducts.has(p.id));
      const productIds = selectedProductData.map(p => p.id);
      const productNames = selectedProductData.map(p => p.name);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Unauthorized');
        return;
      }

      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          productIds,
          productNames,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate recipe');
      }

      const data = await response.json();
      setRecipe(data.recipe);
      toast.success(t('recipes.recipeGenerated'));
    } catch (error) {
      console.error('Error generating recipe:', error);
      toast.error(t('recipes.recipeError'));
    } finally {
      setIsGenerating(false);
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

        <main className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary mb-2 flex items-center space-x-2">
              <span>🍳</span>
              <span>{t('recipes.title')}</span>
            </h1>
            <p className="text-muted">{t('recipes.selectProductsHint')}</p>
          </div>

          {/* Product Selection */}
          <div className="bg-card border-2 border-card rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">
                {t('recipes.selectProducts')} ({selectedProducts.size} {t('recipes.selected')})
              </h2>
              {selectedProducts.size > 0 && (
                <button
                  onClick={() => setSelectedProducts(new Set())}
                  className="text-sm text-fridge-primary hover:text-fridge-secondary transition-colors"
                >
                  {t('recipes.clearSelection')}
                </button>
              )}
            </div>

            {/* Expiring Soon Products */}
            {expiring.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-primary mb-2">⚠️ {t('dashboard.expiringSoonProducts')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {expiring.map((product) => (
                    <label
                      key={product.id}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedProducts.has(product.id)
                          ? 'bg-fridge-primary/20 border-fridge-primary'
                          : 'bg-input border-input hover:border-fridge-primary/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="w-4 h-4 text-fridge-primary rounded focus:ring-fridge-primary"
                      />
                      <span className="text-primary flex-1">{product.name}</span>
                      {product.category && (
                        <span className="text-sm text-muted">{product.category.name}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* All Products */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2">{t('products.name')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProducts.has(product.id)
                        ? 'bg-fridge-primary/20 border-fridge-primary'
                        : 'bg-input border-input hover:border-fridge-primary/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="w-4 h-4 text-fridge-primary rounded focus:ring-fridge-primary"
                    />
                    <span className="text-primary flex-1">{product.name}</span>
                    {product.category && (
                      <span className="text-sm text-muted">{product.category.name}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateRecipe}
              disabled={selectedProducts.size === 0 || isGenerating}
              className="w-full mt-6 bg-gradient-to-r from-fridge-primary to-fridge-secondary text-white py-3 px-6 rounded-xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fridge-primary disabled:opacity-50 transition-all font-semibold"
            >
              {isGenerating ? `⏳ ${t('recipes.generating')}` : `🍳 ${t('recipes.generateRecipe')}`}
            </button>
          </div>

          {/* Generated Recipe */}
          {recipe && (
            <div className="bg-card border-2 border-card rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-primary mb-4">{recipe.name}</h2>
              <p className="text-secondary mb-6">{recipe.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">⏱️ {t('recipes.cookingTime')}</h3>
                  <p className="text-secondary">{recipe.cookingTime}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">🍽️ {t('recipes.servings')}</h3>
                  <p className="text-secondary">{recipe.servings}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary mb-3">🥘 {t('recipes.ingredients')}</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start space-x-2 text-secondary">
                      <span className="text-fridge-primary">•</span>
                      <span><strong>{ingredient.name}</strong> - {ingredient.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary mb-3">📝 {t('recipes.steps')}</h3>
                <ol className="space-y-3">
                  {recipe.steps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-3 text-secondary">
                      <span className="flex-shrink-0 w-6 h-6 bg-fridge-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {recipe.tips && (
                <div className="bg-fridge-light/50 dark:bg-gray-700/50 border-2 border-fridge-primary/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-primary mb-2">💡 {t('recipes.tips')}</h3>
                  <p className="text-secondary">{recipe.tips}</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

