# 🤖 Instrukcja dla Agenta AI: Fridge App z Supabase

> **Cel:** Stworzenie pełnej kopii projektu Fridge App z Supabase jako bazą danych i autentykacją
> 
> **Stack:** Monorepo (Turborepo + pnpm) | Next.js (Web) | Expo (Mobile) | Express + tRPC (API) | Supabase (DB + Auth) | Prisma (ORM)

---

## 📋 Spis Treści

1. [Krok 1: Setup Projektu](#krok-1-setup-projektu)
2. [Krok 2: Setup Supabase](#krok-2-setup-supabase)
3. [Krok 3: Konfiguracja Bazy Danych](#krok-3-konfiguracja-bazy-danych)
4. [Krok 4: Backend API](#krok-4-backend-api)
5. [Krok 5: Frontend Web](#krok-5-frontend-web)
6. [Krok 6: Frontend Mobile](#krok-6-frontend-mobile)
7. [Krok 7: Testowanie](#krok-7-testowanie)

---

## Krok 1: Setup Projektu

### 1.1. Utwórz strukturę monorepo

```bash
mkdir fridge-app-supabase
cd fridge-app-supabase
```

### 1.2. Utwórz pliki konfiguracyjne root

**`package.json`** (root):
```json
{
  "name": "fridge-app-supabase",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:mobile": "turbo run dev --filter=mobile",
    "dev:api": "turbo run dev --filter=api",
    "build": "turbo run build",
    "db:push": "pnpm --filter=database db:push",
    "db:migrate": "pnpm --filter=database db:migrate",
    "db:studio": "pnpm --filter=database db:studio",
    "db:generate": "pnpm --filter=database generate"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "prettier": "^3.1.0",
    "turbo": "^1.11.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

**`pnpm-workspace.yaml`**:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**`turbo.json`**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "db:push": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:studio": {
      "cache": false
    },
    "generate": {
      "cache": false
    }
  }
}
```

**`.gitignore`**:
```
node_modules
.next
.expo
dist
build
.env
.env.local
*.log
.DS_Store
```

### 1.3. Zainstaluj zależności root

```bash
pnpm install
```

---

## Krok 2: Setup Supabase

### 2.1. Utwórz projekt Supabase

1. Przejdź na https://supabase.com
2. Zaloguj się / Utwórz konto
3. Kliknij "New Project"
4. Wypełnij:
   - **Name:** `fridge-app`
   - **Database Password:** (zapisz to hasło!)
   - **Region:** wybierz najbliższą
5. Kliknij "Create new project"
6. Poczekaj na utworzenie projektu (~2 minuty)

### 2.2. Pobierz dane projektu

1. W Supabase Dashboard → Settings → API
2. Zapisz:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (NIE UDOSTĘPNIAJ TEGO!)

3. W Supabase Dashboard → Settings → Database
4. Znajdź **Connection string** → **URI**
5. Skopiuj connection string (będzie wyglądał jak: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

### 2.3. Utwórz plik `.env` (root)

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (Supabase PostgreSQL)
# Użyj connection string z Supabase Dashboard, ale dodaj ?pgbouncer=true&connection_limit=1 na końcu
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# API
API_PORT=3001
NODE_ENV=development
```

**UWAGA:** Zamień `[PASSWORD]` na hasło bazy danych z kroku 2.1.

---

## Krok 3: Konfiguracja Bazy Danych

### 3.1. Utwórz package `packages/database`

```bash
mkdir -p packages/database/prisma
mkdir -p packages/database/src
```

**`packages/database/package.json`**:
```json
{
  "name": "@fridge/database",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "scripts": {
    "db:push": "dotenv -e ../../.env -- prisma db push",
    "db:migrate": "dotenv -e ../../.env -- prisma migrate dev",
    "db:studio": "dotenv -e ../../.env -- prisma studio",
    "generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.7.1"
  },
  "devDependencies": {
    "dotenv-cli": "^7.3.0",
    "prisma": "^5.7.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

**`packages/database/tsconfig.json`**:
```json
{
  "extends": "@fridge/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3.2. Utwórz Prisma Schema

**`packages/database/prisma/schema.prisma`**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Uwaga: Supabase używa własnej tabeli auth.users dla autentykacji
// Ta tabela User jest tylko dla dodatkowych danych profilu
model User {
  id            String    @id // To będzie Supabase user.id (UUID)
  email         String    @unique
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  products      Product[]
  notifications Notification[]
  
  @@map("users")
}

model Product {
  id              String    @id @default(cuid())
  name            String
  expiryDate      DateTime
  quantity        Int       @default(1)
  category        String?
  location        String?   // "fridge", "freezer", "pantry"
  imageUrl        String?
  notes           String?
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([userId])
  @@index([expiryDate])
  @@map("products")
}

model Notification {
  id              String    @id @default(cuid())
  type            String    // "email", "telegram", "discord", "push"
  message         String
  sent            Boolean   @default(false)
  scheduledFor    DateTime
  sentAt          DateTime?
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([scheduledFor])
  @@map("notifications")
}
```

### 3.3. Utwórz index dla Prisma Client

**`packages/database/src/index.ts`**:
```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export * from '@prisma/client';
```

### 3.4. Utwórz shared TypeScript config

**`packages/typescript-config/package.json`**:
```json
{
  "name": "@fridge/typescript-config",
  "version": "0.0.0",
  "private": true,
  "main": "base.json"
}
```

**`packages/typescript-config/base.json`**:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 3.5. Zainstaluj zależności i wygeneruj Prisma Client

```bash
pnpm install
cd packages/database
pnpm generate
cd ../..
```

### 3.6. Push schema do Supabase

```bash
pnpm db:push
```

**UWAGA:** Jeśli wystąpi błąd z connection string, sprawdź czy:
- Hasło jest poprawne
- Connection string zawiera `?pgbouncer=true&connection_limit=1`
- Projekt Supabase jest w pełni utworzony

---

## Krok 4: Backend API

### 4.1. Utwórz package `packages/api`

```bash
mkdir -p packages/api/src/routers
```

**`packages/api/package.json`**:
```json
{
  "name": "@fridge/api",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "dependencies": {
    "@trpc/server": "^10.45.2",
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.4",
    "@fridge/database": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

**`packages/api/tsconfig.json`**:
```json
{
  "extends": "@fridge/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.2. Utwórz Supabase Client dla backendu

**`packages/api/src/supabase.ts`**:
```typescript
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client dla backendu (ma pełne uprawnienia)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

### 4.3. Utwórz tRPC context

**`packages/api/src/context.ts`**:
```typescript
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
```

### 4.4. Utwórz tRPC setup

**`packages/api/src/trpc.ts`**:
```typescript
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
```

### 4.5. Utwórz Products Router

**`packages/api/src/routers/products.ts`**:
```typescript
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
      return ctx.prisma.product.findMany({
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
          ...input,
          expiryDate: new Date(input.expiryDate),
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

      return ctx.prisma.product.findMany({
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
    }),
});
```

### 4.6. Utwórz główny router

**`packages/api/src/index.ts`**:
```typescript
import { router } from './trpc';
import { productsRouter } from './routers/products';

export const appRouter = router({
  products: productsRouter,
});

export type AppRouter = typeof appRouter;

export * from './context';
export * from './trpc';
```

### 4.7. Utwórz Express server

**`apps/api/package.json`**:
```json
{
  "name": "api",
  "version": "0.1.0",
  "private": true,
  "main": "src/server.ts",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@trpc/server": "^10.45.2",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@fridge/api": "workspace:*"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

**`apps/api/tsconfig.json`**:
```json
{
  "extends": "@fridge/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**`apps/api/src/server.ts`**:
```typescript
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import dotenv from 'dotenv';
import { appRouter, createContext } from '@fridge/api';

// Load environment variables
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// tRPC endpoint
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`);
});
```

### 4.8. Zainstaluj zależności

```bash
pnpm install
```

---

## Krok 5: Frontend Web

### 5.1. Utwórz Next.js app

```bash
cd apps
npx create-next-app@latest web --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd web
```

**UWAGA:** Jeśli `create-next-app` pyta o opcje, wybierz:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Import alias: `@/*`

### 5.2. Zaktualizuj `apps/web/package.json`

```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@trpc/client": "^10.45.2",
    "@trpc/react-query": "^10.45.2",
    "@tanstack/react-query": "^4.36.1",
    "superjson": "^2.2.1",
    "react-hot-toast": "^2.4.1",
    "@supabase/supabase-js": "^2.39.0",
    "@fridge/api": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.0.4"
  }
}
```

### 5.3. Utwórz `.env.local` dla web

**`apps/web/.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:3001/trpc
```

### 5.4. Utwórz Supabase Client

**`apps/web/src/utils/supabase.ts`**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 5.5. Utwórz tRPC Client

**`apps/web/src/utils/trpc.ts`**:
```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@fridge/api';
import { supabase } from './supabase';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/trpc',
        async headers() {
          const { data: { session } } = await supabase.auth.getSession();
          return {
            authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
          };
        },
      }),
    ],
  });
}
```

### 5.6. Utwórz TRPCProvider

**`apps/web/src/components/TRPCProvider.tsx`**:
```typescript
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, getTRPCClient } from '@/utils/trpc';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000,
      },
    },
  }));

  const [trpcClient] = useState(() => getTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 5.7. Zaktualizuj Root Layout

**`apps/web/src/app/layout.tsx`**:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TRPCProvider } from '@/components/TRPCProvider'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fridge App',
  description: 'Manage your fridge products',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>{children}</TRPCProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
```

### 5.8. Utwórz stronę główną

**`apps/web/src/app/page.tsx`**:
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    </div>
  );
}
```

### 5.9. Utwórz stronę logowania

**`apps/web/src/app/auth/login/page.tsx`**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Welcome back! 👋');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/register"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 5.10. Utwórz stronę rejestracji

**`apps/web/src/app/auth/register/page.tsx`**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || undefined,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Account created! Please check your email to verify your account.');
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 5.11. Utwórz Dashboard

**`apps/web/src/app/dashboard/page.tsx`**:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/utils/trpc';
import { supabase } from '@/utils/supabase';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login');
      }
    });
  }, [router]);

  const { data: products, isLoading, error, refetch } = trpc.products.list.useQuery(
    undefined,
    { enabled: mounted }
  );

  const { data: expiring } = trpc.products.expiringSoon.useQuery(
    { days: 3 },
    { enabled: mounted }
  );

  const utils = trpc.useUtils();
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully!');
      utils.products.list.invalidate();
      utils.products.expiringSoon.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate({ id });
    }
  };

  if (!mounted) return null;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Fridge App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard/add"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Add Product
              </a>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {expiring && expiring.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              ⚠️ Expiring Soon ({expiring.length})
            </h2>
            <ul className="list-disc list-inside text-yellow-700">
              {expiring.map((product) => (
                <li key={product.id}>
                  {product.name} - expires {new Date(product.expiryDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No products yet.</p>
            <a
              href="/dashboard/add"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Add your first product
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-2">
                  Expires: {new Date(product.expiryDate).toLocaleDateString()}
                </p>
                {product.quantity > 1 && (
                  <p className="text-gray-600 text-sm mb-2">
                    Quantity: {product.quantity}
                  </p>
                )}
                <button
                  onClick={() => handleDelete(product.id)}
                  className="mt-4 text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

### 5.12. Utwórz stronę dodawania produktu

**`apps/web/src/app/dashboard/add/page.tsx`**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/utils/trpc';
import toast from 'react-hot-toast';

export default function AddProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  const utils = trpc.useUtils();
  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success('Product added successfully!');
      utils.products.list.invalidate();
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !expiryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    createMutation.mutate({
      name,
      expiryDate: new Date(expiryDate).toISOString(),
      quantity,
      category: category || undefined,
      location: location || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/dashboard" className="text-indigo-600 hover:text-indigo-500">
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Add Product</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Select location</option>
                <option value="fridge">Fridge</option>
                <option value="freezer">Freezer</option>
                <option value="pantry">Pantry</option>
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {createMutation.isLoading ? 'Adding...' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
```

### 5.13. Zainstaluj zależności

```bash
cd apps/web
pnpm install
cd ../..
```

---

## Krok 6: Frontend Mobile

### 6.1. Utwórz Expo app

```bash
cd apps
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
```

### 6.2. Zaktualizuj `apps/mobile/package.json`

```json
{
  "name": "mobile",
  "version": "0.1.0",
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "expo-router": "~3.4.0",
    "expo-constants": "~15.4.0",
    "expo-status-bar": "~1.11.0",
    "react": "18.2.0",
    "react-native": "0.73.2",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "@trpc/client": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@tanstack/react-query": "^5.17.9",
    "@supabase/supabase-js": "^2.39.0",
    "@fridge/api": "workspace:*"
  },
  "devDependencies": {
    "@babel/core": "^7.23.7",
    "@types/react": "~18.2.47",
    "typescript": "^5.3.0"
  }
}
```

### 6.3. Zaktualizuj `apps/mobile/app.json`

```json
{
  "expo": {
    "name": "Fridge App",
    "slug": "fridge-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "scheme": "fridge-app",
    "extra": {
      "supabaseUrl": "https://xxxxx.supabase.co",
      "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "apiUrl": "http://localhost:3001/trpc"
    }
  }
}
```

**UWAGA:** Zamień wartości w `extra` na swoje dane Supabase.

### 6.4. Utwórz Supabase Client

**`apps/mobile/src/utils/supabase.ts`**:
```typescript
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 6.5. Utwórz tRPC Client

**`apps/mobile/src/utils/trpc.ts`**:
```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import Constants from 'expo-constants';
import type { AppRouter } from '@fridge/api';
import { supabase } from './supabase';

export const trpc = createTRPCReact<AppRouter>();

const getApiUrl = () => {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl as string;
  if (apiUrl) return apiUrl;
  
  // Fallback dla developmentu
  if (__DEV__) {
    return 'http://localhost:3001/trpc';
  }
  
  throw new Error('API URL not configured');
};

export const createTRPCClient = () => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: getApiUrl(),
        async headers() {
          const { data: { session } } = await supabase.auth.getSession();
          return {
            authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
          };
        },
      }),
    ],
  });
};
```

### 6.6. Zaktualizuj Root Layout

**`apps/mobile/src/app/_layout.tsx`**:
```typescript
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClient } from '@/utils/trpc';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="products" />
          <Stack.Screen name="add-product" />
        </Stack>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 6.7. Utwórz ekrany (podobne do web, ale w React Native)

**`apps/mobile/src/app/index.tsx`**:
```typescript
import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/products');
      } else {
        router.replace('/login');
      }
    });
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16 }}>Loading...</Text>
    </View>
  );
}
```

**`apps/mobile/src/app/login.tsx`**:
```typescript
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    router.replace('/products');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Sign In</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </Pressable>
        
        <Pressable onPress={() => router.push('/register')}>
          <Text style={styles.link}>Don't have an account? Sign up</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    color: '#6366f1',
    fontSize: 14,
  },
});
```

**`apps/mobile/src/app/register.tsx`**:
```typescript
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || undefined,
        },
      },
    });

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    Alert.alert('Success', 'Account created! Please check your email to verify your account.');
    router.replace('/login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Sign Up</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Name (optional)"
          value={name}
          onChangeText={setName}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
        </Pressable>
        
        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    color: '#6366f1',
    fontSize: 14,
  },
});
```

**`apps/mobile/src/app/products.tsx`**:
```typescript
import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '@/utils/trpc';
import { supabase } from '@/utils/supabase';

export default function ProductsScreen() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      }
    });
  }, [router]);

  const { data: products, isLoading, error, refetch } = trpc.products.list.useQuery(
    undefined,
    { enabled: mounted }
  );

  const { data: expiring } = trpc.products.expiringSoon.useQuery(
    { days: 3 },
    { enabled: mounted }
  );

  const utils = trpc.useUtils();
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Product deleted successfully!');
      utils.products.list.invalidate();
      utils.products.expiringSoon.invalidate();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate({ id }),
        },
      ]
    );
  };

  if (!mounted) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <Pressable style={styles.button} onPress={() => refetch()}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Products</Text>
        <View style={styles.headerButtons}>
          <Pressable onPress={() => router.push('/add-product')}>
            <Text style={styles.headerButton}>Add</Text>
          </Pressable>
          <Pressable onPress={handleLogout}>
            <Text style={styles.headerButton}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {expiring && expiring.length > 0 && (
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>⚠️ Expiring Soon ({expiring.length})</Text>
          {expiring.slice(0, 3).map((product) => (
            <Text key={product.id} style={styles.warningText}>
              • {product.name} - {new Date(product.expiryDate).toLocaleDateString()}
            </Text>
          ))}
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : !products || products.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No products yet.</Text>
          <Pressable style={styles.button} onPress={() => router.push('/add-product')}>
            <Text style={styles.buttonText}>Add your first product</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDate}>
                  Expires: {new Date(item.expiryDate).toLocaleDateString()}
                </Text>
                {item.quantity > 1 && (
                  <Text style={styles.productQuantity}>Quantity: {item.quantity}</Text>
                )}
                {item.location && (
                  <Text style={styles.productLocation}>Location: {item.location}</Text>
                )}
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    color: '#6366f1',
    fontSize: 16,
  },
  warning: {
    backgroundColor: '#fef3c7',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#78350f',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  productCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  productLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
});
```

**`apps/mobile/src/app/add-product.tsx`**:
```typescript
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { trpc } from '@/utils/trpc';

export default function AddProductScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  const utils = trpc.useUtils();
  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Product added successfully!');
      utils.products.list.invalidate();
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSubmit = () => {
    if (!name || !expiryDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const quantityNum = parseInt(quantity) || 1;
    if (quantityNum < 1) {
      Alert.alert('Error', 'Quantity must be at least 1');
      return;
    }

    createMutation.mutate({
      name,
      expiryDate: new Date(expiryDate).toISOString(),
      quantity: quantityNum,
      category: category || undefined,
      location: location || undefined,
    });
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter product name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Expiry Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={expiryDate}
            onChangeText={setExpiryDate}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 2024-12-31)</Text>

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., dairy, meat, vegetables"
            value={category}
            onChangeText={setCategory}
          />

          <Text style={styles.label}>Location</Text>
          <View style={styles.locationButtons}>
            <Pressable
              style={[styles.locationButton, location === 'fridge' && styles.locationButtonActive]}
              onPress={() => setLocation(location === 'fridge' ? '' : 'fridge')}
            >
              <Text style={[styles.locationButtonText, location === 'fridge' && styles.locationButtonTextActive]}>
                Fridge
              </Text>
            </Pressable>
            <Pressable
              style={[styles.locationButton, location === 'freezer' && styles.locationButtonActive]}
              onPress={() => setLocation(location === 'freezer' ? '' : 'freezer')}
            >
              <Text style={[styles.locationButtonText, location === 'freezer' && styles.locationButtonTextActive]}>
                Freezer
              </Text>
            </Pressable>
            <Pressable
              style={[styles.locationButton, location === 'pantry' && styles.locationButtonActive]}
              onPress={() => setLocation(location === 'pantry' ? '' : 'pantry')}
            >
              <Text style={[styles.locationButtonText, location === 'pantry' && styles.locationButtonTextActive]}>
                Pantry
              </Text>
            </Pressable>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.submitButton, createMutation.isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={createMutation.isLoading}
            >
              <Text style={styles.submitButtonText}>
                {createMutation.isLoading ? 'Adding...' : 'Add Product'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    color: '#6366f1',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  locationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  locationButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#333',
  },
  locationButtonTextActive: {
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e5e5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
```

### 6.8. Zainstaluj zależności

```bash
cd apps/mobile
pnpm install
cd ../..
```

---

## Krok 7: Testowanie

### 7.1. Uruchom wszystkie aplikacje

**Terminal 1 (API):**
```bash
pnpm dev:api
```

**Terminal 2 (Web):**
```bash
pnpm dev:web
```

**Terminal 3 (Mobile):**
```bash
cd apps/mobile
pnpm dev
```

### 7.2. Testuj flow

1. **Web:**
   - Otwórz http://localhost:3000
   - Zarejestruj nowe konto
   - Zaloguj się
   - Dodaj produkt
   - Sprawdź listę produktów

2. **Mobile:**
   - Zeskanuj QR kod z Expo
   - Zaloguj się (użyj tego samego konta co w web)
   - Sprawdź czy produkty się synchronizują

### 7.3. Sprawdź Supabase Dashboard

1. Przejdź do Supabase Dashboard
2. Sprawdź tabelę `users` - powinny być utworzone rekordy
3. Sprawdź tabelę `products` - powinny być produkty
4. Sprawdź Authentication → Users - powinny być użytkownicy

---

## ✅ Checklist Finalny

- [ ] Projekt Supabase utworzony
- [ ] `.env` skonfigurowany z danymi Supabase
- [ ] Prisma schema utworzona i zpushowana
- [ ] Backend API działa (http://localhost:3001/health)
- [ ] Web app działa (http://localhost:3000)
- [ ] Mobile app działa (Expo)
- [ ] Rejestracja działa
- [ ] Logowanie działa
- [ ] Dodawanie produktów działa
- [ ] Lista produktów działa
- [ ] Usuwanie produktów działa
- [ ] Synchronizacja między web a mobile działa

---

## 🐛 Troubleshooting

### Problem: Błąd połączenia z bazą danych
**Rozwiązanie:** Sprawdź czy:
- Connection string jest poprawny
- Hasło bazy danych jest poprawne
- Projekt Supabase jest w pełni utworzony
- Connection string zawiera `?pgbouncer=true&connection_limit=1`

### Problem: Błąd autentykacji
**Rozwiązanie:** Sprawdź czy:
- `SUPABASE_URL` i `SUPABASE_ANON_KEY` są poprawne
- W web używasz `NEXT_PUBLIC_` prefix
- W mobile używasz `expo-constants` z `app.json`

### Problem: tRPC nie działa
**Rozwiązanie:** Sprawdź czy:
- API server działa (sprawdź http://localhost:3001/health)
- URL w tRPC client jest poprawny
- Token jest przekazywany w headers

---

## 📝 Notatki

- Supabase Auth automatycznie tworzy użytkowników w `auth.users`
- Nasza tabela `users` jest synchronizowana przez `context.ts` (upsert)
- Wszystkie produkty są powiązane z `userId` z Supabase Auth
- Token jest automatycznie odświeżany przez Supabase SDK

---

**Koniec instrukcji!** 🎉

