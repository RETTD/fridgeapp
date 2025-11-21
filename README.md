# Fridge App 🧊

Aplikacja do zarządzania produktami w lodówce, która pomaga śledzić daty ważności i redukować marnowanie żywności.

## 🏗️ Architektura

Projekt jest monorepo zbudowany z:
- **Web Frontend** (Next.js 14) - `apps/web`
- **Mobile Frontend** (Expo/React Native) - `apps/mobile`
- **API Backend** (Express + tRPC) - `apps/api`
- **Shared Packages**:
  - `packages/api` - tRPC router i logika biznesowa
  - `packages/database` - Prisma schema i klient
  - `packages/typescript-config` - Wspólna konfiguracja TypeScript

## 📋 Wymagania

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Supabase** konto (darmowe)
- **PostgreSQL** (dostarczane przez Supabase)

## 🚀 Instalacja

### 1. Sklonuj repozytorium

```bash
git clone git@github.com:RETTD/fridgeapp.git
cd fridge
```

### 2. Zainstaluj zależności

```bash
pnpm install
```

### 3. Skonfiguruj Supabase

1. Utwórz projekt na [supabase.com](https://supabase.com)
2. Przejdź do **Settings** → **API** i skopiuj:
   - `Project URL`
   - `anon public` key
3. Przejdź do **Settings** → **Database** i skopiuj connection string:
   - Użyj **Connection Pooling** (port 6543) dla `DATABASE_URL`
   - Użyj **Direct Connection** (port 5432) dla `DIRECT_URL`

### 4. Utwórz plik `.env` w głównym katalogu

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Database URLs
# Connection Pooling (dla aplikacji)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres?pgbouncer=true"
# Direct Connection (dla migracji Prisma)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

**⚠️ Ważne:** Zastąp `[PASSWORD]` i `[PROJECT_REF]` rzeczywistymi wartościami z Supabase Dashboard.

### 5. Utwórz plik `apps/web/.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 6. Skonfiguruj Mobile (`apps/mobile/app.json`)

Zaktualizuj sekcję `extra` w `apps/mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "your_supabase_project_url",
      "supabaseAnonKey": "your_supabase_anon_key",
      "apiUrl": "http://localhost:3001"
    }
  }
}
```

### 7. Wygeneruj Prisma Client

```bash
pnpm db:generate
```

### 8. Zastosuj schemat bazy danych

```bash
pnpm db:push
```

## 🏃 Uruchomienie

### Uruchom wszystkie aplikacje jednocześnie

```bash
pnpm dev
```

### Uruchom tylko wybrane aplikacje

```bash
# Tylko web
pnpm dev:web

# Tylko API
pnpm dev:api

# Tylko mobile
pnpm dev:mobile
```

### Porty

- **Web Frontend**: http://localhost:3000
- **API Backend**: http://localhost:3001
- **Mobile**: Expo Dev Tools (domyślnie port 8081)

## 📦 Dostępne komendy

### Development

```bash
pnpm dev              # Uruchom wszystkie aplikacje
pnpm dev:web          # Tylko web frontend
pnpm dev:api          # Tylko API backend
pnpm dev:mobile       # Tylko mobile app
```

### Database

```bash
pnpm db:push          # Zastosuj zmiany schematu do bazy danych
pnpm db:migrate       # Utwórz migrację Prisma
pnpm db:studio        # Otwórz Prisma Studio (GUI dla bazy danych)
pnpm db:generate      # Wygeneruj Prisma Client
```

### Build

```bash
pnpm build            # Zbuduj wszystkie aplikacje
```

## 🗄️ Struktura bazy danych

Projekt używa Prisma ORM z następującymi modelami:

- **User** - Użytkownicy (synchronizowani z Supabase Auth)
- **Product** - Produkty w lodówce
- **Notification** - Powiadomienia o wygasających produktach

## 🔐 Autentykacja

Aplikacja używa Supabase Auth do autentykacji użytkowników. Tokeny są weryfikowane przez backend API przy każdym żądaniu tRPC.

## 📱 Mobile Development

Aby uruchomić aplikację mobilną:

```bash
cd apps/mobile
pnpm dev
```

Następnie:
- Naciśnij `i` dla iOS simulator
- Naciśnij `a` dla Android emulator
- Zeskanuj kod QR dla Expo Go na telefonie

## 🛠️ Troubleshooting

### Problem: "Missing Supabase environment variables"

**Rozwiązanie:** Upewnij się, że wszystkie zmienne środowiskowe są ustawione w `.env` i `apps/web/.env.local`.

### Problem: "Can't reach database server"

**Rozwiązanie:** 
- Sprawdź czy używasz poprawnego `DIRECT_URL` dla migracji
- Upewnij się, że hasło w connection string jest URL-encoded
- Sprawdź czy IP jest dodany do whitelist w Supabase Dashboard

### Problem: "Module not found"

**Rozwiązanie:** 
```bash
pnpm install
pnpm db:generate
```

## 📝 Dodatkowe informacje

- Projekt używa **Turborepo** do zarządzania monorepo
- **tRPC** zapewnia type-safe API między frontendem a backendem
- **Prisma** jest używany jako ORM dla PostgreSQL
- **Tailwind CSS** jest używany do stylowania web frontendu

## 📄 Licencja

Private project

