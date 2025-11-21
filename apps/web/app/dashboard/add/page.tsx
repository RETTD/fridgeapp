'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';
import toast from 'react-hot-toast';
import { Sidebar } from '@/components/Sidebar';
import { HamburgerButton } from '@/components/HamburgerButton';

export default function AddProductPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  const utils = trpc.useUtils();
  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success('Product added successfully!');
      utils.products.list.invalidate();
      router.push('/dashboard');
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
      toast.error('Please enter a product name');
      return;
    }

    if (!expiryDate || expiryDate.length === 0) {
      toast.error('Please select an expiry date');
      return;
    }

    // Konwersja daty - upewnij się że jest poprawnym ISO stringiem
    let expiryDateISO: string;
    try {
      const date = new Date(expiryDate);
      if (isNaN(date.getTime())) {
        toast.error('Invalid date format');
        return;
      }
      expiryDateISO = date.toISOString();
    } catch (error) {
      console.error('Date conversion error:', error);
      toast.error('Invalid date format');
      return;
    }

    // Przygotowanie danych - upewnij się że wszystkie wymagane pola są stringami
    const productData = {
      name: String(trimmedName),
      expiryDate: String(expiryDateISO),
      quantity: Number(quantity) || 1,
      category: category?.trim() || undefined,
      location: location?.trim() || undefined,
    };

    // Walidacja przed wysłaniem
    if (!productData.name || productData.name.length === 0) {
      toast.error('Product name is required');
      return;
    }

    if (!productData.expiryDate || productData.expiryDate.length === 0) {
      toast.error('Expiry date is required');
      return;
    }

    console.log('Submitting product data:', productData);
    console.log('Name type:', typeof productData.name, 'Value:', productData.name);
    console.log('ExpiryDate type:', typeof productData.expiryDate, 'Value:', productData.expiryDate);

    createMutation.mutate(productData);
  };

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
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-fridge-primary hover:text-fridge-secondary transition-colors"
                >
                  <span>←</span>
                  <span>Back to Dashboard</span>
                </Link>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🧊</span>
                <h1 className="text-xl font-bold bg-gradient-to-r from-fridge-primary to-fridge-secondary bg-clip-text text-transparent">
                  Fridge App
                </h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto p-6">
          <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 border-2 border-fridge-cold/30">
            <div className="flex items-center space-x-3 mb-6">
              <span className="text-3xl">➕</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-fridge-primary to-fridge-secondary bg-clip-text text-transparent">
                Add Product
              </h1>
            </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-fridge-dark mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Milk, Bread, Eggs"
                className="w-full px-4 py-3 border-2 border-fridge-cold rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all text-fridge-dark placeholder:text-gray-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-fridge-dark mb-2">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 border-2 border-fridge-cold rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all text-fridge-dark"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-fridge-dark mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-4 py-3 border-2 border-fridge-cold rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all text-fridge-dark placeholder:text-gray-400"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-fridge-dark mb-2">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g., Dairy, Meat, Vegetables"
                className="w-full px-4 py-3 border-2 border-fridge-cold rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all text-fridge-dark placeholder:text-gray-400"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-fridge-dark mb-2">
                Location
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-fridge-cold rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-white text-fridge-dark"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Select location</option>
                <option value="fridge">🧊 Fridge</option>
                <option value="freezer">❄️ Freezer</option>
                <option value="pantry">📦 Pantry</option>
              </select>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="flex-1 bg-gradient-to-r from-fridge-primary to-fridge-secondary text-white py-3 px-6 rounded-xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fridge-primary disabled:opacity-50 transition-all font-semibold"
              >
                {createMutation.isLoading ? '⏳ Adding...' : '✅ Add Product'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-fridge-light text-fridge-dark py-3 px-6 rounded-xl hover:bg-fridge-cold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fridge-primary transition-all font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
      </div>
    </div>
  );
}

