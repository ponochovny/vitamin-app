# Vitamin App

План развития продукта, UX и технических этапов: [Дорожная карта](./docs/product-roadmap.md).

## Локальный вход через Google

Приложение использует значения `SUPABASE_URL` и `SUPABASE_KEY` из `.env`.
Код OAuth динамически использует origin текущего приложения:

- локально: `http://localhost:3000/auth/callback`
- в продакшене: `https://<ваш-домен>/auth/callback`

В настройках проекта Supabase:

1. Добавьте оба адреса в **Auth → URL Configuration → Redirect URLs**.
2. Для другого порта локального Nuxt добавьте его адрес вместо `3000`.
3. В Google OAuth настройте callback Supabase-проекта, который указан в **Supabase → Authentication → Providers → Google**. Обычно он выглядит как `https://<project-ref>.supabase.co/auth/v1/callback`.

Это разные callback-адреса: адрес Supabase разрешает Google, а адрес приложения завершает вход в Nuxt. Указывайте production-domain приложения отдельно в списке redirect URLs Supabase.

### Локальный Supabase

Запустите Supabase CLI (`supabase start`) и переназначьте в `.env` локальные:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<local-anon-key>
```
