'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';
import { supabase } from '@/utils/supabase';
import toast from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { HamburgerButton } from '@/components/HamburgerButton';

export default function DashboardPage() {
  const router = useRouter();
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

  const utils = trpc.useUtils();
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully!');
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
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate({ id });
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
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
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-2">{error.message || 'Unknown error'}</p>
            <p className="text-sm text-gray-500 mb-4">
              {errorCode === 'INTERNAL_SERVER_ERROR' 
                ? 'There was a server error. Please try again later.'
                : errorCode === 'BAD_REQUEST'
                ? 'Invalid request. Please check your input.'
                : errorCode === 'NOT_FOUND'
                ? 'Resource not found.'
                : errorCode === 'TIMEOUT'
                ? 'Request timed out. Please try again.'
                : `Error ${httpStatus || errorCode}. Please try again.`}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fridge-ice via-white to-fridge-light flex">
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
        <nav className="hidden lg:block bg-white/80 backdrop-blur-sm shadow-sm border-b border-fridge-cold/20 sticky top-0 z-30">
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
                    Fridge App
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard/add"
                  className="px-4 py-2 bg-gradient-to-r from-fridge-primary to-fridge-secondary text-white rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  ➕ Add Product
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="p-4 sm:p-6 lg:p-8">
        {expiring && expiring.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-5 shadow-lg">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-lg font-bold text-orange-800">
                Expiring Soon ({expiring.length})
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
                    {' '}- expires {new Date(product.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-fridge-primary border-t-transparent mb-4"></div>
            <p className="text-fridge-dark text-lg">Loading products...</p>
          </div>
        ) : (!Array.isArray(products) || products.length === 0) ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <span className="text-8xl block mb-4">🧊</span>
              <h2 className="text-2xl font-bold text-fridge-dark mb-2">Your fridge is empty!</h2>
              <p className="text-fridge-dark/70 mb-6">Start tracking your products to reduce waste</p>
            </div>
            <Link
              href="/dashboard/add"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-fridge-primary to-fridge-secondary text-white rounded-xl hover:shadow-xl transition-all font-semibold text-lg"
            >
              <span>➕</span>
              <span>Add your first product</span>
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
                <div
                  key={product.id}
                  className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-2 ${
                    isExpired
                      ? 'border-red-300 bg-red-50/50'
                      : isExpiringSoon
                      ? 'border-orange-300 bg-orange-50/50'
                      : 'border-fridge-cold bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-fridge-dark flex-1">{product.name}</h3>
                    {product.location && (
                      <span className="ml-2 px-2 py-1 bg-fridge-light text-fridge-dark text-xs rounded-full">
                        {product.location}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-fridge-dark/60">📅</span>
                      <span className={`font-medium ${
                        isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-fridge-dark'
                      }`}>
                        {isExpired
                          ? `Expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) !== 1 ? 's' : ''} ago`
                          : isExpiringSoon
                          ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
                          : `Expires: ${expiryDate.toLocaleDateString()}`}
                      </span>
                    </div>

                    {product.quantity > 1 && (
                      <div className="flex items-center space-x-2 text-sm text-fridge-dark/70">
                        <span>📦</span>
                        <span>Quantity: {product.quantity}</span>
                      </div>
                    )}

                    {product.category && (
                      <div className="flex items-center space-x-2 text-sm text-fridge-dark/70">
                        <span>🏷️</span>
                        <span>{product.category}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(product.id)}
                    className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
        </main>
      </div>
    </div>
  );
}

