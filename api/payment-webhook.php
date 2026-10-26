<?php
/**
 * payment-webhook.php — вебхук платёжной системы.
 *
 * URL:   {{api-host}}/payment-webhook   (POST)
 * Body:  { "order_id": "{uuid}", "status": "{success | failed}" }
 *
 * Ответ: 204 (тело пустое) при успешном обновлении заказа.
 *
 * Логика (имитация):
 *   - ищет заказ по order_id;
 *   - если status = success — помечает заказ оплаченным;
 *   - если status = failed — помечает заказ неоплаченным;
 *   - повторный вебхук для оплаченного заказа игнорируется (нельзя отписаться от оплаченного курса).
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $data = getRequestBody();

    $orderId = $data['order_id'] ?? null;
    $status  = $data['status'] ?? null;

    if (!$orderId || !in_array($status, ['success', 'failed'], true)) {
        http_response_code(422);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['message' => 'Некорректное тело запроса вебхука'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $pdo = db();

    // Проверяем существование заказа.
    $stmt = $pdo->prepare('SELECT id, payment_status FROM orders WHERE id = :order_id LIMIT 1');
    $stmt->execute([':order_id' => $orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['message' => 'Заказ не найден'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Если заказ уже оплачен — повторный вебхук не меняет статус (защита от повторной оплаты).
    if ($order['payment_status'] === 'success' && $status === 'success') {
        http_response_code(204);
        exit;
    }

    $newStatus = ($status === 'success') ? 'success' : 'failed';

    $stmt = $pdo->prepare('UPDATE orders SET payment_status = :status, updated_at = NOW() WHERE id = :order_id');
    $stmt->execute([':status' => $newStatus, ':order_id' => $orderId]);

    http_response_code(204);
    exit;

} catch (Throwable $e) {
    error_log('payment-webhook.php error: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'Внутренняя ошибка сервера'], JSON_UNESCAPED_UNICODE);
    exit;
}
