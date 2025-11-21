import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

interface NutritionInfo {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  [key: string]: any;
}

let mcpClient: Client | null = null;
let mcpTransport: StdioClientTransport | null = null;

/**
 * Inicjalizuje klienta MCP OpenNutrition
 * Wymaga, aby MCP OpenNutrition był zbudowany i dostępny pod ścieżką MCP_OPENNUTRITION_PATH
 */
async function getMCPClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  // Sprawdź czy ścieżka do MCP OpenNutrition jest ustawiona
  const mcpPath = process.env.MCP_OPENNUTRITION_PATH;
  if (!mcpPath) {
    throw new Error(
      'MCP_OPENNUTRITION_PATH environment variable is not set. ' +
      'Please set it to the path of the built mcp-opennutrition project (e.g., /path/to/mcp-opennutrition/build/index.js)'
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
 * Wyszukuje produkty w bazie OpenNutrition po nazwie
 * Używa narzędzia MCP do wyszukiwania produktów spożywczych
 */
export async function searchFoods(query: string): Promise<NutritionInfo[]> {
  try {
    const client = await getMCPClient();
    
    // Wywołaj narzędzie MCP do wyszukiwania produktów
    // Możliwe nazwy narzędzi: 'search_food_by_name', 'searchFoodByName', 'search_by_name'
    // Jeśli wystąpi błąd, sprawdź dostępne narzędzia używając: client.listTools()
    const result = await client.callTool({
      name: 'search_food_by_name',
      arguments: {
        query,
        limit: 10,
      },
    });

    if (result.content && Array.isArray(result.content)) {
      return result.content.map((item: any) => {
        if (item.type === 'text') {
          try {
            const data = JSON.parse(item.text);
            return data;
          } catch {
            return null;
          }
        }
        return item;
      }).filter(Boolean);
    }

    return [];
  } catch (error) {
    console.error('Error searching foods:', error);
    throw error;
  }
}

/**
 * Pobiera szczegółowe informacje o produkcie po ID
 */
export async function getFoodById(foodId: string): Promise<NutritionInfo | null> {
  try {
    const client = await getMCPClient();
    
    const result = await client.callTool({
      name: 'get_food_by_id',
      arguments: {
        id: foodId,
      },
    });

    if (result.content && result.content.length > 0) {
      const item = result.content[0];
      if (item.type === 'text') {
        try {
          return JSON.parse(item.text);
        } catch {
          return null;
        }
      }
      return item as NutritionInfo;
    }

    return null;
  } catch (error) {
    console.error('Error getting food by ID:', error);
    throw error;
  }
}

/**
 * Pobiera informacje o kaloriach dla listy produktów
 * Próbuje dopasować nazwy produktów do bazy OpenNutrition
 */
export async function getNutritionInfoForProducts(
  productNames: string[]
): Promise<Map<string, NutritionInfo>> {
  const nutritionMap = new Map<string, NutritionInfo>();

  for (const productName of productNames) {
    try {
      // Wyszukaj produkt w bazie
      const results = await searchFoods(productName);
      
      if (results.length > 0) {
        // Weź pierwszy wynik (najlepsze dopasowanie)
        const bestMatch = results[0];
        nutritionMap.set(productName, bestMatch);
      }
    } catch (error) {
      console.error(`Error getting nutrition info for ${productName}:`, error);
      // Kontynuuj z następnym produktem, nawet jeśli ten się nie powiódł
    }
  }

  return nutritionMap;
}

/**
 * Zamyka połączenie z MCP OpenNutrition
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClient) {
    try {
      await mcpClient.close();
    } catch (error) {
      console.error('Error closing MCP client:', error);
    }
    mcpClient = null;
  }

  if (mcpTransport) {
    try {
      await mcpTransport.close();
    } catch (error) {
      console.error('Error closing MCP transport:', error);
    }
    mcpTransport = null;
  }
}

