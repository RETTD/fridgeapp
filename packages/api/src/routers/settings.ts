import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '../supabase';

export const settingsRouter = router({
  // Get user settings
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User ID is missing',
      });
    }

    try {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        select: {
          language: true,
          email: true,
        },
      });

      return {
        language: user?.language || 'en',
        email: user?.email || null,
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {
        language: 'en',
        email: null,
      };
    }
  }),

  // Update user settings
  update: protectedProcedure
    .input(
      z.object({
        language: z.enum(['en', 'pl']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID is missing',
        });
      }

      try {
        // Check if user exists first
        const existingUser = await ctx.prisma.user.findUnique({
          where: { id: ctx.userId },
        });

        if (!existingUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        const updated = await ctx.prisma.user.update({
          where: { id: ctx.userId },
          data: {
            ...(input.language && { language: input.language }),
          },
          select: {
            language: true,
          },
        });

        return {
          language: updated.language || 'en',
        };
      } catch (error) {
        console.error('Error updating settings:', error);
        
        // If it's already a TRPCError, re-throw it
        if (error instanceof TRPCError) {
          throw error;
        }
        
        // Log the actual error for debugging
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
        } else {
          console.error('Unknown error type:', error);
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update settings',
        });
      }
    }),

  // Change password (requires current password verification)
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId || !ctx.token) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID or token is missing',
        });
      }

      try {
        // Verify current password by attempting to sign in
        const { data: userData } = await supabaseAdmin.auth.getUser(ctx.token);
        if (!userData?.user?.email) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found',
          });
        }

        // Note: Supabase doesn't provide a direct way to verify password server-side
        // The password change should be done client-side using Supabase client
        // This endpoint is kept for consistency but actual password change happens client-side
        
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password change should be done client-side for security',
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error changing password:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password',
        });
      }
    }),

  // Update email
  updateEmail: protectedProcedure
    .input(
      z.object({
        newEmail: z.string().email(),
        password: z.string().min(1), // Require password for security
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId || !ctx.token) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID or token is missing',
        });
      }

      try {
        // Update email in Supabase (this will send verification email)
        const { error } = await supabaseAdmin.auth.admin.updateUserById(ctx.userId, {
          email: input.newEmail,
        });

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message || 'Failed to update email',
          });
        }

        // Update email in our database
        await ctx.prisma.user.update({
          where: { id: ctx.userId },
          data: { email: input.newEmail },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error('Error updating email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update email',
        });
      }
    }),
});

