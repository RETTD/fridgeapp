import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  })).describe('Lista składników potrzebnych do przepisu'),
  steps: z.array(z.string()).describe('Kroki przygotowania przepisu'),
  cookingTime: z.string().describe('Czas przygotowania (np. "30 minut", "1 godzina")'),
  servings: z.number().describe('Liczba porcji'),
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

    // Przygotuj prompt dla AI
    const productsList = productNames.join(', ');
    const prompt = `Jesteś asystentem kulinarnym. Tworzysz przepisy z podanych składników. Składniki: ${productsList}.
Wymagania: 
- użyj wszystkich podanych produktów, 
- możesz dodać podstawowe składniki (przyprawy, oleje, jajka, makaron itp.),
- Nie rozbudowuj przepisu bez potrzeby — jeśli z podanych produktów można zrobić proste danie, zaproponuj właśnie taką prostą formę.
- generuj: opis, listę składników z ilościami, kroki przygotowania, typ dania,
- odpowiedzi po polsku.`;

    // Generuj przepis używając AI SDK
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: recipeSchema,
      prompt,
    });

    return NextResponse.json({ recipe: object });
  } catch (error) {
    console.error('Error generating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to generate recipe', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

