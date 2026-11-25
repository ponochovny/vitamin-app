# Vitamin App

План развития продукта, UX и технических этапов: [Дорожная карта](./docs/product-roadmap.md).

## Запропонована харчова цінність через Google Gemini

Для ИИ-підказки у формі додавання продукту задайте серверну змінну:

```env
NUXT_GOOGLE_GEMINI_API_KEY=<api-key>
NUXT_GOOGLE_GEMINI_MODEL=gemini-3.5-flash-lite
```

Ключ не передається браузеру і не зберігається в Supabase. Без ключа або при помилці
ІI форма залишає доступним ручний ввод.

## SEO

Для production задайте публичный адрес приложения в переменной окружения:

```env
NUXT_PUBLIC_SITE_URL=https://your-domain.com
```

Этот адрес используется в canonical-ссылках, Open Graph-тегах, `robots.txt` и `sitemap.xml`.
Задайте его в окружении production-сервера или хостинга — значение в локальном `.env`
не попадёт в production автоматически. Если переменная не задана, приложение использует
origin текущего запроса; адрес `localhost` больше не задан как production-значение.
Картинка для превью ссылки — `public/og-image.png` (1200 × 630); её можно заменить,
сохранив имя и размеры. Исходный SVG-макет находится рядом в `public/og-image.svg`.

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
