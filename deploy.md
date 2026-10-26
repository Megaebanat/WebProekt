# Развёртывание проекта BestGames

## Требования к серверу
- Веб-сервер (Apache / Nginx) с поддержкой PHP 7.4 или выше.
- MySQL 5.7 / 8.0 (или MariaDB 10.3+).
- Включённые расширения PHP: pdo_mysql, json, mbstring, openssl.

## 1. Подготовка базы данных
```bash
mysql -u bestgames_user -p bestgames < sql/schema.sql
```
Схема создаёт таблицы `users`, `games`, `orders`, `order_items` в 3 НФ.

## 2. Конфигурация API
Отредактируйте `api/config.php`:
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` — учётные данные БД.
- `API_BASE_URL` — базовый адрес API.

## 3. Запуск
- Поместите содержимое репозитория в корневую папку сайта (document root).
- Убедитесь, что папка `api/` доступна по HTTP (например, `http://сайт/api/register.php`).
- Откройте `index.html` в браузере — фронтенд статичен и не требует сервера.

## 4. Эндпоинты API
| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/register.php | Регистрация пользователя |
| POST | /api/auth.php | Авторизация (возвращает токен) |
| GET | /api/games.php | Список игр (требует Bearer-токен) |
| POST | /api/payment-webhook.php | Платежный вебхук |

## Аккаунт администратора (по умолчанию)
После импорта схемы создайте администратора вручную через SQL или интерфейс:
```sql
INSERT INTO users (email, password_hash, last_name, first_name, role)
VALUES ('admin@edu.com', PASSWORD_HASH('course2025'), 'Админ', 'Системы', 'admin');
```
Пароль по умолчанию: `course2025`.
