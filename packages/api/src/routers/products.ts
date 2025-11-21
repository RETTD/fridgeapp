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
      const products = await ctx.prisma.product.findMany({
        where: {
          userId: ctx.userId!,
          name: input?.filter
            ? {
                contains: input.filter,
                mode: 'insensitive',
              }
            : undefined,
        },
        orderBy: {
          [input?.sortBy || 'expiryDate']: 'asc',
        },
      });
      // Zawsze zwracaj tablicę, nawet jeśli pusta
      return products || [];
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
        category: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.product.create({
        data: {
          name: input.name,
          expiryDate: new Date(input.expiryDate),
          quantity: input.quantity,
          category: input.category,
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
        category: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

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

      return ctx.prisma.product.update({
        where: { id },
        data: {
          ...data,
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
      // Zawsze zwracaj tablicę, nawet jeśli pusta
      return products || [];
    }),
});

