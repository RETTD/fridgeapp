# Debugowanie problemu z API

## Problem: "data is undefined" po rejestracji

### Sprawdź:

1. **Czy API server działa:**
   ```bash
   curl http://localhost:3001/health
   ```
   Powinno zwrócić: `{"status":"ok",...}`

2. **Czy token jest przekazywany:**
   - Otwórz DevTools w przeglądarce (F12)
   - Przejdź do zakładki Network
   - Odśwież stronę dashboard
   - Znajdź request do `/trpc/products.list`
   - Sprawdź Headers → Request Headers → `authorization`
   - Powinno być: `Bearer eyJhbGci...`

3. **Sprawdź odpowiedź API:**
   - W DevTools → Network → kliknij na request `/trpc/products.list`
   - Sprawdź Response - co zwraca API?

### Możliwe przyczyny:

1. **Token nie jest przekazywany:**
   - Sprawdź czy `supabase.auth.getSession()` zwraca session
   - Może trzeba odświeżyć stronę po rejestracji

2. **API zwraca błąd autoryzacji:**
   - Sprawdź logi API server w terminalu
   - Może token jest nieprawidłowy

3. **Query zwraca undefined:**
   - Sprawdź czy `products.list` zwraca pustą tablicę `[]` czy `undefined`

### Rozwiązanie:

Jeśli problem nadal występuje, sprawdź:
- Czy API server jest uruchomiony (`pnpm dev:api`)
- Czy port 3001 jest dostępny
- Czy w `.env.local` jest `NEXT_PUBLIC_API_URL=http://localhost:3001/trpc`

