import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const productsRouter = router({
  // List all user's products
  list: protectedProcedure
    .input(
      z
        .object({
          sortBy: z.enum(['expiryDate', 'createdAt', 'name']).optional(),
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
            name: input?.filter
              ? {
                  contains: input.filter,
                  mode: 'insensitive',
                }
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
      });

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      return product;
    }),

  // Create product
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        expiryDate: z.string().datetime(),
        quantity: z.number().positive().default(1),
        categoryId: z.string().optional(), // Zmienione z category (string) na categoryId
        location: z.string().optional(),
        notes: z.string().optional(),
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

      return ctx.prisma.product.create({
        data: {
          name: input.name,
          expiryDate: new Date(input.expiryDate),
          quantity: input.quantity,
          categoryId: input.categoryId,
          location: input.location,
          notes: input.notes,
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
        expiryDate: z.string().datetime().optional(),
        quantity: z.number().positive().optional(),
        categoryId: z.string().optional(), // Zmienione z category na categoryId
        location: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, categoryId, ...data } = input;

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

      return ctx.prisma.product.update({
        where: { id },
        data: {
          ...data,
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
});

