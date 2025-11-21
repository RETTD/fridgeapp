import { router } from './trpc';
import { productsRouter } from './routers/products';

export const appRouter = router({
  products: productsRouter,
});

export type AppRouter = typeof appRouter;

export * from './context';
export * from './trpc';

