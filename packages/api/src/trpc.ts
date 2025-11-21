import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

// Auth middleware
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED', 
      message: 'Not authenticated. Please log in.' 
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // TypeScript knows this is not null now
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);

