'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/utils/trpc';
import { supabase } from '@/utils/supabase';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login');
      }
    });
  }, [router]);

  const { data: products, isLoading, error, refetch, isError } = trpc.products.list.useQuery(
    undefined,
    { 
      enabled: mounted,
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Products list error:', error);
        // Jeśli błąd autoryzacji, przekieruj do logowania
        if (error.data?.code === 'UNAUTHORIZED') {
          router.push('/auth/login');
        }
      },
      // Ustaw domyślną wartość na pustą tablicę
      placeholderData: [],
    }
  );

  const { data: expiring } = trpc.products.expiringSoon.useQuery(
    { days: 3 },
    { 
      enabled: mounted,
      retry: 1,
      refetchOnWindowFocus: false,
      placeholderData: [],
      onError: (error) => {
        console.error('Expiring products error:', error);
      }
    }
  );

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

  // Jeśli błąd autoryzacji, nie pokazuj błędu - przekierowanie już nastąpiło w onError
  if (isError && error && error.data?.code !== 'UNAUTHORIZED') {
    console.error('Dashboard error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-2">{error.message || 'Unknown error'}</p>
          <p className="text-sm text-gray-500 mb-4">
            {error.data?.code === 'INTERNAL_SERVER_ERROR' 
              ? 'There was a server error. Please try again later.'
              : 'Something went wrong. Please try again.'}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Fridge App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard/add"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Add Product
              </a>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {expiring && expiring.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              ⚠️ Expiring Soon ({expiring.length})
            </h2>
            <ul className="list-disc list-inside text-yellow-700">
              {expiring.map((product) => (
                <li key={product.id}>
                  {product.name} - expires {new Date(product.expiryDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : (!products || !Array.isArray(products) || products.length === 0) ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No products yet.</p>
            <a
              href="/dashboard/add"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Add your first product
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2">
                  Expires: {new Date(product.expiryDate).toLocaleDateString()}
                </p>
                {product.quantity > 1 && (
                  <p className="text-gray-600 text-sm mb-2">
                    Quantity: {product.quantity}
                  </p>
                )}
                <button
                  onClick={() => handleDelete(product.id)}
                  className="mt-4 text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

