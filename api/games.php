<?php
/**
 * games.php — эндпоинт получения списка игр (каталог).
 *
 * URL:   {{api-host}}/games   (GET, требует Authorization: Bearer {token})
 * Ответ: 200 { "data": [ { id, name, description, hours, img, start_date, end_date, price }, ... ],
 *                   "pagination": { "total", "current", "per_page" } }
 *
 * Примечание: структура ответа повторяет формат из задания для /courses.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(405, ['message' => 'Method not allowed']);
}

// Проверка токена авторизации (Bearer).
$headers = getallheaders() ?: [];
$authHeader = $headers['Authorization'] ?? '';
if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $m)) {
    jsonResponse(401, ['message' => 'Требуется авторизация (Authorization: Bearer {token})']);
}
$token = $m[1];
// В реальном проекте здесь валидация токена против таблицы сессий/пользователей.

try {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 10)));
    $offset = ($page - 1) * $perPage;

    $pdo = db();

    $totalStmt = $pdo->query('SELECT COUNT(*) AS cnt FROM games');
    $total = (int)$totalStmt->fetchColumn();

    $stmt = $pdo->prepare(
        'SELECT id, title AS name, description, price, image AS img, created_at AS start_date
         FROM games
         ORDER BY id DESC
         LIMIT :limit OFFSET :offset'
    );
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $data = array_map(function ($row) {
        return [
            'id'          => (int)$row['id'],
            'name'        => $row['name'],
            'description' => $row['description'],
            'hours'       => null,
            'img'         => $row['img'],
            'start_date'  => $row['start_date'],
            'end_date'    => null,
            'price'       => (float)$row['price'],
        ];
    }, $rows);

    jsonResponse(200, [
        'data'       => $data,
        'pagination' => [
            'total'    => $total,
            'current'  => $page,
            'per_page' => $perPage,
        ],
    ]);

} catch (Throwable $e) {
    error_log('games.php error: ' . $e->getMessage());
    jsonResponse(500, ['message' => 'Внутренняя ошибка сервера']);
}
