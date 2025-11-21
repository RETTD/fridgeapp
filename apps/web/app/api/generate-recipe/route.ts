import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNutritionInfoForProducts } from '@/utils/mcp-opennutrition';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const recipeSchema = z.object({
  name: z.string().describe('Nazwa przepisu'),
  description: z.string().describe('Krótki opis przepisu'),
  ingredients: z.array(z.object({
    name: z.string().describe('Nazwa składnika'),
    amount: z.string().describe('Ilość składnika (np. "2 szklanki", "500g")'),
    calories: z.number().optional().describe('Kalorie dla tego składnika (jeśli dostępne)'),
  })).describe('Lista składników potrzebnych do przepisu'),
  steps: z.array(z.string()).describe('Kroki przygotowania przepisu'),
  cookingTime: z.string().describe('Czas przygotowania (np. "30 minut", "1 godzina")'),
  servings: z.number().describe('Liczba porcji'),
  totalCalories: z.number().optional().describe('Całkowita liczba kalorii dla całego przepisu'),
  caloriesPerServing: z.number().optional().describe('Liczba kalorii na porcję'),
  tips: z.string().optional().describe('Dodatkowe wskazówki dotyczące przepisu'),
});

export async function POST(request: NextRequest) {
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

    // Pobierz dane z request body
    const body = await request.json();
    const { productIds, productNames } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      );
    }

    if (!productNames || !Array.isArray(productNames) || productNames.length === 0) {
      return NextResponse.json(
        { error: 'Product names are required' },
        { status: 400 }
      );
    }

    // Sprawdź czy OpenAI API key jest skonfigurowany
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Pobierz informacje o wartościach odżywczych z MCP OpenNutrition
    let nutritionInfo = new Map<string, any>();
    let nutritionContext = '';
    
    try {
      if (process.env.MCP_OPENNUTRITION_PATH) {
        nutritionInfo = await getNutritionInfoForProducts(productNames);
        
        // Przygotuj kontekst o wartościach odżywczych dla AI
        if (nutritionInfo.size > 0) {
          const nutritionDetails: string[] = [];
          nutritionInfo.forEach((info, productName) => {
            const details: string[] = [];
            if (info.calories !== undefined) details.push(`${info.calories} kcal`);
            if (info.protein !== undefined) details.push(`białko: ${info.protein}g`);
            if (info.carbs !== undefined) details.push(`węglowodany: ${info.carbs}g`);
            if (info.fat !== undefined) details.push(`tłuszcz: ${info.fat}g`);
            
            if (details.length > 0) {
              nutritionDetails.push(`${productName}: ${details.join(', ')}`);
            }
          });
          
          if (nutritionDetails.length > 0) {
            nutritionContext = `\n\nInformacje o wartościach odżywczych produktów:\n${nutritionDetails.join('\n')}\n\nUżyj tych informacji, aby obliczyć całkowitą liczbę kalorii dla przepisu oraz kalorie na porcję.`;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching nutrition info from MCP OpenNutrition:', error);
      // Kontynuuj bez informacji o wartościach odżywczych, jeśli MCP nie jest dostępny
    }

    // Przygotuj prompt dla AI
    const productsList = productNames.join(', ');
    const prompt = `Jesteś asystentem kulinarnym. Tworzysz przepisy z podanych składników. Składniki: ${productsList}.${nutritionContext}
Wymagania: 
- użyj wszystkich podanych produktów, 
- możesz dodać podstawowe składniki (przyprawy, oleje, jajka, makaron itp.),
- Nie rozbudowuj przepisu bez potrzeby — jeśli z podanych produktów można zrobić proste danie, zaproponuj właśnie taką prostą formę.
- generuj: opis, listę składników z ilościami, kroki przygotowania, typ dania,
- jeśli masz informacje o wartościach odżywczych, oblicz całkowitą liczbę kalorii dla przepisu oraz kalorie na porcję,
- dla każdego składnika, jeśli dostępne, dodaj informację o kaloriach,
- odpowiedzi po polsku.`;

    // Generuj przepis używając AI SDK
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: recipeSchema,
      prompt,
    });

    // Wzbogać odpowiedź o informacje o wartościach odżywczych, jeśli są dostępne
    if (nutritionInfo.size > 0 && object.ingredients) {
      object.ingredients = object.ingredients.map((ingredient: any) => {
        const nutrition = nutritionInfo.get(ingredient.name);
        if (nutrition && nutrition.calories !== undefined) {
          return {
            ...ingredient,
            calories: nutrition.calories,
          };
        }
        return ingredient;
      });
    }

    return NextResponse.json({ recipe: object });
  } catch (error) {
    console.error('Error generating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to generate recipe', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

