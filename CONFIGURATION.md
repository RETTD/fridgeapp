# Konfiguracja Supabase - Instrukcje

## ✅ Co zostało skonfigurowane:

1. ✅ **SUPABASE_URL** - https://qaxqjwwuflauyskrdaie.supabase.co
2. ✅ **SUPABASE_ANON_KEY** - skonfigurowany w:
   - `.env` (root)
   - `apps/web/.env.local`
   - `apps/mobile/app.json`

## ⚠️ Co jeszcze trzeba skonfigurować:

### 1. DATABASE_URL (Connection String)

1. W Supabase Dashboard → **Settings** → **Database**
2. Znajdź sekcję **Connection string**
3. Wybierz **URI** (nie Session mode)
4. Skopiuj connection string (będzie wyglądał jak: `postgresql://postgres:[PASSWORD]@db.qaxqjwwuflauyskrdaie.supabase.co:5432/postgres`)
5. **WAŻNE:** Dodaj na końcu: `?pgbouncer=true&connection_limit=1`
6. Zastąp `[PASSWORD]` hasłem bazy danych (to samo hasło które ustawiłeś przy tworzeniu projektu)
7. Zaktualizuj plik `.env` w root:
   ```env
   DATABASE_URL="postgresql://postgres:TWOJE_HASLO@db.qaxqjwwuflauyskrdaie.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
   ```

## 🚀 Po skonfigurowaniu:

1. **Push Prisma schema do bazy danych:**
   ```bash
   pnpm db:push
   ```

2. **Uruchom aplikacje:**
   ```bash
   # Terminal 1 - API
   pnpm dev:api
   
   # Terminal 2 - Web
   pnpm dev:web
   
   # Terminal 3 - Mobile
   cd apps/mobile && pnpm dev
   ```

## 📝 Gdzie znaleźć dane w Supabase Dashboard:

- **Project URL:** Settings → API → Project URL ✅ (już skonfigurowany)
- **anon public key:** Settings → API → Project API keys → anon public ✅ (już skonfigurowany)
- **Database password:** To hasło które ustawiłeś przy tworzeniu projektu (jeśli zapomniałeś, możesz je zresetować w Settings → Database)
- **Connection string:** Settings → Database → Connection string → URI

## ✅ Checklist:

- [x] SUPABASE_URL skonfigurowany
- [x] SUPABASE_ANON_KEY skonfigurowany
- [ ] DATABASE_URL - wymagany z Dashboard (z hasłem bazy danych)
- [ ] `pnpm db:push` - po skonfigurowaniu DATABASE_URL

