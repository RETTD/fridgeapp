import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { prisma } from '@fridge/database';
import { supabaseAdmin } from './supabase';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // Extract token from header
  const token = req.headers.authorization?.replace('Bearer ', '');

  let userId: string | null = null;
  let userEmail: string | null = null;

  // Verify token with Supabase
  if (token) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
        userEmail = user.email || null;
        
        // Ensure user exists in our database
        if (userId) {
          await prisma.user.upsert({
            where: { id: userId },
            create: {
              id: userId,
              email: userEmail || '',
              name: user.user_metadata?.name || null,
            },
            update: {
              email: userEmail || '',
              name: user.user_metadata?.name || null,
            },
          });
        }
      }
    } catch (error) {
      // Token invalid or expired
      console.error('Auth error:', error);
    }
  }

  return {
    req,
    res,
    prisma,
    token,
    userId,
    userEmail,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

