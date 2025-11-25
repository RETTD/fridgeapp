'use client';

import { useState, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { trpc } from '@/utils/trpc';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
  onProductFound?: (product: any) => void;
  onClose?: () => void;
}

export function BarcodeScanner({ onProductFound, onClose }: BarcodeScannerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getProductByBarcode = trpc.products.getByBarcode.useMutation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Sprawdź typ pliku
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setSelectedFile(file);
    
    // Utwórz preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setScanning(true);
    setScannedBarcode('');

    try {
      const codeReader = new BrowserMultiFormatReader();
      
      // Utwórz Image element z pliku
      const img = new Image();
      img.src = preview || '';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Skanuj kod kreskowy z obrazu
      const result = await codeReader.decodeFromImageElement(img);
      
      if (result) {
        const barcode = result.getText();
        setScannedBarcode(barcode);
        
        // Pobierz produkt z Open Food Facts
        const product = await getProductByBarcode.mutateAsync({ barcode });
        
        if (product) {
          toast.success('Product found!');
          if (onProductFound) {
            onProductFound(product);
          }
        } else {
          toast.error(`Product with barcode ${barcode} not found`);
        }
      } else {
        toast.error('No barcode found in the image');
      }
    } catch (error: any) {
      console.error('Error scanning barcode:', error);
      
      // Obsługa różnych typów błędów
      if (error.data?.code === 'TIMEOUT' || error.message?.includes('timeout') || error.message?.includes('408')) {
        toast.error('Request timed out. OpenFoodFacts API is slow. Please try again.');
      } else if (error.data?.code === 'NOT_FOUND') {
        toast.error(`Product with barcode ${scannedBarcode || 'unknown'} not found in OpenFoodFacts database.`);
      } else {
        toast.error(error.message || 'Failed to scan barcode. Please try again.');
      }
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setScannedBarcode('');
    setScanning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary">Scan Barcode</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {!preview ? (
        <div className="border-2 border-dashed border-input rounded-xl p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="barcode-image-input"
          />
          <label
            htmlFor="barcode-image-input"
            className="cursor-pointer flex flex-col items-center space-y-4"
          >
            <span className="text-4xl">📷</span>
            <div>
              <p className="text-primary font-semibold">Click to upload image</p>
              <p className="text-muted text-sm mt-1">
                or drag and drop an image with a barcode
              </p>
            </div>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={preview}
              alt="Barcode preview"
              className="w-full max-w-md mx-auto rounded-xl border-2 border-input"
            />
            {scannedBarcode && (
              <div className="mt-2 text-center">
                <p className="text-sm text-muted">Scanned barcode:</p>
                <p className="text-lg font-mono font-semibold text-primary">
                  {scannedBarcode}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleScan}
              disabled={scanning || !selectedFile}
              className="flex-1 bg-gradient-to-r from-fridge-primary to-fridge-secondary text-white py-2.5 px-6 rounded-xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fridge-primary disabled:opacity-50 transition-all font-semibold"
            >
              {scanning ? '⏳ Scanning...' : '🔍 Scan Barcode'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-fridge-light dark:bg-gray-700 text-primary rounded-xl hover:bg-fridge-cold dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fridge-primary transition-all font-semibold"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

