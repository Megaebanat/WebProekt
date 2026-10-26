<?php
/**
 * config.php — конфигурация подключения к базе данных MySQL.
 *
 * Назначение: централизованное создание PDO-соединения с базой BestGames.
 * Используется всеми скриптами API (register.php, auth.php, games.php и т.д.).
 *
 * Таблицы БД создаются скриптом sql/schema.sql (3 НФ: users, games, orders, order_items).
 *
 * Параметры подключения вынесены в константы — легко перенастроить под хостинг.
 */

declare(strict_types=1);

// Отключаем вывод ошибок в браузере на Produktion (ошибки пишем в лог).
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

define('DB_HOST', 'localhost');
define('DB_NAME', 'bestgames');
define('DB_USER', 'bestgames_user');
define('DB_PASS', 'change_me_in_production');
define('DB_CHARSET', 'utf8mb4');

// Базовый URL API (для формирования ссылок в ответах).
define('API_BASE_URL', isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https://' : 'http://' . $_SERVER['HTTP_HOST'] . '/api');

/**
 * Создаёт и возвращает PDO-соединение с БД.
 *
 * @return PDO
 * @throws PDOException при ошибке подключения
 */
function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_NAME,
            DB_CHARSET
        );
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    return $pdo;
}

/**
 * Отправляет JSON-ответ с указанным HTTP-статусом.
 *
 * @param int    $status HTTP-код ответа (200, 201, 400, 422, 403 и т.д.)
 * @param array  $data   Данные для сериализации в JSON
 * @param bool   $encodeEmptyMassive — преобразовывать пустой массив в [] (по умолчанию true)
 */
function jsonResponse(int $status, array $data, bool $encodeEmptyMassive = true): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8', true, $status);
    // Запрет кэширования ответов API.
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0', true);
    header('Pragma: no-cache', true);

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Возвращает тело запроса в виде ассоциативного массива.
 * Поддерживает application/json и application/x-www-form-urlencoded.
 *
 * @return array
 */
function getRequestBody(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        return $decoded;
    }
    parse_str($raw, $form);
    return $form ?: [];
}

/**
 * Валидирует e-mail.
 */
function isValidEmail(string $email): bool {
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

/**
 * Возвращает массив ошибок валидации в формате, требуемом заданием:
 * { "message": "Invalid fields", "errors": { "field_name": ["Error message"] } }
 */
function validationErrorResponse(array $errors): void {
    jsonResponse(422, [
        'message' => 'Invalid fields',
        'errors'  => $errors,
    ]);
}
