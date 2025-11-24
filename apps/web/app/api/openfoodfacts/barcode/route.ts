import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Fallback: Pobiera produkt z Open Food Facts REST API
 */
async function fetchProductFromRESTAPI(barcode: string) {
  try {
    // Dodaj timeout (10 sekund) - jeśli nie odpowiada, zwróć null
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    let response: Response;
    try {
      response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
        {
          headers: {
            'User-Agent': 'FridgeApp/1.0 (https://github.com/yourusername/fridge)',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('OpenFoodFacts API request timed out - returning null');
        return null;
      }
      throw fetchError;
    }
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.status !== 1 || !data.product) {
      return null;
    }
    
    const product = data.product;
    
    // Normalizuj dane do tego samego formatu co MCP
    return {
      name: product.product_name || product.product_name_en || '',
      brand: product.brands || '',
      manufacturer: product.manufacturers || product.manufacturer || product.manufacturing_places_tags?.[0] || product.manufacturing_places || '',
      barcode: product.code || barcode,
      image: product.image_url || '',
      ingredients: product.ingredients_text || '',
      allergens: product.allergens || '',
      nutrition: {
        // Użyj wartości dla porcji (_serving) jeśli istnieją, w przeciwnym razie wartości na 100g/100ml
        calories: product.nutriments?.['energy-kcal_serving'] ?? 
                 product.nutriments?.['energy-kcal_100g'] ?? 
                 product.nutriments?.['energy-kcal_100ml'] ?? 
                 product.nutriments?.['energy-kcal'],
        protein: product.nutriments?.proteins_serving ?? 
                product.nutriments?.proteins_100g ?? 
                product.nutriments?.proteins_100ml ?? 
                product.nutriments?.proteins,
        carbs: product.nutriments?.carbohydrates_serving ?? 
              product.nutriments?.carbohydrates_100g ?? 
              product.nutriments?.carbohydrates_100ml ?? 
              product.nutriments?.carbohydrates,
        fat: product.nutriments?.fat_serving ?? 
            product.nutriments?.fat_100g ?? 
            product.nutriments?.fat_100ml ?? 
            product.nutriments?.fat,
        fiber: product.nutriments?.fiber_serving ?? 
              product.nutriments?.fiber_100g ?? 
              product.nutriments?.fiber_100ml ?? 
              product.nutriments?.fiber,
        sugars: product.nutriments?.sugars_serving ?? 
               product.nutriments?.sugars_100g ?? 
               product.nutriments?.sugars_100ml ?? 
               product.nutriments?.sugars,
        salt: product.nutriments?.salt_serving ?? 
             product.nutriments?.salt_100g ?? 
             product.nutriments?.salt_100ml ?? 
             product.nutriments?.salt,
        servingSize: (product.nutriments?.['energy-kcal_serving'] !== undefined && product.serving_size) 
          ? product.serving_size
          : (product.serving_size || 
            (product.nutriments?.['energy-kcal_100ml'] !== undefined ? '100ml' : 
             product.nutriments?.['energy-kcal_100g'] !== undefined ? '100g' : undefined)),
        servingQuantity: product.serving_quantity,
      },
      labels: product.labels_tags || [],
      categories: product.categories_tags || [],
    };
  } catch (error) {
    console.error('Error fetching from REST API:', error);
    return null;
  }
}

/**
 * API route do pobierania produktu z Open Food Facts po kodzie kreskowym
 * GET /api/openfoodfacts/barcode?barcode=1234567890
 */
export async function GET(request: NextRequest) {
  try {
    // Pobierz token z nagłówka
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Zweryfikuj użytkownika
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Pobierz kod kreskowy z query params
    const searchParams = request.nextUrl.searchParams;
    const barcode = searchParams.get('barcode');

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode parameter is required' },
        { status: 400 }
      );
    }

    // Użyj REST API bezpośrednio (MCP może powodować timeouty)
    console.log('Fetching product from OpenFoodFacts REST API');
    const product = await fetchProductFromRESTAPI(barcode);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch product',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

