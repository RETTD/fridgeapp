# Fridge App z Supabase

Aplikacja do zarządzania produktami w lodówce zbudowana jako monorepo z użyciem Supabase jako bazy danych i autentykacji.

## Stack Technologiczny

- **Monorepo:** Turborepo + pnpm
- **Web:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Mobile:** Expo (React Native) + TypeScript
- **Backend:** Express + tRPC
- **Database:** Supabase (PostgreSQL) + Prisma ORM
- **Auth:** Supabase Auth

## Struktura Projektu

```
fridge-app-supabase/
├── apps/
│   ├── api/          # Express + tRPC server
│   ├── web/          # Next.js web app
│   └── mobile/       # Expo mobile app
├── packages/
│   ├── api/          # tRPC routers i logika API
│   ├── database/     # Prisma schema i client
│   └── typescript-config/  # Shared TypeScript config
└── package.json      # Root workspace config
```

## Setup

### 1. Zainstaluj zależności

```bash
pnpm install
```

### 2. Skonfiguruj Supabase

1. Utwórz projekt na https://supabase.com
2. Pobierz dane z Dashboard:
   - Project URL
   - anon public key
   - service_role key
   - Database connection string

### 3. Utwórz plik `.env` w root

Skopiuj `.env.example` do `.env` i wypełnij wartościami z Supabase:

```bash
cp .env.example .env
```

### 4. Utwórz plik `.env.local` dla web

W `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:3001/trpc
```

### 5. Zaktualizuj `app.json` dla mobile

W `apps/mobile/app.json`, zaktualizuj wartości w `extra`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://xxxxx.supabase.co",
      "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "apiUrl": "http://localhost:3001/trpc"
    }
  }
}
```

### 6. Wygeneruj Prisma Client

```bash
pnpm db:generate
```

### 7. Push schema do bazy danych

```bash
pnpm db:push
```

## Uruchamianie

### Wszystkie aplikacje jednocześnie

```bash
pnpm dev
```

### Osobno

**API Server:**
```bash
pnpm dev:api
```

**Web App:**
```bash
pnpm dev:web
```

**Mobile App:**
```bash
cd apps/mobile
pnpm dev
```

## Dostęp

- **API:** http://localhost:3001
- **Web:** http://localhost:3000
- **Mobile:** Zeskanuj QR kod z Expo

## Skrypty

- `pnpm dev` - Uruchom wszystkie aplikacje
- `pnpm dev:api` - Uruchom tylko API
- `pnpm dev:web` - Uruchom tylko web
- `pnpm build` - Zbuduj wszystkie aplikacje
- `pnpm db:push` - Push Prisma schema do bazy
- `pnpm db:migrate` - Utwórz migrację
- `pnpm db:studio` - Otwórz Prisma Studio
- `pnpm db:generate` - Wygeneruj Prisma Client

## Funkcjonalności

- ✅ Rejestracja i logowanie (Supabase Auth)
- ✅ Dodawanie produktów
- ✅ Lista produktów
- ✅ Usuwanie produktów
- ✅ Powiadomienia o produktach wygasających
- ✅ Synchronizacja między web a mobile

## Notatki

- Supabase Auth automatycznie tworzy użytkowników w `auth.users`
- Tabela `users` jest synchronizowana przez `context.ts` (upsert)
- Wszystkie produkty są powiązane z `userId` z Supabase Auth
- Token jest automatycznie odświeżany przez Supabase SDK

