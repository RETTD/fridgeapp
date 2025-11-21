# Konfiguracja Session Pooler dla Supabase

## ⚠️ Problem: Not IPv4 compatible

Supabase pokazuje ostrzeżenie że Direct connection (port 5432) nie jest kompatybilny z IPv4.

## ✅ Rozwiązanie: Użyj Session Pooler

### Krok 1: W Supabase Dashboard

1. Przejdź do: **Settings → Database → Connection string**
2. Zmień **Method** z "Direct connection" na **"Session mode"** (lub "Transaction mode")
3. Skopiuj connection string - będzie wyglądał jak:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
   LUB
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.qaxqjwwuflauyskrdaie.supabase.co:6543/postgres?pgbouncer=true
   ```

### Krok 2: Zaktualizuj .env

Zastąp `[YOUR-PASSWORD]` hasłem: `ATDM4771ret!!`

Przykład:
```env
DATABASE_URL="postgresql://postgres:ATDM4771ret!!@db.qaxqjwwuflauyskrdaie.supabase.co:6543/postgres?pgbouncer=true"
```

LUB jeśli używasz pooler.supabase.com:
```env
DATABASE_URL="postgresql://postgres.xxxxx:ATDM4771ret!!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

### Krok 3: Spróbuj ponownie

```bash
pnpm db:push
```

## 📝 Różnice:

- **Direct connection (port 5432):** Nie działa z IPv4
- **Session Pooler (port 6543):** Działa z IPv4 ✅

## 🔍 Gdzie znaleźć Session Pooler connection string:

1. Settings → Database → Connection string
2. Zmień **Method** na "Session mode"
3. Skopiuj connection string
4. Zastąp `[YOUR-PASSWORD]` hasłem


