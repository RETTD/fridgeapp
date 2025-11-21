import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { trpc } from '@/utils/trpc';

export default function ScanBarcodeScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const getProductByBarcode = trpc.products.getByBarcode.useMutation();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: BarCodeScannerResult) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // Pobierz produkt z Open Food Facts przez tRPC
      const product = await getProductByBarcode.mutateAsync({ barcode: data });
      
      if (product) {
        // Przekaż dane produktu do ekranu dodawania produktu
        router.push({
          pathname: '/add-product',
          params: {
            scannedProduct: JSON.stringify({
              name: product.name || '',
              brand: product.brand || '',
              image: product.image || '',
              nutrition: product.nutrition || {},
            }),
          },
        });
      } else {
        Alert.alert(
          'Product Not Found',
          `Product with barcode ${data} was not found in Open Food Facts database.`,
          [
            {
              text: 'Try Again',
              onPress: () => setScanned(false),
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to fetch product information. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.message}>No access to camera</Text>
          <Text style={styles.subMessage}>
            Please grant camera permission to scan barcodes
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Scan Barcode</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
          barCodeTypes={[
            BarCodeScanner.Constants.BarCodeType.ean13,
            BarCodeScanner.Constants.BarCodeType.ean8,
            BarCodeScanner.Constants.BarCodeType.upcA,
            BarCodeScanner.Constants.BarCodeType.upcE,
            BarCodeScanner.Constants.BarCodeType.code128,
            BarCodeScanner.Constants.BarCodeType.code39,
          ]}
        />
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Looking up product...</Text>
          </View>
        )}

        {!scanned && !loading && (
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>
              Position the barcode within the frame
            </Text>
          </View>
        )}
      </View>

        {scanned && !loading && (
        <View style={styles.actions}>
          <Pressable
            style={styles.button}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.buttonText}>Scan Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50, // Safe area for status bar
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  actions: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

