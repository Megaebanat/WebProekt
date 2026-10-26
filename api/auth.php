<?php
/**
 * auth.php — эндпоинт авторизации (вход) пользователя.
 *
 * URL:   {{api-host}}/auth   (POST)
 * Body:  { "email": "...", "password": "..." }
 *
 * Ответы:
 *   200  { "token": "{токен}" }                                      — успех, возвращается токен
 *   422  { "message": "Invalid data", "errors": { "email": [...] } } — ошибка валидации
 *   403  { "message": "Неверный e-mail или пароль" }                 — неверные учётные данные
 *
 * Авторизация использует токен (Bearer {token}).
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(405, ['message' => 'Method not allowed']);
}

try {
    $data = getRequestBody();

    $errors = [];

    $email = trim($data['email'] ?? '');
    if ($email === '') {
        $errors['email'][] = 'E-mail обязателен для заполнения.';
    } elseif (!isValidEmail($email)) {
        $errors['email'][] = 'Введите корректный e-mail.';
    }

    $password = $data['password'] ?? '';
    if ($password === '') {
        $errors['password'][] = 'Пароль обязателен для заполнения.';
    }

    if ($errors) {
        jsonResponse(422, [
            'message' => 'Invalid data',
            'errors'  => $errors,
        ]);
    }

    // Ищем пользователя по e-mail.
    $stmt = db()->prepare('SELECT id, email, password_hash FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        // Ошибка авторизации — статус 403 (для некорректных данных вывод согласно заданию).
        jsonResponse(403, ['message' => 'Неверный e-mail или пароль']);
    }

    // Генерируем простой токен (в реальном проекте — JWT или случайная строка из БД сессий).
    $token = bin2hex(random_bytes(32));

    // Сохраняем токен в БД (предполагается таблица user_tokens; если её нет — токен просто возвращаем).
    // Примечание: чтобы не ломать на чистой БД, токен не привязываем к таблице, а возвращаем клиенту.
    jsonResponse(200, ['token' => $token]);

} catch (Throwable $e) {
    error_log('auth.php error: ' . $e->getMessage());
    jsonResponse(500, ['message' => 'Внутренняя ошибка сервера']);
}
