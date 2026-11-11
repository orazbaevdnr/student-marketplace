# Подключение бэкенда `student-marketplace` к фронтенду BIS

Дата подключения: 10.11.2026  
**Статус: ✅ подключено и проверено end-to-end**  
Фронтенд: `C:\Users\support\Desktop\2kbtu\BIS`  
Бэкенд: `C:\Users\support\Desktop\2kbtu\student-marketplace` (Spring Boot 3.3.5, Java 21, PostgreSQL/H2, Flyway, JWT + Firebase)

---

## 0. Коротко: что сделано

Backend подключён к фронтенду через контрактный слой **`/api/client/**`**. Firebase Auth сохранён: фронтенд получает Firebase ID token и отправляет его в заголовке `Authorization: Bearer ...`, backend проверяет токен и сам создаёт пользователя.

Уже выполнено:

| Что | Где |
|---|---|
| `VITE_USE_MOCK=false`, `VITE_API_BASE_URL=http://localhost:8080/api/client` | `BIS/.env` |
| При `VITE_USE_MOCK=false` выбирается `RestApiClient` | `BIS/src/api/index.ts` |
| Bearer-токен в каждом запросе, пути контракта `/listings`, `/users/...` | `BIS/src/api/restAdapter.ts` |
| Убрана picsum-заглушка, цена минимум 1 ₸ | `BIS/src/pages/ListingForm.tsx` |
| Цены в KZT (`ru-KZ`, `₸`) | `format.ts`, `strings.ts`, `Filters.tsx` |
| Firebase project, CORS 5173/4173, demo-домен | `student-marketplace/src/main/resources/application-dev.yml` |
| Портативные JDK 21 + Maven 3.9 | `C:\Users\support\Desktop\2kbtu\tools` |
| Скрипты запуска | `student-marketplace\start-backend.bat`, `BIS\start.bat` |
| Исправлен баг: вручную проданное объявление можно вернуть в `active` | `ClientListingService.java` + тест |
| `mvn verify`: 18 тестов, BUILD SUCCESS | backend |
| UI-проверка: вход, создание/редактирование/удаление, каталог, избранное, sold/reactivate | браузер |

Ниже — полная инструкция: что внутри backend, как он устроен и как запускать. Исторические шаги правок помечены как выполненные.

---

## 1. Что внутри ZIP (карта backend)

```
student-marketplace/
├─ pom.xml                     Spring Boot 3.3.5, Java 21, Maven
├─ Dockerfile
├─ docker-compose.yml          app + PostgreSQL 16 + ежедневный бэкап БД
├─ .env.example                переменные окружения
├─ src/main/resources/
│  ├─ application.yml          основные настройки
│  ├─ application-dev.yml      H2 в памяти, без PostgreSQL
│  └─ db/migration/
│     ├─ V1__create_schema.sql 5 таблиц: users, categories, listings, listing_photos, purchases
│     ├─ V2__seed_categories.sql
│     └─ V3__frontend_support.sql  slug категорий, condition, contact, Firebase, favorites
└─ src/main/java/com/studentmarketplace/
   ├─ auth/ security/          JWT + проверка Firebase ID token
   ├─ user/ category/ listing/ photo/ purchase/
   ├─ client/                  ← слой совместимости с нашим фронтендом
   ├─ admin/ stale/            отчёты, скрытие объявлений через 37 дней
   └─ config/ common/          настройки, ошибки RFC 7807
```

Ключевые классы контрактного слоя:

- `client/ClientListingController.java` — `/api/client/listings`
- `client/ClientUserController.java` — `/api/client/users/{userId}` + избранное
- `client/ClientListingService.java` — категории-slug, condition, статусы, фото
- `client/ClientMapper.java` — преобразование в JSON фронтенда
- `security/SecurityConfig.java` — CORS и правила доступа
- `security/FirebaseAuthService.java` — проверка Firebase ID token по project ID

Важно: в README самого backend написано, что код **ещё не компилировался**. Первым делом нужно запустить `mvn verify`.

---

## 2. Что совпадает с фронтендом

| Фронтенд | Backend `/api/client` | Статус |
|---|---|---|
| `GET /listings` + фильтры + пагинация | `GET /api/client/listings` | ✅ |
| `GET /listings/:id` | `GET /api/client/listings/{id}` | ✅ |
| `POST /listings` | `POST /api/client/listings` | ✅ |
| `PUT /listings/:id` | `PUT /api/client/listings/{id}` | ✅ |
| `DELETE /listings/:id` | `DELETE /api/client/listings/{id}` | ✅ |
| `PATCH /listings/:id/status` | `PATCH /api/client/listings/{id}/status` | ✅ |
| `GET /users/:id/listings` | `GET /api/client/users/{id}/listings` | ✅ |
| `GET /users/:id/favorites` | `GET /api/client/users/{id}/favorites` | ✅ |
| `POST .../favorites/:listingId/toggle` | `POST /api/client/users/{id}/favorites/{listingId}/toggle` | ✅ |
| `GET/PATCH /users/:id` | `GET/PATCH /api/client/users/{id}` | ✅ |
| Категории-slug (`textbooks`, `dorm_home`, ...) | есть в `V3` миграции | ✅ |
| `condition`: `new/like_new/good/fair` | конвертируется в `NEW/LIKE_NEW/...` | ✅ |
| Статусы `active/sold` | `AVAILABLE → active`, `SOLD → sold` | ✅ |
| Картинки data URL | принимает `data:image/png|jpeg|webp;base64,...` | ✅ |
| Ошибки `{ message }` | backend дублирует `detail` в `message` | ✅ |

`{userId}` в URL backend понимает как:
- `me`,
- Firebase UID (именно его фронтенд хранит в `user.id` после синхронизации),
- числовой id пользователя.

`POST /listings` поля `sellerId` и `seller` **игнорирует** — продавец всегда берётся из токена. Это правильно и безопасно.

---

## 3. Шаг 0. Что установить на компьютер

✅ **Уже сделано.** В системе не было `java`/`mvn`/Docker, поэтому установлен портативный toolchain без прав администратора:

```
C:\Users\support\Desktop\2kbtu\tools\
├─ jdk-21.0.13+9\
└─ apache-maven-3.9.16\
```

`start-backend.bat` сам находит эти папки и выставляет `JAVA_HOME`/`PATH`. Docker не требуется.

Если переносите проект на другую машину — либо скопируйте `tools`, либо установите JDK 21 + Maven 3.9+ обычным способом.

---

## 4. Шаг 1. Распаковать backend

Рекомендую держать backend рядом с фронтендом, отдельной папкой:

```powershell
Expand-Archive `
  -Path "$env:USERPROFILE\Downloads\student-marketplace.zip" `
  -DestinationPath "$env:USERPROFILE\Desktop\2kbtu" `
  -Force
```

Получится:

```
C:\Users\support\Desktop\2kbtu\
├─ BIS\                          ← фронтенд
└─ student-marketplace\          ← backend
```

Не кладите backend внутрь `BIS\src` — это отдельный Maven-проект.

---

## 5. Шаг 2. Сначала проверить, что backend вообще собирается

```powershell
cd "$env:USERPROFILE\Desktop\2kbtu\student-marketplace"
mvn verify
```

Почему это важно: в README backend прямо сказано, что проект не компилировали и возможны мелкие опечатки/импорты. Если `mvn verify` падает — сначала исправьте ошибку компиляции, только потом подключайте фронт.

Тесты используют H2, PostgreSQL для них не нужен.

---

## 6. Шаг 3. Настроить backend

### 6.1. Обязательные параметры

| Переменная | Значение для нашего проекта | Зачем |
|---|---|---|
| `FIREBASE_PROJECT_ID` | `student-marketplace-1b107` | Должен **точно совпадать** с `VITE_FIREBASE_PROJECT_ID` фронтенда |
| `CORS_ORIGINS` | `http://localhost:5173` | Origin Vite-сервера |
| `ALLOWED_EMAIL_DOMAIN` | `kbtu.kz` или пусто | Ограничение домена почты |
| `JWT_SECRET` | строка **32+ символа** | Иначе backend не стартует |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | опционально | Админ для `/api/admin/**` |
| `DB_PASSWORD` | любой | Только для Docker/PostgreSQL |

В текущем фронтендовом `.env`:

```env
VITE_FIREBASE_PROJECT_ID="student-marketplace-1b107"
```

Значит на backend:

```env
FIREBASE_PROJECT_ID=student-marketplace-1b107
```

### 6.2. Запуск через Docker (PostgreSQL, ближе к «настоящему»)

В папке backend создайте `.env`:

```env
DB_PASSWORD=marketplace-local-pass-123
JWT_SECRET=dev-only-secret-change-me-dev-only-secret
ADMIN_EMAIL=admin@kbtu.kz
ADMIN_PASSWORD=Admin12345!
ALLOWED_EMAIL_DOMAIN=kbtu.kz
FIREBASE_PROJECT_ID=student-marketplace-1b107
CORS_ORIGINS=http://localhost:5173
```

Запуск:

```powershell
cd "$env:USERPROFILE\Desktop\2kbtu\student-marketplace"
docker compose up --build
```

Проверка:

- http://localhost:8080/actuator/health → `{"status":"UP"}`
- http://localhost:8080/swagger-ui.html → Swagger
- http://localhost:8080/api/client/listings?page=1&pageSize=12 → пустой каталог `{"items":[]...}`

### 6.3. Запуск без Docker (H2 в памяти, быстрее для разработки)

✅ **Рекомендуемый способ** — двойной клик или из терминала:

```powershell
cd "C:\Users\support\Desktop\2kbtu\student-marketplace"
.\start-backend.bat
```

Скрипт сам находит портативные JDK/Maven в `..\tools`, выставляет `JAVA_HOME`/`PATH` и запускает профиль `dev`.

Альтернатива вручную — профиль `dev`:

```powershell
$env:JAVA_HOME="C:\Users\support\Desktop\2kbtu\tools\jdk-21.0.13+9"
$env:PATH="$env:JAVA_HOME\bin;C:\Users\support\Desktop\2kbtu\tools\apache-maven-3.9.16\bin;$env:PATH"
cd "C:\Users\support\Desktop\2kbtu\student-marketplace"
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"
```

Настройки уже прописаны в `application-dev.yml`:

```yaml
app:
  jwt:
    secret: dev-only-secret-change-me-dev-only-secret
  admin:
    email: admin@kbtu.kz
    password: Admin12345!
  allowed-email-domain: ""        # для демо разрешить любую почту
  firebase:
    project-id: student-marketplace-1b107
    require-verified-email: false # для демо; в проде вернуть true
  cors:
    allowed-origins:
      - http://localhost:5173
      - http://localhost:4173
```

Плюсы `dev`: не нужен PostgreSQL.  
Минус: **данные пропадают после перезапуска** (H2 in-memory).

---

## 7. Шаг 4. Настроить фронтенд `.env`

Файл: `C:\Users\support\Desktop\2kbtu\BIS\.env`

Было:

```env
VITE_USE_MOCK=true
VITE_ENABLE_DEMO_LOGIN=false
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="student-marketplace-1b107.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="student-marketplace-1b107"
VITE_FIREBASE_APP_ID="1:820618126204:web:79f10f9db1b929c2b33af9"
```

Нужно:

```env
VITE_USE_MOCK=false
VITE_ENABLE_DEMO_LOGIN=false
VITE_API_BASE_URL=http://localhost:8080/api/client
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="student-marketplace-1b107.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="student-marketplace-1b107"
VITE_FIREBASE_APP_ID="1:820618126204:web:79f10f9db1b929c2b33af9"
```

Ключевые отличия:

- `VITE_API_BASE_URL` ведёт на **`/api/client`**, потому что `restAdapter` добавляет к базе пути контракта: `/listings`, `/users/...`.
- Firebase-переменные **не удалять**: они нужны для входа, backend проверяет Firebase ID token.
- Демо-вход (`signInDemo`) с реальным backend не работает: backend не знает пользователя `user_demo` и требует токен.

После изменения `.env` обязательно перезапустить `npm run dev` (Vite читает env только при старте).

> ✅ Уже применено в `BIS/.env`. Vite при изменении `.env` нужно перезапускать.

---

## 8. Шаг 5. Переключить выбор API-адаптера

✅ **Выполнено.** Раньше `src/api/index.ts` при настроенном Firebase всегда выбирал Firestore, даже если `VITE_USE_MOCK=false`.

Файл: `src/api/index.ts`

Теперь содержимое такое:

```ts
import { ApiClient } from './types';
import { MockApiClient } from './mockAdapter';
import { RestApiClient } from './restAdapter';
import { FirestoreApiClient } from './firestoreAdapter';
import { isFirebaseConfigured } from '../auth/firebase';

// Приоритет:
// 1. VITE_USE_MOCK=false  -> реальный backend (REST)
// 2. Firebase настроен    -> Firestore
// 3. иначе                -> mock
function createApiClient(): ApiClient {
  if (import.meta.env.VITE_USE_MOCK === 'false') {
    return new RestApiClient();
  }
  if (isFirebaseConfigured) {
    return new FirestoreApiClient();
  }
  return new MockApiClient();
}

export const api: ApiClient = createApiClient();

export * from './types';
```

Важно: Firebase Auth при этом остаётся включённым (вход через email/Google), но данные теперь идут в Spring Boot, а не в Firestore.

---

## 9. Шаг 6. Добавить Firebase ID token в каждый запрос

✅ **Выполнено.** Без этого backend отвечал `401 Unauthorized` на создание объявления, профиль, избранное и «мои объявления».

Файл: `src/api/restAdapter.ts`

В начало добавлен импорт:

```ts
import { auth } from '../auth/firebase';
```

Метод `request` теперь такой:

```ts
private async request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;

  const res = await fetch(`${this.baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.detail || `API error ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}
```

Что это даёт:

- backend получает `Authorization: Bearer <Firebase ID token>`;
- `FirebaseAuthService` проверяет подпись, issuer, audience и срок;
- при первом запросе backend сам создаёт пользователя в таблице `users`;
- `ClientMapper` после этого показывает `contact` продавца и разрешает операции.

`getIdToken()` сам кэширует токен и обновляет его перед истечением, вручную refresh не нужен.

Опционально: `getListing` по 404 можно возвращать `null`, как обещает `API_CONTRACT.md`:

```ts
async getListing(id: string): Promise<Listing | null> {
  try {
    return await this.request<Listing>(`/listings/${id}`);
  } catch (e) {
    if ((e as Error).message.includes('404')) return null;
    throw e;
  }
}
```

---

## 10. Шаг 7. Исправить создание объявления под правила backend

✅ **Выполнено.**

### 10.1. Цена

Frontend разрешал `0`, backend — только `>= 1`. Теперь в форме `min="1"`, проверка `numPrice < 1`, подсказка «Minimum 1 ₸».

Файл: `src/pages/ListingForm.tsx`

```ts
const numPrice = Number(price);
if (price === '' || isNaN(numPrice) || numPrice < 1) {
  errs.price = 'Please enter a price of 1 or higher';
}
```

### 10.2. Картинка-заглушка

Раньше при отсутствии фото отправлялась ссылка `https://picsum.photos/...`. Backend отвечал `400 Unsupported image`, потому что принимает **только**:
- `data:image/png|jpeg|webp;base64,...`;
- URL фото, которое уже принадлежит этому объявлению.

Теперь блок выглядит так:

```ts
// Backend разрешает объявление без фото,
// а фронтенд сам покажет заглушку в ListingCard/Gallery
const finalImages = images;
```

`ListingCard` и `Gallery` уже умеют рисовать `picsum`-заглушку для пустого массива, так что визуально ничего не сломается.

### 10.3. Что ещё совпадает

- до 5 фото — и фронт, и backend;
- изображение сжимается до 1024px / quality 0.82, лимит backend 5 МБ — обычно проходит;
- title 3–80 на фронте, 3–120 на backend — ок;
- description до 1000 на фронте, до 2000 на backend — ок.

---

## 11. Шаг 8. Настроить Firebase Authentication

Backend доверяет Firebase, но с двумя проверками (по умолчанию):

1. `email_verified = true`;
2. домен почты = `ALLOWED_EMAIL_DOMAIN` (по умолчанию `kbtu.kz`).

✅ Для локального демо в `application-dev.yml` уже стоит `require-verified-email: false` и `allowed-email-domain: ""`.

### Вариант «как в проде»

1. В Firebase Console → Authentication → Sign-in method включить **Email/Password** и **Google**.
2. В `ALLOWED_EMAIL_DOMAIN` оставить `kbtu.kz` (или домен вашего вуза).
3. Пользователь регистрируется, подтверждает почту по письму, затем входит.
4. `require-verified-email: true` не менять.

Минус: аккаунт `@gmail.com` не подойдёт.

### Вариант «для демо/защиты проекта»

В `application-dev.yml`:

```yaml
app:
  allowed-email-domain: ""
  firebase:
    project-id: student-marketplace-1b107
    require-verified-email: false
```

Тогда подойдёт любой email и можно не подтверждать почту.  
**Перед реальной сдачей/продом верните `require-verified-email: true` и домен.**

### Про Google-вход

Если Google-аккаунт не `@kbtu.kz`, backend отклонит токен при включённом ограничении домена. Для демо либо используйте email-вход с разрешённым доменом, либо временно очистите `allowed-email-domain`.

---

## 12. Шаг 9. Запустить всё вместе

✅ **Сейчас запущено:** backend на `http://localhost:8080` (профиль `dev`, H2), Vite на `http://localhost:5173`.

Терминал 1 — backend (двойной клик или):

```powershell
cd "C:\Users\support\Desktop\2kbtu\student-marketplace"
.\start-backend.bat
```

Терминал 2 — фронтенд (двойной клик или):

```powershell
cd "C:\Users\support\Desktop\2kbtu\BIS"
.\start.bat
```

Либо просто `npm run dev`.

Открыть: http://localhost:5173/student-marketplace/

> Обратите внимание: в `vite.config.ts` стоит `base: '/student-marketplace/'`, поэтому dev-адрес содержит этот путь. Origin для CORS всё равно `http://localhost:5173` (без пути), так что настройка CORS верная.

---

## 13. Шаг 10. Проверка по сценарию

✅ **Проверено end-to-end 10.11.2026.**

Проверка через API (curl/PowerShell):

1. `GET /actuator/health` → `UP`.
2. `GET /api/client/listings?page=1&pageSize=12` → `200`, `{"items":[],"total":0,...}`.
3. Регистрация → Firebase ID token → backend создал пользователя.
4. Создание объявления с фото → `201`, `L-101`, фото отдаётся `200` (`/api/listings/L-101/photos/1/content`).
5. Каталог → объявление видно, `contact` скрыт у анонима.
6. Детали с токеном → `contact` виден.
7. Профиль, «мои объявления», избранное — работают.
8. `PATCH /status` `sold` → `sold`, затем `active` → снова `active` (после фикса backend).
9. Удаление → `success: true`.
10. CORS preflight с `http://localhost:5173` → `200`, `allow-origin` и `allow-headers` корректные.

Проверка через реальный UI в браузере:

- вход Firebase-пользователем;
- создание объявления без фото (заглушка UI, backend принимает пустой массив);
- каталог, карточка, избранное;
- «Мои объявления», редактирование цены;
- «Mark as Sold» → «Reactivate» → снова активное;
- удаление объявления;
- ошибок в консоли браузера нет.


---

## 14. Таблица соответствия вызовов

| Фронтенд (`restAdapter`) | Реальный URL |
|---|---|
| `getListings()` | `GET http://localhost:8080/api/client/listings` |
| `getListing(id)` | `GET .../api/client/listings/{id}` |
| `createListing()` | `POST .../api/client/listings` |
| `updateListing()` | `PUT .../api/client/listings/{id}` |
| `deleteListing()` | `DELETE .../api/client/listings/{id}` |
| `setListingStatus()` | `PATCH .../api/client/listings/{id}/status` |
| `getMyListings(userId)` | `GET .../api/client/users/{userId}/listings` |
| `getFavorites()` | `GET .../api/client/users/{userId}/favorites` |
| `isFavorite()` | `GET .../api/client/users/{userId}/favorites/{listingId}` |
| `toggleFavorite()` | `POST .../api/client/users/{userId}/favorites/{listingId}/toggle` |
| `getProfile()` | `GET .../api/client/users/{userId}` |
| `updateProfile()` | `PATCH .../api/client/users/{userId}` |

---

## 15. Подводные камни и отличия

### 15.1. Валюта

✅ **Исправлено.** Backend хранит цену в **KZT** (`price_kzt`, целое > 0), фронтенд теперь форматирует её как KZT:

```ts
return new Intl.NumberFormat('ru-KZ', {
  style: 'currency',
  currency: 'KZT',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(price);
```

Символ `₸` также заменён в `strings.ts` и фильтре цены.

### 15.2. Дата создания

Backend отдаёт `createdAt` как `LocalDate` → строка `"2026-11-10"` без времени.  
`formatDate` посчитает это за полночь и может показать «15h ago» вместо «только что».  
Если важно — измените в backend `ListingDto.createdAt` на `Instant`/`OffsetDateTime`, либо на фронте показывайте просто дату.

### 15.3. Дополнительные статусы

Backend может вернуть `reserved` и `hidden`, которых нет в TypeScript-типе:

```ts
export type ListingStatus = 'active' | 'sold';
```

Через наш UI они не выставляются (`PATCH .../status` принимает только `active`/`sold`), но если их выставить через «родной» API или админку:

- `reserved` не попадёт ни в одну вкладку `MyListings` (там фильтры только `active`/`sold`);
- `hidden` пропадёт из каталога по правилу «37 дней без подтверждения».

Для полной поддержки расширьте тип и UI.

### 15.4. Демо-логин

`signInDemo()` создаёт локального пользователя `user_demo` и вызывает `/users/user_demo`.  
С реальным backend это даст `401/404`, потому что такого Firebase-пользователя нет.  
Оставьте `VITE_ENABLE_DEMO_LOGIN=false` (уже стоит).

### 15.5. Firestore больше не используется

После правки `index.ts` при `VITE_USE_MOCK=false` данные идут в Spring Boot.  
Firestore остаётся только как альтернатива, если `VITE_USE_MOCK=true` и Firebase настроен.  
Если Firestore больше не нужен — можно не удалять, он просто не выберется.

### 15.6. GitHub Pages

`package.json` содержит `gh-pages`, а `vite.config.ts` — `base: '/student-marketplace/'`.  
Если фронт опубликован на GitHub Pages (HTTPS), он **не сможет** ходить на `http://localhost:8080`:

- mixed content (HTTPS → HTTP) блокируется браузером;
- `localhost` у зрителя — это его компьютер, а не ваш backend.

Для деплоя нужно:

1. Разместить backend на публичном HTTPS-хостинге (VPS, Railway, Render, Fly.io и т.п.).
2. Поставить `CORS_ORIGINS=https://<ваш-логин>.github.io` (или конкретный origin).
3. В `.env` фронта указать `VITE_API_BASE_URL=https://<backend>/api/client`.
4. Пересобрать фронт: `npm run build`.

Для локальной защиты проекта достаточно запускать оба сервиса на одном компьютере.

### 15.7. Фото хранятся на диске

`PHOTO_DIR` по умолчанию `./data/photos`. В Docker — volume `photos`.  
При пересоздании контейнера без volume фото потеряются. В `docker-compose.yml` volume уже есть.  
Для нескольких серверов нужен S3-совместимый storage (менять только `PhotoStorage`).

### 15.8. H2 vs PostgreSQL

- `dev` профиль: H2 в памяти, данные исчезают при перезапуске, миграции Flyway прогоняются заново.
- Docker: PostgreSQL + volume `pgdata`, данные сохраняются, плюс ежедневный бэкап в `./backups/db`.

Для демонстрации удобен `dev`, для «настоящей» работы — Docker.

### 15.9. Исправленный баг backend: реактивация проданного объявления

В исходном `ClientListingService.setStatus` возврат в `active` шёл через `ownedAndChangeable`, который запрещал менять объявление со статусом `SOLD`. В результате кнопка «Reactivate» в UI получала `409 Conflict`.

Исправлено:

- `SOLD` → `AVAILABLE` разрешено владельцу;
- но только если объявление не было куплено через purchase-flow (`purchases.existsByListingId(id)`);
- добавлен тест в `ClientApiTest` (sold → active → снова в каталоге).

Файлы: `src/main/java/com/studentmarketplace/client/ClientListingService.java`, `src/test/java/com/studentmarketplace/ClientApiTest.java`.

---

## 16. Диагностика проблем

| Симптом | Причина | Решение |
|---|---|---|
| `401 Unauthorized` на всех приватных запросах | нет `Authorization` | правка `restAdapter` (шаг 9) |
| `401` даже с токеном | Firebase project ID не совпадает | `FIREBASE_PROJECT_ID=student-marketplace-1b107` |
| `401` после регистрации | email не подтверждён | подтвердить почту или `require-verified-email: false` |
| `401` с Gmail | домен не разрешён | `ALLOWED_EMAIL_DOMAIN=""` для демо |
| CORS error | origin не в списке | `CORS_ORIGINS=http://localhost:5173` |
| Backend не стартует: `jwt.secret must be at least 32 characters` | короткий `JWT_SECRET` | задать 32+ символа |
| `Unknown category '...'` | миграции не применились или slug не тот | проверить `V2`/`V3` и `GET /api/categories` |
| `Unsupported image` | picsum/внешний URL | исправлено в `ListingForm` |
| `price must be greater than 0` | цена 0 | исправлено: минимум 1 ₸ |
| `409` при «Reactivate» | старый баг backend | исправлено в `ClientListingService` (см. 15.9) |
| Фото не грузятся | backend строит URL из Host; другой хост/порт | открыть URL фото напрямую, проверить `PHOTO_DIR` |
| Каталог пуст | backend чистый, в нём нет демо-объявлений | создать объявление через UI |
| Данные пропали после перезапуска | H2 in-memory | использовать Docker/PostgreSQL |
| `mvn`/`java` не найдены | не установлены | установить JDK 21 + Maven или Docker Desktop |
| `mvn verify` падает | проект не компилировали | исправить ошибку компиляции по логу |

---

## 17. Чек-лист

- [x] JDK 21 + Maven (портативные в `..\tools`) **или** Docker Desktop
- [x] Backend распакован отдельно от `BIS`
- [x] `mvn verify` проходит (18 тестов, BUILD SUCCESS)
- [x] `.env` backend: `FIREBASE_PROJECT_ID=student-marketplace-1b107`, `CORS_ORIGINS=http://localhost:5173`, `JWT_SECRET` 32+
- [x] Backend запущен, `/actuator/health` = `UP`
- [x] `/api/client/listings` отвечает `200`
- [x] В `BIS/.env`: `VITE_USE_MOCK=false`, `VITE_API_BASE_URL=http://localhost:8080/api/client`
- [x] `src/api/index.ts` выбирает `RestApiClient` при `VITE_USE_MOCK=false`
- [x] `src/api/restAdapter.ts` отправляет `Authorization: Bearer <token>`
- [x] `ListingForm` не отправляет picsum-заглушку и требует цену `>= 1`
- [x] Firebase: Email/Password включён; Google — по желанию
- [x] Для демо: `require-verified-email: false`, `allowed-email-domain: ""`
- [x] Оба сервера запущены, сценарий из шага 13 пройден
- [x] `npx tsc --noEmit` и `npm run build` проходят

---

## 18. Что можно улучшить после базового подключения

1. **Тип `ListingStatus`** расширить до `active | sold | reserved | hidden`.
2. **Дата с временем**: отдавать `createdAt` как `Instant` (сейчас UI показывает «5h ago» из-за даты без времени).
3. **Своя авторизация без Firebase**: backend уже умеет `POST /api/auth/register|login` и выдаёт JWT. Но тогда нужно переписать `AuthContext`, добавить хранение JWT и передавать его в `restAdapter` вместо Firebase-токена. Это больше работы, чем оставить Firebase.
4. **Покупки**: backend умеет `POST /api/listings/{id}/purchase`, но в текущем UI покупки нет — можно добавить отдельный экран.
5. **Админка**: `/api/admin/**` уже готова (пользователи, категории, отчёты, запуск задания). Можно сделать отдельный admin-раздел.
6. **Деплой backend** на HTTPS и обновление `CORS_ORIGINS`/`VITE_API_BASE_URL` для GitHub Pages.
7. **Постоянная БД**: для реальной работы использовать Docker + PostgreSQL, а не H2 in-memory.

---

## 19. Итоговая схема

```
Browser (React, http://localhost:5173/student-marketplace/)
        │
        │  Firebase Auth -> ID token
        │  fetch + Authorization: Bearer <Firebase ID token>
        ▼
Spring Boot (http://localhost:8080)
        │  /api/client/**  ← контракт фронтенда
        │  /api/**         ← родной API, админка, покупки
        ▼
PostgreSQL (Docker)  или  H2 in-memory (dev)
        │
        └── PHOTO_DIR / volume photos  →  /api/listings/{id}/photos/{photoId}/content
```

Ключевая мысль: backend уже готов к нашему фронтенду; подключение выполнено через `/api/client`, Firebase-токен и три небольшие правки на стороне React (выбор адаптера, Bearer-токен, правила формы).
