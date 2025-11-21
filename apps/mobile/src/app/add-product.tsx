import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { trpc } from '@/utils/trpc';

export default function AddProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  // Obsłuż dane ze skanera
  useEffect(() => {
    if (params.scannedProduct) {
      try {
        const product = JSON.parse(params.scannedProduct as string);
        setScannedProduct(product);
        setName(product.name || '');
      } catch (error) {
        console.error('Error parsing scanned product:', error);
      }
    }
  }, [params.scannedProduct]);

  const utils = trpc.useUtils();
  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Product added successfully!');
      utils.products.list.invalidate();
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSubmit = () => {
    if (!name || !expiryDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const quantityNum = parseInt(quantity) || 1;
    if (quantityNum < 1) {
      Alert.alert('Error', 'Quantity must be at least 1');
      return;
    }

    createMutation.mutate({
      name,
      expiryDate: new Date(expiryDate).toISOString(),
      quantity: quantityNum,
      category: category || undefined,
      location: location || undefined,
    });
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {scannedProduct && (
            <View style={styles.scannedProductInfo}>
              {scannedProduct.image && (
                <Image
                  source={{ uri: scannedProduct.image }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              )}
              {scannedProduct.brand && (
                <Text style={styles.brandText}>{scannedProduct.brand}</Text>
              )}
              {scannedProduct.nutrition && (
                <View style={styles.nutritionInfo}>
                  {scannedProduct.nutrition.calories && (
                    <Text style={styles.nutritionText}>
                      Calories: {scannedProduct.nutrition.calories} kcal
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={styles.scanButtonContainer}>
            <Pressable
              style={styles.scanButton}
              onPress={() => router.push('/scan-barcode')}
            >
              <Text style={styles.scanButtonText}>📷 Scan Barcode</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter product name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Expiry Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={expiryDate}
            onChangeText={setExpiryDate}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 2024-12-31)</Text>

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., dairy, meat, vegetables"
            value={category}
            onChangeText={setCategory}
          />

          <Text style={styles.label}>Location</Text>
          <View style={styles.locationButtons}>
            <Pressable
              style={[styles.locationButton, location === 'fridge' && styles.locationButtonActive]}
              onPress={() => setLocation(location === 'fridge' ? '' : 'fridge')}
            >
              <Text style={[styles.locationButtonText, location === 'fridge' && styles.locationButtonTextActive]}>
                Fridge
              </Text>
            </Pressable>
            <Pressable
              style={[styles.locationButton, location === 'freezer' && styles.locationButtonActive]}
              onPress={() => setLocation(location === 'freezer' ? '' : 'freezer')}
            >
              <Text style={[styles.locationButtonText, location === 'freezer' && styles.locationButtonTextActive]}>
                Freezer
              </Text>
            </Pressable>
            <Pressable
              style={[styles.locationButton, location === 'pantry' && styles.locationButtonActive]}
              onPress={() => setLocation(location === 'pantry' ? '' : 'pantry')}
            >
              <Text style={[styles.locationButtonText, location === 'pantry' && styles.locationButtonTextActive]}>
                Pantry
              </Text>
            </Pressable>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.submitButton, createMutation.isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={createMutation.isLoading}
            >
              <Text style={styles.submitButtonText}>
                {createMutation.isLoading ? 'Adding...' : 'Add Product'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    color: '#6366f1',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  locationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  locationButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#333',
  },
  locationButtonTextActive: {
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e5e5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  scannedProductInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  productImage: {
    width: 150,
    height: 150,
    marginBottom: 12,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  nutritionInfo: {
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  nutritionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scanButtonContainer: {
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

