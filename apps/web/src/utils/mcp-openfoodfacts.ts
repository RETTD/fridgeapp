import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface OpenFoodFactsProduct {
  name: string;
  brand?: string; // Marka produktu
  manufacturer?: string; // Nazwa firmy/producenta
  barcode?: string;
  image?: string;
  ingredients?: string;
  allergens?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugars?: number;
    salt?: number;
    servingSize?: string; // Rozmiar porcji (np. "100ml", "100g")
    servingQuantity?: string; // Ilość porcji
    [key: string]: any;
  };
  labels?: string[];
  categories?: string[];
  [key: string]: any;
}

let mcpClient: Client | null = null;
let mcpTransport: StdioClientTransport | null = null;

/**
 * Inicjalizuje klienta MCP Open Food Facts
 * Wymaga, aby MCP Open Food Facts był zbudowany i dostępny pod ścieżką MCP_OPENFOODFACTS_PATH
 */
async function getMCPClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  // Sprawdź czy ścieżka do MCP Open Food Facts jest ustawiona
  const mcpPath = process.env.MCP_OPENFOODFACTS_PATH;
  if (!mcpPath) {
    throw new Error(
      'MCP_OPENFOODFACTS_PATH environment variable is not set. ' +
      'Please set it to the path of the built OpenFoodFacts-MCP project (e.g., /path/to/OpenFoodFacts-MCP/build/index.js)'
    );
  }

  // Sprawdź czy Node.js jest dostępny
  const nodePath = process.env.MCP_NODE_PATH || process.execPath;

  // Utwórz transport stdio (transport sam zarządza procesem)
  mcpTransport = new StdioClientTransport({
    command: nodePath,
    args: [mcpPath],
    env: process.env as Record<string, string>,
  });

  // Utwórz klienta MCP
  mcpClient = new Client(
    {
      name: 'fridge-app',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  // Połącz klienta z transportem
  await mcpTransport.connect();
  await mcpClient.connect(mcpTransport);

  return mcpClient;
}

/**
 * Pobiera produkt z Open Food Facts po kodzie kreskowym
 * @param barcode Kod kreskowy produktu (EAN/UPC)
 * @returns Informacje o produkcie lub null jeśli nie znaleziono
 */
export async function getProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    console.log('getProductByBarcode called with barcode:', barcode);
    console.log('MCP_OPENFOODFACTS_PATH:', process.env.MCP_OPENFOODFACTS_PATH);
    
    const client = await getMCPClient();
    console.log('MCP client connected successfully');
    
    // Sprawdź dostępne narzędzia (do debugowania)
    let availableTools: any[] = [];
    try {
      const toolsResponse = await client.listTools();
      availableTools = toolsResponse.tools || [];
      console.log('Available MCP Open Food Facts tools:', availableTools.map(t => t.name));
    } catch (error) {
      console.warn('Could not list MCP tools:', error);
    }
    
    // Próbuj różne możliwe nazwy narzędzi
    const possibleToolNames = [
      'get_product_by_barcode',
      'getProductByBarcode',
      'search_by_barcode',
      'barcode_lookup',
      'get_product',
      'lookup_product',
      'product_by_barcode',
    ];
    
    // Jeśli mamy listę dostępnych narzędzi, użyj tylko tych, które istnieją
    const toolNamesToTry = availableTools.length > 0
      ? possibleToolNames.filter(name => 
          availableTools.some(tool => 
            tool.name === name || 
            tool.name.toLowerCase() === name.toLowerCase()
          )
        )
      : possibleToolNames;
    
    // Jeśli nie znaleziono żadnego pasującego narzędzia, użyj wszystkich możliwych
    const finalToolNames = toolNamesToTry.length > 0 ? toolNamesToTry : possibleToolNames;
    
    let result = null;
    let lastError = null;
    
    for (const toolName of finalToolNames) {
      try {
        result = await client.callTool({
          name: toolName,
          arguments: {
            barcode,
          },
        });
        console.log(`Successfully used MCP tool: ${toolName}`);
        break; // Jeśli się udało, przerwij pętlę
      } catch (error: any) {
        lastError = error;
        console.log(`Failed to use MCP tool ${toolName}:`, error.message);
        // Kontynuuj próbę następnego narzędzia
        continue;
      }
    }
    
    if (!result) {
      const errorMessage = availableTools.length > 0
        ? `No matching tool found. Available tools: ${availableTools.map(t => t.name).join(', ')}. Tried: ${finalToolNames.join(', ')}`
        : `No tool found for barcode lookup. Tried: ${finalToolNames.join(', ')}`;
      throw lastError || new Error(errorMessage);
    }

    // Przetwórz wynik
    if (result.content && result.content.length > 0) {
      const item = result.content[0];
      let productData: any;
      
      if (item.type === 'text') {
        try {
          productData = JSON.parse(item.text);
        } catch {
          // Jeśli nie jest JSON, spróbuj użyć tekstu jako obiektu
          productData = { raw: item.text };
        }
      } else {
        productData = item;
      }
      
      // Normalizuj dane produktu
      return normalizeProductData(productData);
    }

    return null;
  } catch (error) {
    console.error('Error getting product by barcode from MCP Open Food Facts:', error);
    throw error;
  }
}

/**
 * Wyszukuje produkty w bazie Open Food Facts po nazwie
 * @param query Nazwa produktu do wyszukania
 * @param limit Maksymalna liczba wyników (domyślnie 10)
 * @returns Lista produktów
 */
export async function searchProductsByName(
  query: string,
  limit: number = 10
): Promise<OpenFoodFactsProduct[]> {
  try {
    const client = await getMCPClient();
    
    // Próbuj różne możliwe nazwy narzędzi
    const possibleToolNames = [
      'search_product_by_name',
      'searchProductByName',
      'search_by_name',
      'search_products',
      'search',
    ];
    
    let result = null;
    let lastError = null;
    
    for (const toolName of possibleToolNames) {
      try {
        result = await client.callTool({
          name: toolName,
          arguments: {
            query,
            limit,
          },
        });
        break;
      } catch (error: any) {
        lastError = error;
        continue;
      }
    }
    
    if (!result) {
      throw lastError || new Error(`No tool found for product search. Tried: ${possibleToolNames.join(', ')}`);
    }

    if (result.content && Array.isArray(result.content)) {
      return result.content
        .map((item: any) => {
          if (item.type === 'text') {
            try {
              const data = JSON.parse(item.text);
              return normalizeProductData(data);
            } catch {
              return null;
            }
          }
          return normalizeProductData(item);
        })
        .filter(Boolean) as OpenFoodFactsProduct[];
    }

    return [];
  } catch (error) {
    console.error('Error searching products by name from MCP Open Food Facts:', error);
    throw error;
  }
}

/**
 * Normalizuje dane produktu z różnych formatów do jednolitego interfejsu
 */
function normalizeProductData(data: any): OpenFoodFactsProduct {
  // Obsługa różnych formatów danych z Open Food Facts
  const product = data.product || data;
  
  return {
    name: product.product_name || product.name || product.product_name_en || '',
    brand: product.brands || product.brand,
    manufacturer: product.manufacturers || product.manufacturer || product.manufacturing_places_tags?.[0] || product.manufacturing_places,
    barcode: product.code || product.barcode || product.ean,
    image: product.image_url || product.image,
    ingredients: product.ingredients_text || product.ingredients,
    allergens: product.allergens || product.allergens_tags?.join(', '),
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
      ...product.nutriments,
    },
    labels: product.labels_tags || product.labels || [],
    categories: product.categories_tags || product.categories || [],
    ...product,
  };
}

/**
 * Zamyka połączenie z MCP Open Food Facts
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClient) {
    try {
      await mcpClient.close();
    } catch (error) {
      console.error('Error closing MCP Open Food Facts client:', error);
    }
    mcpClient = null;
  }

  if (mcpTransport) {
    try {
      await mcpTransport.close();
    } catch (error) {
      console.error('Error closing MCP Open Food Facts transport:', error);
    }
    mcpTransport = null;
  }
}

