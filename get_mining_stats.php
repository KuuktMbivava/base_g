<?php
/**
 * Получение статистики добычи ресурсов (исправленная версия)
 * Ресурсная Империя
 */

// Включаем вывод ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключаем конфигурацию
require_once 'config.php';

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Неверный метод запроса');
    exit;
}

// Получаем ID пользователя из запроса
$user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;

// Проверяем валидность ID пользователя
if ($user_id <= 0) {
    jsonResponse(false, 'Неверный ID пользователя');
    exit;
}

// Проверяем существование таблицы
$table_check = $db->query("SHOW TABLES LIKE 'mining_history'");
if ($table_check->num_rows === 0) {
    jsonResponse(false, 'Таблица истории добычи не найдена');
    exit;
}

try {
    // Общая статистика добычи
    $stats_query = "SELECT 
                      COUNT(*) as total_attempts,
                      SUM(success) as success_count,
                      SUM(CASE WHEN success = 1 THEN amount ELSE 0 END) as total_resources,
                      (SUM(success) / COUNT(*) * 100) as success_rate
                    FROM mining_history
                    WHERE user_id = ?";
    
    $stats_stmt = $db->prepare($stats_query);
    
    if (!$stats_stmt) {
        throw new Exception('Ошибка при подготовке запроса статистики: ' . $db->error);
    }
    
    $stats_stmt->bind_param("i", $user_id);
    $stats_stmt->execute();
    $stats_result = $stats_stmt->get_result();
    
    if (!$stats_result) {
        throw new Exception('Ошибка при получении статистики: ' . $stats_stmt->error);
    }
    
    $stats = $stats_result->fetch_assoc();
    
    // Статистика по ресурсам - исправленный запрос с группировкой по имени и ID ресурса
    $resource_stats_query = "SELECT 
                              r.id,
                              r.name as resource_name,
                              r.rarity,
                              COUNT(*) as attempts,
                              SUM(mh.success) as successes,
                              (SUM(mh.success) / COUNT(*) * 100) as success_rate,
                              SUM(CASE WHEN mh.success = 1 THEN mh.amount ELSE 0 END) as total_mined
                            FROM mining_history mh
                            JOIN resources r ON mh.resource_id = r.id
                            WHERE mh.user_id = ?
                            GROUP BY r.id
                            ORDER BY total_mined DESC";
    
    $resource_stats_stmt = $db->prepare($resource_stats_query);
    
    if (!$resource_stats_stmt) {
        throw new Exception('Ошибка при подготовке запроса статистики ресурсов: ' . $db->error);
    }
    
    $resource_stats_stmt->bind_param("i", $user_id);
    $resource_stats_stmt->execute();
    $resource_stats_result = $resource_stats_stmt->get_result();
    
    if (!$resource_stats_result) {
        throw new Exception('Ошибка при получении статистики ресурсов: ' . $resource_stats_stmt->error);
    }
    
    $resource_stats = [];
    while ($row = $resource_stats_result->fetch_assoc()) {
        $resource_stats[] = $row;
    }
    
    // Статистика по локациям - исправленный запрос с группировкой по имени и ID локации
    $location_stats_query = "SELECT 
                              l.id,
                              l.name as location_name,
                              l.difficulty,
                              COUNT(*) as attempts,
                              SUM(mh.success) as successes,
                              (SUM(mh.success) / COUNT(*) * 100) as success_rate,
                              SUM(CASE WHEN mh.success = 1 THEN mh.amount ELSE 0 END) as total_mined
                            FROM mining_history mh
                            JOIN locations l ON mh.location_id = l.id
                            WHERE mh.user_id = ?
                            GROUP BY l.id
                            ORDER BY total_mined DESC";
    
    $location_stats_stmt = $db->prepare($location_stats_query);
    
    if (!$location_stats_stmt) {
        throw new Exception('Ошибка при подготовке запроса статистики локаций: ' . $db->error);
    }
    
    $location_stats_stmt->bind_param("i", $user_id);
    $location_stats_stmt->execute();
    $location_stats_result = $location_stats_stmt->get_result();
    
    if (!$location_stats_result) {
        throw new Exception('Ошибка при получении статистики локаций: ' . $location_stats_stmt->error);
    }
    
    $location_stats = [];
    while ($row = $location_stats_result->fetch_assoc()) {
        $location_stats[] = $row;
    }
    
    // Возвращаем успешный ответ с данными
    jsonResponse(true, '', [
        'stats' => $stats,
        'resource_stats' => $resource_stats,
        'location_stats' => $location_stats
    ]);
    
} catch (Exception $e) {
    jsonResponse(false, $e->getMessage());
}