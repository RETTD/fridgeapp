# Troubleshooting - Problem z połączeniem do Supabase

## Problem: P1001 - Can't reach database server

### Możliwe przyczyny:

1. **Projekt Supabase nie jest w pełni utworzony**
   - Poczekaj kilka minut po utworzeniu projektu
   - Sprawdź w Dashboard czy status projektu to "Active"

2. **Nieprawidłowy connection string**
   - Użyj connection stringa bezpośrednio z Supabase Dashboard
   - Settings → Database → Connection string → URI
   - Skopiuj dokładnie jak jest w Dashboard

3. **Hasło zawiera znaki specjalne**
   - Hasło `ATDM4771ret!!` zawiera `!` które mogą wymagać URL encoding
   - Spróbuj użyć connection stringa bezpośrednio z Dashboard (Supabase automatycznie koduje)

4. **Port lub format connection stringa**
   - Supabase używa portu **5432** dla bezpośredniego połączenia
   - Port **6543** jest dla connection pooler (pgbouncer)
   - Dla migracji Prisma użyj portu **5432** bez pgbouncer

## ✅ Rozwiązanie krok po kroku:

### Krok 1: Skopiuj connection string z Supabase Dashboard

1. Przejdź do: https://supabase.com/dashboard/project/qaxqjwwuflauyskrdaie/settings/database
2. Znajdź sekcję **Connection string**
3. Wybierz **URI** (nie Session mode)
4. Skopiuj connection string - będzie wyglądał jak:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
   LUB
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.qaxqjwwuflauyskrdaie.supabase.co:5432/postgres
   ```

### Krok 2: Zastąp [YOUR-PASSWORD] hasłem

- Jeśli connection string ma `[YOUR-PASSWORD]`, zastąp to hasłem: `ATDM4771ret!!`
- Supabase może automatycznie kodować znaki specjalne w connection stringu z Dashboard

### Krok 3: Zaktualizuj .env

```env
DATABASE_URL="postgresql://postgres:ATDM4771ret!!@db.qaxqjwwuflauyskrdaie.supabase.co:5432/postgres"
```

### Krok 4: Spróbuj ponownie

```bash
pnpm db:push
```

## 🔍 Sprawdź czy baza jest dostępna:

Możesz przetestować połączenie używając `psql` (jeśli masz zainstalowany):

```bash
psql "postgresql://postgres:ATDM4771ret!!@db.qaxqjwwuflauyskrdaie.supabase.co:5432/postgres"
```

Jeśli to działa, problem jest z Prisma/connection stringiem.
Jeśli nie działa, problem jest z dostępem do bazy danych.

## 📝 Alternatywne rozwiązanie:

Jeśli nadal nie działa, możesz użyć Supabase SQL Editor do ręcznego utworzenia tabel zgodnie z Prisma schema.


