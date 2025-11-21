import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const categoriesRouter = router({
  // List all user's categories
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User ID is missing',
      });
    }

    try {
      const categories = await ctx.prisma.category.findMany({
        where: {
          userId: ctx.userId,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }),

  // Create new category
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        color: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID is missing',
        });
      }

      // Sprawdź czy kategoria o tej nazwie już istnieje dla użytkownika
      const existing = await ctx.prisma.category.findFirst({
        where: {
          userId: ctx.userId,
          name: {
            equals: input.name.trim(),
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Category with this name already exists',
        });
      }

      return ctx.prisma.category.create({
        data: {
          name: input.name.trim(),
          color: input.color,
          icon: input.icon,
          userId: ctx.userId,
        },
      });
    }),

  // Delete category
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID is missing',
        });
      }

      // Verify ownership
      const existing = await ctx.prisma.category.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      return ctx.prisma.category.delete({
        where: { id: input.id },
      });
    }),
});

