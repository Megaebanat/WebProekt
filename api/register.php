<?php
/**
 * register.php — эндпоинт регистрации пользователя.
 *
 * URL:   {{api-host}}/registr   (POST)
 * Body:  { "email": "...", "password": "...", "last_name": "...", "first_name": "...", "birth_date": "...", "phone": "..." }
 *
 * Ответы:
 *   201  { "success": true }                                         — регистрация успешна
 *   422  { "message": "Invalid fields", "errors": { ... } }          — ошибка валидации полей
 *   409  { "message": "Пользователь с таким e-mail уже существует" }  — дубликат e-mail
 *   500  { "message": "Внутренняя ошибка сервера" }                  — ошибка БД
 *
 * Пароль хешируется перед сохранением (password_hash, алгоритм PASSWORD_DEFAULT).
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

// Разрешаем кросс-доменные запросы (CORS) для фронтенда.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

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

    // email — обязателен, корректный формат, уникален
    $email = trim($data['email'] ?? '');
    if ($email === '') {
        $errors['email'][] = 'E-mail обязателен для заполнения.';
    } elseif (!isValidEmail($email)) {
        $errors['email'][] = 'Введите корректный e-mail.';
    } else {
        $stmt = db()->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        if ($stmt->fetch()) {
            $errors['email'][] = 'Пользователь с таким e-mail уже зарегистрирован.';
        }
    }

    // password — обязателен, минимум 3 символа, допустимые спецсимволы _ # ! %
    $password = $data['password'] ?? '';
    if ($password === '') {
        $errors['password'][] = 'Пароль обязателен для заполнения.';
    } elseif (mb_strlen($password) < 3) {
        $errors['password'][] = 'Пароль должен содержать минимум 3 символа.';
    } elseif (!preg_match('/^[\w_#!%]{3,}$/', $password)) {
        $errors['password'][] = 'Пароль содержит недопустимые символы (разрешены буквы, цифры, _ # ! %).';
    }

    // last_name, first_name — обязательны
    foreach (['last_name', 'first_name'] as $field) {
        $val = trim($data[$field] ?? '');
        if ($val === '') {
            $errors[$field][] = ucfirst($field) . ' обязателен для заполнения.';
        }
    }

    // birth_date — обязательна
    $birthDate = trim($data['birth_date'] ?? '');
    if ($birthDate === '') {
        $errors['birth_date'][] = 'Дата рождения обязательна.';
    }

    // phone — обязателен
    $phone = trim($data['phone'] ?? '');
    if ($phone === '') {
        $errors['phone'][] = 'Телефон обязателен для заполнения.';
    }

    if ($errors) {
        validationErrorResponse($errors);
    }

    // Хешируем пароль перед сохранением в БД (требование задания: Пароль хешируется в БД).
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $pdo = db();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT INTO users (email, password_hash, last_name, first_name, birth_date, phone, created_at)
         VALUES (:email, :password_hash, :last_name, :first_name, :birth_date, :phone, NOW())'
    );
    $stmt->execute([
        ':email'          => $email,
        ':password_hash'  => $passwordHash,
        ':last_name'      => trim($data['last_name']),
        ':first_name'     => trim($data['first_name']),
        ':birth_date'     => $birthDate,
        ':phone'          => $phone,
    ]);
    $pdo->commit();

    jsonResponse(201, ['success' => true]);

} catch (Throwable $e) {
    // Логируем ошибку, пользователю отправляем общий ответ без раскрытия деталей.
    error_log('register.php error: ' . $e->getMessage());
    jsonResponse(500, ['message' => 'Внутренняя ошибка сервера']);
}
