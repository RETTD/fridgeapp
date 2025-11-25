'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';
import toast from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { HamburgerButton } from '@/components/HamburgerButton';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from '@/components/ThemeProvider';
import { formatLabel } from '@/utils/labelFormatter';

export default function AddProductPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { theme, toggleTheme, mounted: themeMounted } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProductId = searchParams.get('edit');
  const isEditMode = !!editProductId;
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [quantityUnit, setQuantityUnit] = useState<string>('szt');
  const [categoryId, setCategoryId] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  const utils = trpc.useUtils();
  
  // Fetch categories
  const { data: categories = [], refetch: refetchCategories } = trpc.categories.list.useQuery();
  
  // Fetch product for editing
  const { data: productToEdit, isLoading: isLoadingProduct } = trpc.products.get.useQuery(
    { id: editProductId! },
    {
      enabled: isEditMode && !!editProductId,
      onError: (error) => {
        if (error.data?.code === 'NOT_FOUND') {
          toast.error(t('products.productNotFound'));
          router.push('/dashboard');
        }
      },
    }
  );

  // Only show loading when actually editing and loading product data
  const isActuallyLoading = isEditMode && isLoadingProduct;

  // Load product data into form when editing
  useEffect(() => {
    if (productToEdit && isEditMode) {
      setName(productToEdit.name || '');
      setExpiryDate(new Date(productToEdit.expiryDate).toISOString().split('T')[0]);
      setQuantity(productToEdit.quantity || 1);
      setCategoryId(productToEdit.categoryId || '');
      setLocation(productToEdit.location || '');
      setNotes(productToEdit.notes || '');
      
      // Load existing product data as scannedProduct for display
      if (productToEdit.brand || productToEdit.barcode || (productToEdit as any).manufacturer || productToEdit.nutritionData) {
        setScannedProduct({
          name: productToEdit.name,
          brand: productToEdit.brand,
          manufacturer: (productToEdit as any).manufacturer,
          barcode: productToEdit.barcode,
          ingredients: productToEdit.ingredients,
          allergens: productToEdit.allergens,
          nutrition: productToEdit.nutritionData,
          labels: productToEdit.labels || [],
        });
      }
    }
  }, [productToEdit, isEditMode]);
  
  // Create category mutation
  const createCategoryMutation = trpc.categories.create.useMutation({
    onSuccess: async (newCategory) => {
      toast.success(t('products.categoryCreated'));
      await refetchCategories();
      setCategoryId(newCategory.id);
      setShowNewCategoryInput(false);
      setNewCategoryName('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success(t('products.productAdded'));
      utils.products.list.invalidate();
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success(t('products.productUpdated'));
      utils.products.list.invalidate();
      router.push(`/dashboard/products/${editProductId}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Walidacja - sprawdź czy wartości są ustawione
    const trimmedName = name?.trim();
    if (!trimmedName || trimmedName.length === 0) {
      toast.error(t('products.productNameRequired'));
      return;
    }

    if (!expiryDate || expiryDate.length === 0) {
      toast.error(t('products.expiryDateRequired'));
      return;
    }

    // Konwersja daty - upewnij się że jest poprawnym ISO stringiem
    let expiryDateISO: string;
    try {
      const date = new Date(expiryDate);
      if (isNaN(date.getTime())) {
        toast.error(t('products.invalidDate'));
        return;
      }
      expiryDateISO = date.toISOString();
    } catch (error) {
      console.error('Date conversion error:', error);
      toast.error(t('products.invalidDate'));
      return;
    }

    // Przygotowanie danych - upewnij się że wszystkie wymagane pola są stringami
    const productData: any = {
      name: String(trimmedName),
      expiryDate: String(expiryDateISO),
      quantity: Number(quantity) || 1,
      categoryId: categoryId || undefined,
      location: location?.trim() || undefined,
      notes: notes?.trim() || undefined,
      // Dane z OpenFoodFacts (jeśli produkt został zeskanowany lub edytowany)
      barcode: scannedProduct?.barcode || productToEdit?.barcode || undefined,
      brand: scannedProduct?.brand || productToEdit?.brand || undefined,
      manufacturer: scannedProduct?.manufacturer || (productToEdit as any)?.manufacturer || undefined,
      ingredients: scannedProduct?.ingredients || productToEdit?.ingredients || undefined,
      allergens: scannedProduct?.allergens || productToEdit?.allergens || undefined,
      nutritionData: scannedProduct?.nutrition 
        ? {
            calories: scannedProduct.nutrition.calories,
            protein: scannedProduct.nutrition.protein,
            carbs: scannedProduct.nutrition.carbs,
            fat: scannedProduct.nutrition.fat,
            fiber: scannedProduct.nutrition.fiber,
            sugars: scannedProduct.nutrition.sugars,
            salt: scannedProduct.nutrition.salt,
          }
        : productToEdit?.nutritionData || undefined,
      labels: scannedProduct?.labels || productToEdit?.labels || undefined,
    };

    // Walidacja przed wysłaniem
    if (!productData.name || productData.name.length === 0) {
      toast.error(t('products.productNameRequired'));
      return;
    }

    if (!productData.expiryDate || productData.expiryDate.length === 0) {
      toast.error(t('products.expiryDateRequired'));
      return;
    }

    if (isEditMode && editProductId) {
      updateMutation.mutate({
        id: editProductId,
        ...productData,
      });
    } else {
      createMutation.mutate(productData);
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

        <main className="max-w-2xl mx-auto p-4 sm:p-6">
          <div className="bg-card backdrop-blur-sm shadow-xl rounded-2xl p-6 border-2 border-card">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">{isEditMode ? '✏️' : '➕'}</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-fridge-primary to-fridge-secondary bg-clip-text text-transparent">
                {isEditMode ? t('products.editProduct') : t('products.addProduct')}
              </h1>
            </div>

            {isActuallyLoading && (
              <div className="mb-4 text-center text-fridge-dark/60 dark:text-gray-400">
                {t('common.loading')}...
              </div>
            )}
          
          {showScanner ? (
            <div className="mb-6">
              <BarcodeScanner
                onProductFound={(product) => {
                  setScannedProduct(product);
                  setName(product.name || '');
                  setShowScanner(false);
                  toast.success('Product information loaded!');
                }}
                onClose={() => setShowScanner(false)}
              />
            </div>
          ) : (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="w-full bg-gradient-to-r from-fridge-primary to-fridge-secondary text-white py-3 px-6 rounded-xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fridge-primary transition-all font-semibold flex items-center justify-center gap-2"
              >
                <span>📷</span>
                <span>Scan Barcode</span>
              </button>
            </div>
          )}

          {scannedProduct && (
            <div className="mb-6 p-4 bg-fridge-light dark:bg-gray-700 rounded-xl border-2 border-fridge-primary">
              <div className="flex items-start gap-4">
                {scannedProduct.image && (
                  <img
                    src={scannedProduct.image}
                    alt={scannedProduct.name}
                    className="w-24 h-24 object-contain rounded-lg"
                  />
                )}
                <div className="flex-1">
                  {scannedProduct.brand && (
                    <p className="text-sm text-muted mb-1">
                      <span className="font-semibold">{t('products.brand')}:</span> {scannedProduct.brand}
                    </p>
                  )}
                  {scannedProduct.barcode && (
                    <p className="text-xs text-muted mb-1 font-mono">
                      <span className="font-semibold">{t('products.barcode')}:</span> {scannedProduct.barcode}
                    </p>
                  )}
                  {scannedProduct.nutrition?.calories && (
                    <p className="text-sm text-primary">
                      <span className="font-semibold">{t('products.nutrition')}:</span> {scannedProduct.nutrition.calories} kcal
                      {scannedProduct.nutrition.servingSize && (
                        <span className="text-muted"> / {scannedProduct.nutrition.servingSize}</span>
                      )}
                      {!scannedProduct.nutrition.servingSize && scannedProduct.nutrition.servingQuantity && (
                        <span className="text-muted"> / {scannedProduct.nutrition.servingQuantity}</span>
                      )}
                      {!scannedProduct.nutrition.servingSize && !scannedProduct.nutrition.servingQuantity && (
                        <span className="text-muted"> / 100g</span>
                      )}
                    </p>
                  )}
                  {scannedProduct.labels && scannedProduct.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {scannedProduct.labels.map((label: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-fridge-primary/20 text-fridge-primary rounded-full"
                        >
                          {formatLabel(label, locale)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScannedProduct(null);
                    setName('');
                  }}
                  className="text-muted hover:text-primary transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                {t('products.name')} *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Milk, Bread, Eggs"
                className="w-full px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary placeholder:text-muted"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                {t('products.expiryDate')} *
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                {t('products.quantity')}
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary placeholder:text-muted"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                {t('products.category')}
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary"
                    value={categoryId}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '__new__') {
                        setShowNewCategoryInput(true);
                        setCategoryId('');
                      } else {
                        setCategoryId(value);
                        setShowNewCategoryInput(false);
                      }
                    }}
                  >
                    <option value="">{t('products.noCategory')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon && <span>{cat.icon} </span>}
                        {cat.name}
                      </option>
                    ))}
                    <option value="__new__">➕ {t('products.addNewCategory')}</option>
                  </select>
                </div>
                
                {showNewCategoryInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('products.categoryName')}
                      className="flex-1 px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary placeholder:text-muted"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCategoryName.trim()) {
                            createCategoryMutation.mutate({ name: newCategoryName.trim() });
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCategoryName.trim()) {
                          createCategoryMutation.mutate({ name: newCategoryName.trim() });
                        }
                      }}
                      disabled={!newCategoryName.trim() || createCategoryMutation.isLoading}
                      className="px-4 py-2 bg-fridge-primary text-white rounded-xl hover:bg-fridge-secondary disabled:opacity-50 transition-all font-semibold"
                    >
                      {createCategoryMutation.isLoading ? '⏳' : '✅'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                        setCategoryId('');
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                {t('products.location')}
              </label>
              <select
                className="w-full px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">{t('products.selectLocation')}</option>
                <option value="fridge">{t('products.fridge')}</option>
                <option value="freezer">{t('products.freezer')}</option>
                <option value="pantry">{t('products.pantry')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">
                {t('products.notes')}
              </label>
              <textarea
                className="w-full px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary placeholder:text-muted min-h-[100px]"
                placeholder={t('products.notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex space-x-4 pt-2">
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading || isActuallyLoading}
                className="flex-1 bg-gradient-to-r from-fridge-primary to-fridge-secondary text-white py-2.5 px-6 rounded-xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fridge-primary disabled:opacity-50 transition-all font-semibold"
              >
                {isEditMode
                  ? updateMutation.isLoading
                    ? `⏳ ${t('products.updating')}`
                    : `✅ ${t('products.updateProduct')}`
                  : createMutation.isLoading
                  ? `⏳ ${t('products.adding')}`
                  : `✅ ${t('products.addProduct')}`}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-fridge-light dark:bg-gray-700 text-primary py-2.5 px-6 rounded-xl hover:bg-fridge-cold dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fridge-primary transition-all font-semibold"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </main>
      </div>
    </div>
  );
}

