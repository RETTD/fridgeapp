# Konfiguracja DATABASE_URL dla Supabase

## 🔗 Z czym się łączymy?

**Supabase** - zdalna baza danych PostgreSQL w chmurze, nie lokalna baza.

## 📝 Jak skonfigurować DATABASE_URL:

### Opcja 1: Connection string z pgbouncer (dla aplikacji)
```
postgresql://postgres:TWOJE_HASLO@db.qaxqjwwuflauyskrdaie.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

### Opcja 2: Direct connection (dla migracji Prisma - czasami działa lepiej)
```
postgresql://postgres:TWOJE_HASLO@db.qaxqjwwuflauyskrdaie.supabase.co:5432/postgres
```

## 🔑 Gdzie znaleźć hasło bazy danych?

1. Przejdź do Supabase Dashboard: https://supabase.com/dashboard/project/qaxqjwwuflauyskrdaie
2. **Settings** → **Database**
3. W sekcji **Database password** możesz:
   - Zobaczyć hasło (jeśli je pamiętasz)
   - Zresetować hasło (jeśli zapomniałeś)

## ⚠️ Ważne:

1. **Zastąp `[PASSWORD]` lub `TWOJE_HASLO`** rzeczywistym hasłem bazy danych
2. **Nie używaj cudzysłowów** wokół hasła w connection stringu
3. Jeśli `pnpm db:push` nie działa z pgbouncer, spróbuj bez `?pgbouncer=true&connection_limit=1`

## 📋 Przykład poprawnego DATABASE_URL:

```env
DATABASE_URL="postgresql://postgres:moje_haslo_123@db.qaxqjwwuflauyskrdaie.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

Lub bez pgbouncer (dla migracji):
```env
DATABASE_URL="postgresql://postgres:moje_haslo_123@db.qaxqjwwuflauyskrdaie.supabase.co:5432/postgres"
```

## 🧪 Test połączenia:

Po skonfigurowaniu możesz przetestować:
```bash
pnpm db:push
```

Jeśli nadal nie działa, spróbuj:
1. Usunąć `?pgbouncer=true&connection_limit=1` z connection stringa
2. Sprawdzić czy hasło jest poprawne
3. Sprawdzić czy projekt Supabase jest w pełni utworzony


