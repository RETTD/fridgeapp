# Instrukcja: Jak utworzyć przykładowego użytkownika

## Metoda 1: Przez aplikację web (najprostsza) ✅

1. **Uruchom aplikację web:**
   ```bash
   pnpm dev:web
   ```

2. **Otwórz przeglądarkę:**
   - Przejdź do: http://localhost:3000 (lub inny port jeśli 3000 jest zajęty)

3. **Zarejestruj nowego użytkownika:**
   - Aplikacja automatycznie przekieruje Cię do `/auth/register`
   - Wypełnij formularz:
     - **Name** (opcjonalne): np. "Jan Kowalski"
     - **Email**: np. "test@example.com"
     - **Password**: minimum 6 znaków, np. "test123"
   - Kliknij "Sign up"

4. **Weryfikacja email (jeśli włączona):**
   - Sprawdź email (lub w Supabase Dashboard możesz wyłączyć wymaganie weryfikacji)
   - Kliknij link weryfikacyjny w emailu

5. **Zaloguj się:**
   - Po weryfikacji (lub jeśli weryfikacja jest wyłączona), zaloguj się używając:
     - Email: `test@example.com`
     - Password: `test123`

## Metoda 2: Przez Supabase Dashboard

1. **Przejdź do Supabase Dashboard:**
   - https://supabase.com/dashboard/project/qaxqjwwuflauyskrdaie

2. **Otwórz sekcję Authentication:**
   - W menu bocznym kliknij **Authentication**
   - Następnie **Users**

3. **Dodaj użytkownika:**
   - Kliknij przycisk **"Add user"** lub **"Create new user"**
   - Wypełnij formularz:
     - **Email**: np. "admin@example.com"
     - **Password**: np. "admin123"
     - **Auto Confirm User**: ✅ (zaznacz, aby pominąć weryfikację email)
   - Kliknij **"Create user"**

4. **Użytkownik jest gotowy:**
   - Możesz od razu zalogować się w aplikacji używając tych danych

## Metoda 3: Przez SQL w Supabase Dashboard

1. **Przejdź do SQL Editor:**
   - W Supabase Dashboard kliknij **SQL Editor**

2. **Uruchom następujący SQL:**
   ```sql
   -- Utwórz użytkownika w Supabase Auth
   INSERT INTO auth.users (
     instance_id,
     id,
     aud,
     role,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at,
     raw_app_meta_data,
     raw_user_meta_data,
     is_super_admin,
     confirmation_token,
     recovery_token
   ) VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(),
     'authenticated',
     'authenticated',
     'demo@example.com',
     crypt('demo123', gen_salt('bf')),
     now(),
     now(),
     now(),
     '{"provider":"email","providers":["email"]}',
     '{"name":"Demo User"}',
     false,
     '',
     ''
   );

   -- Pobierz ID utworzonego użytkownika
   SELECT id, email FROM auth.users WHERE email = 'demo@example.com';
   ```

3. **Utwórz rekord w tabeli users (opcjonalne):**
   ```sql
   -- Zastąp USER_ID wartością z poprzedniego zapytania
   INSERT INTO users (id, email, name, "createdAt", "updatedAt")
   VALUES (
     'USER_ID_Z_POPRZEDNIEGO_ZAPYTANIA',
     'demo@example.com',
     'Demo User',
     now(),
     now()
   );
   ```

## Metoda 4: Przez aplikację mobile

1. **Uruchom aplikację mobile:**
   ```bash
   cd apps/mobile
   pnpm dev
   ```

2. **Zeskanuj QR kod** w aplikacji Expo Go

3. **Zarejestruj użytkownika:**
   - Aplikacja pokaże ekran logowania
   - Kliknij "Don't have an account? Sign up"
   - Wypełnij formularz rejestracji
   - Zaloguj się

## 🔧 Wyłączenie wymagania weryfikacji email (dla developmentu)

Jeśli chcesz pominąć weryfikację email podczas developmentu:

1. **W Supabase Dashboard:**
   - Przejdź do **Authentication** → **Providers**
   - Kliknij **Email**
   - Wyłącz **"Confirm email"** (odznacz checkbox)
   - Kliknij **"Save"**

2. **Teraz możesz rejestrować użytkowników bez weryfikacji email**

## 📝 Przykładowe dane testowe

### Użytkownik 1 - Admin
- **Email:** `admin@fridge.app`
- **Password:** `admin123`
- **Name:** `Admin User`

### Użytkownik 2 - Demo
- **Email:** `demo@fridge.app`
- **Password:** `demo123`
- **Name:** `Demo User`

### Użytkownik 3 - Test
- **Email:** `test@fridge.app`
- **Password:** `test123`
- **Name:** `Test User`

## ✅ Sprawdzenie czy użytkownik został utworzony

1. **W Supabase Dashboard:**
   - Authentication → Users
   - Powinieneś zobaczyć listę użytkowników

2. **W bazie danych:**
   ```sql
   -- Sprawdź użytkowników w auth.users
   SELECT id, email, created_at FROM auth.users;

   -- Sprawdź użytkowników w tabeli users (nasza tabela)
   SELECT id, email, name FROM users;
   ```

3. **W aplikacji:**
   - Zaloguj się używając utworzonych danych
   - Powinieneś zostać przekierowany do `/dashboard`

## 🎯 Następne kroki po utworzeniu użytkownika

1. **Dodaj przykładowe produkty:**
   - Po zalogowaniu przejdź do "Add Product"
   - Dodaj kilka produktów z różnymi datami ważności

2. **Sprawdź synchronizację:**
   - Zaloguj się na tym samym koncie w aplikacji mobile
   - Produkty powinny się synchronizować między web a mobile

3. **Przetestuj funkcjonalności:**
   - Lista produktów
   - Dodawanie produktów
   - Usuwanie produktów
   - Powiadomienia o produktach wygasających

