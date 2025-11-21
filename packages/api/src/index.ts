import { router } from './trpc';
import { productsRouter } from './routers/products';
import { categoriesRouter } from './routers/categories';
import { settingsRouter } from './routers/settings';

export const appRouter = router({
  products: productsRouter,
  categories: categoriesRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;

export * from './context';
export * from './trpc';

