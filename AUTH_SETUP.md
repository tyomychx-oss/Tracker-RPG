# Налаштування аутентифікації

## Крок 1: Налаштування Supabase

1. Створіть проект на [supabase.com](https://supabase.com)
2. Отримайте ваші ключі з Settings > API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Додайте їх до `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Крок 2: Створення таблиці user_profiles

Виконайте SQL міграцію з файлу `supabase/migrations/001_create_user_profiles.sql` в SQL Editor вашого Supabase проекту.

Або виконайте вручну:
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  max_xp INTEGER DEFAULT 200,
  skill_xps JSONB DEFAULT '{}',
  skill_colors JSONB DEFAULT '{}',
  quests JSONB DEFAULT '{"plans": [], "dailies": [], "habits": []}',
  activities JSONB DEFAULT '[]',
  ui_color TEXT DEFAULT '#de6550',
  task_snapshots JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

## Крок 3: Налаштування Google OAuth (опційно)

1. Перейдіть до Authentication > Providers в Supabase Dashboard
2. Увімкніть Google provider
3. Додайте Client ID та Client Secret з Google Cloud Console
4. Додайте Redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`

## Крок 4: Налаштування Redirect URLs

В Authentication > URL Configuration додайте:
- Site URL: `http://localhost:3000` (для розробки)
- Redirect URLs: 
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback` (для продакшену)

## Функціональність

✅ Реєстрація через email з паролем
✅ Вхід через email
✅ Реєстрація/вхід через Google OAuth
✅ Перевірка наявності акаунта (показує помилку якщо email вже зареєстрований)
✅ Вікно з нікнеймом показується тільки при реєстрації нового акаунта
✅ Кнопка Log out перенаправляє на сторінку входу
✅ Автоматичне перенаправлення неавторизованих користувачів на сторінку входу




