import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const productsRouter = router({
  // List all user's products
  list: protectedProcedure
    .input(
      z
        .object({
          sortBy: z.enum(['expiryDate', 'createdAt', 'name', 'brand']).optional(),
          filter: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      // Upewnij się że userId istnieje
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID is missing',
        });
      }

      try {
        const products = await ctx.prisma.product.findMany({
          where: {
            userId: ctx.userId,
            OR: input?.filter
              ? [
                  {
                    name: {
                      contains: input.filter,
                      mode: 'insensitive',
                    },
                  },
                  {
                    brand: {
                      contains: input.filter,
                      mode: 'insensitive',
                    },
                  },
                ]
              : undefined,
          },
          include: {
            category: true, // Include category relation
          },
          orderBy: {
            [input?.sortBy || 'expiryDate']: 'asc',
          },
        });
        
        // ZAWSZE zwracaj tablicę - nawet jeśli null/undefined
        if (!products || !Array.isArray(products)) {
          return [];
        }
        return products;
      } catch (error) {
        console.error('Error fetching products:', error);
        // W przypadku błędu bazy danych, zwróć pustą tablicę
        return [];
      }
    }),

  // Get single product
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findFirst({
        where: {
          id: input.id,
          userId: ctx.userId!,
        },
        include: {
          category: true, // Include category relation
        },
      });

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      return product;
    }),

  // Get product by barcode (from user's database)
  getByBarcodeInDb: protectedProcedure
    .input(z.object({ barcode: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findFirst({
        where: {
          barcode: input.barcode,
          userId: ctx.userId!,
        },
        include: {
          category: true,
        },
      });

      return product; // Zwraca null jeśli nie znaleziono
    }),

  // Create product
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        barcode: z.string().optional(), // Kod kreskowy z OpenFoodFacts
        brand: z.string().optional(), // Marka produktu
        manufacturer: z.string().optional(), // Nazwa firmy/producenta
        expiryDate: z.string().datetime(),
        quantity: z.number().positive().default(1),
        categoryId: z.string().optional(), // Zmienione z category (string) na categoryId
        location: z.string().optional(),
        notes: z.string().optional(),
        // Dane z OpenFoodFacts
        ingredients: z.string().optional(),
        allergens: z.string().optional(),
        nutritionData: z.record(z.any()).optional(), // JSON z wartościami odżywczymi
        labels: z.array(z.string()).optional(), // Etykiety (np. "Bio", "Vegan")
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Jeśli categoryId jest podane, sprawdź czy kategoria należy do użytkownika
      if (input.categoryId) {
        const category = await ctx.prisma.category.findFirst({
          where: {
            id: input.categoryId,
            userId: ctx.userId!,
          },
        });

        if (!category) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Category not found or does not belong to user',
          });
        }
      }

      // Jeśli barcode jest podane, sprawdź czy użytkownik już nie ma produktu z tym kodem
      if (input.barcode) {
        const existingProduct = await ctx.prisma.product.findFirst({
          where: {
            userId: ctx.userId!,
            barcode: input.barcode,
          },
        });

        if (existingProduct) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Product with this barcode already exists',
          });
        }
      }

      return ctx.prisma.product.create({
        data: {
          name: input.name,
          barcode: input.barcode,
          brand: input.brand,
          manufacturer: input.manufacturer as any,
          expiryDate: new Date(input.expiryDate),
          quantity: input.quantity,
          categoryId: input.categoryId,
          location: input.location,
          notes: input.notes,
          ingredients: input.ingredients,
          allergens: input.allergens,
          nutritionData: input.nutritionData,
          labels: input.labels || [],
          userId: ctx.userId!,
        },
      });
    }),

  // Update product
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        barcode: z.string().optional(),
        brand: z.string().optional(),
        manufacturer: z.string().optional(),
        expiryDate: z.string().datetime().optional(),
        quantity: z.number().positive().optional(),
        categoryId: z.string().optional(), // Zmienione z category na categoryId
        location: z.string().optional(),
        notes: z.string().optional(),
        ingredients: z.string().optional(),
        allergens: z.string().optional(),
        nutritionData: z.record(z.any()).optional(),
        labels: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, categoryId, barcode, ...data } = input;

      // Verify ownership
      const existing = await ctx.prisma.product.findFirst({
        where: { id, userId: ctx.userId! },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      // Jeśli categoryId jest podane, sprawdź czy kategoria należy do użytkownika
      if (categoryId) {
        const category = await ctx.prisma.category.findFirst({
          where: {
            id: categoryId,
            userId: ctx.userId!,
          },
        });

        if (!category) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Category not found or does not belong to user',
          });
        }
      }

      // Jeśli barcode jest podane i zmienione, sprawdź czy inny produkt nie ma tego kodu
      if (barcode && existing.barcode !== barcode) {
        const existingProduct = await ctx.prisma.product.findFirst({
          where: {
            userId: ctx.userId!,
            barcode: barcode,
            id: { not: id }, // Wyklucz aktualny produkt
          },
        });

        if (existingProduct) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Product with this barcode already exists',
          });
        }
      }

      return ctx.prisma.product.update({
        where: { id },
        data: {
          ...data,
          barcode: barcode !== undefined ? barcode : undefined,
          categoryId: categoryId !== undefined ? categoryId : undefined,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        },
      });
    }),

  // Delete product
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.product.findFirst({
        where: { id: input.id, userId: ctx.userId! },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      return ctx.prisma.product.delete({
        where: { id: input.id },
      });
    }),

  // Get expiring soon products
  expiringSoon: protectedProcedure
    .input(
      z
        .object({
          days: z.number().positive().default(3),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const days = input?.days || 3;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const products = await ctx.prisma.product.findMany({
        where: {
          userId: ctx.userId!,
          expiryDate: {
            lte: futureDate,
            gte: new Date(),
          },
        },
        orderBy: {
          expiryDate: 'asc',
        },
      });
      // ZAWSZE zwracaj tablicę - nawet jeśli null/undefined
      if (!products || !Array.isArray(products)) {
        return [];
      }
      return products;
    }),

  // Get statistics
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User ID is missing',
      });
    }

    try {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Przeterminowane produkty
      const expiredCount = await ctx.prisma.product.count({
        where: {
          userId: ctx.userId,
          expiryDate: {
            lt: now,
          },
        },
      });

      // Produkty wygasające w ciągu 3 dni
      const expiringSoonCount = await ctx.prisma.product.count({
        where: {
          userId: ctx.userId,
          expiryDate: {
            gte: now,
            lte: threeDaysFromNow,
          },
        },
      });

      // Produkty zmarnowane w ostatnim miesiącu (przeterminowane i usunięte)
      // Uwaga: to jest przybliżenie - liczymy przeterminowane produkty z ostatniego miesiąca
      // W przyszłości można dodać pole deletedAt do Product
      const wastedCount = await ctx.prisma.product.count({
        where: {
          userId: ctx.userId,
          expiryDate: {
            lt: now,
            gte: oneMonthAgo,
          },
        },
      });

      return {
        expired: expiredCount,
        expiringSoon: expiringSoonCount,
        wastedLastMonth: wastedCount,
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        expired: 0,
        expiringSoon: 0,
        wastedLastMonth: 0,
      };
    }
  }),

  // Get product by barcode from Open Food Facts
  getByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Wywołaj REST API Open Food Facts bezpośrednio (prostsze i bardziej niezawodne)
      try {
        const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(input.barcode)}.json`;
        console.log(`Fetching product from Open Food Facts REST API: ${url}`);
        
        // Dodaj timeout (10 sekund)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        let response: Response;
        try {
          response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new TRPCError({
              code: 'TIMEOUT',
              message: 'Request to Open Food Facts API timed out',
            });
          }
          throw fetchError;
        }

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to fetch product from Open Food Facts (HTTP ${response.status})`,
          });
        }

        const data = await response.json() as { status: number; product?: any };
        
        if (data.status !== 1 || !data.product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found in Open Food Facts',
          });
        }

        const product = data.product;
        
        // Normalizuj dane do tego samego formatu co MCP
        const normalizedProduct = {
          name: product.product_name || product.product_name_en || '',
          brand: product.brands || '',
          manufacturer: product.manufacturers || product.manufacturer || product.manufacturing_places_tags?.[0] || product.manufacturing_places || '',
          barcode: product.code || input.barcode,
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

        console.log('Product fetched successfully:', !!normalizedProduct.name);
        return normalizedProduct;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error('Error fetching product by barcode:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch product from Open Food Facts: ${errorMessage}`,
          cause: error,
        });
      }
    }),
});

