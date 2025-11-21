import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { prisma } from '@fridge/database';
import { supabaseAdmin } from './supabase';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // Extract token from header
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  let userId: string | null = null;
  let userEmail: string | null = null;

  // Verify token with Supabase
  if (token) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error) {
        console.error('Supabase auth error:', error.message);
      } else if (user) {
        userId = user.id;
        userEmail = user.email || null;
        
        // Ensure user exists in our database
        if (userId) {
          try {
            await prisma.user.upsert({
              where: { id: userId },
              create: {
                id: userId,
                email: userEmail || '',
                name: user.user_metadata?.name || null,
                language: 'en', // Default language
              },
              update: {
                email: userEmail || '',
                // Only update name if it's not already set in our DB, or if user_metadata has a name
                name: user.user_metadata?.name || undefined,
                // Don't update language on every request, only email/name
              },
            });
          } catch (dbError) {
            console.error('Database upsert error:', dbError);
          }
        }
      }
    } catch (error) {
      // Token invalid or expired
      console.error('Auth error:', error);
    }
  } else {
    console.log('No token provided in request');
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

