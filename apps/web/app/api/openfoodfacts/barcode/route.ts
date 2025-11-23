import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProductByBarcode } from '@/utils/mcp-openfoodfacts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Fallback: Pobiera produkt z Open Food Facts REST API
 */
async function fetchProductFromRESTAPI(barcode: string) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    
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
        calories: product.nutriments?.['energy-kcal_100g'] || product.nutriments?.['energy-kcal_100ml'] || product.nutriments?.['energy-kcal'],
        protein: product.nutriments?.proteins_100g || product.nutriments?.proteins_100ml || product.nutriments?.proteins,
        carbs: product.nutriments?.carbohydrates_100g || product.nutriments?.carbohydrates_100ml || product.nutriments?.carbohydrates,
        fat: product.nutriments?.fat_100g || product.nutriments?.fat_100ml || product.nutriments?.fat,
        fiber: product.nutriments?.fiber_100g || product.nutriments?.fiber_100ml || product.nutriments?.fiber,
        sugars: product.nutriments?.sugars_100g || product.nutriments?.sugars_100ml || product.nutriments?.sugars,
        salt: product.nutriments?.salt_100g || product.nutriments?.salt_100ml || product.nutriments?.salt,
        servingSize: product.serving_size || 
          (product.nutriments?.['energy-kcal_100ml'] ? '100ml' : 
           product.nutriments?.['energy-kcal_100g'] ? '100g' : undefined),
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

    // Sprawdź czy MCP Open Food Facts jest skonfigurowany
    const mcpPath = process.env.MCP_OPENFOODFACTS_PATH;
    const useMCP = !!mcpPath;
    
    console.log('MCP Open Food Facts config check:');
    console.log('- MCP_OPENFOODFACTS_PATH:', mcpPath || 'NOT SET');
    console.log('- useMCP:', useMCP);
    
    let product = null;
    
    if (useMCP) {
      // Pobierz produkt z MCP Open Food Facts
      try {
        console.log('Attempting to fetch product from MCP Open Food Facts...');
        product = await getProductByBarcode(barcode);
        console.log('MCP returned product:', !!product);
      } catch (mcpError: any) {
        console.error('MCP Open Food Facts error:', mcpError);
        console.error('Error message:', mcpError.message);
        console.error('Error stack:', mcpError.stack);
        
        // Sprawdź czy to błąd konfiguracji MCP
        if (mcpError.message?.includes('MCP_OPENFOODFACTS_PATH')) {
          return NextResponse.json(
            { 
              error: 'MCP Open Food Facts is not configured',
              details: mcpError.message
            },
            { status: 500 }
          );
        }
        
        // Jeśli MCP nie działa, fallback do REST API
        console.log('MCP failed, falling back to REST API');
        product = await fetchProductFromRESTAPI(barcode);
      }
    } else {
      // Użyj REST API bezpośrednio
      console.log('MCP not configured, using REST API');
      product = await fetchProductFromRESTAPI(barcode);
    }

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

