<?php
/**
 * API для работы с рыночными ценами
 * Ресурсная Империя
 */

// Подключаем конфигурацию
require_once 'config.php';

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Неверный метод запроса');
}

// Определяем действие
$action = isset($_POST['action']) ? $_POST['action'] : '';

switch ($action) {
    case 'get_current_prices':
        getCurrentPrices();
        break;
        
    case 'get_price_history':
        getPriceHistory();
        break;
        
    case 'get_resource_price':
        getResourcePrice();
        break;
        
    default:
        jsonResponse(false, 'Неизвестное действие');
}

/**
 * Получение текущих рыночных цен всех ресурсов
 */
function getCurrentPrices() {
    global $db;
    
    try {
        // Получаем текущие рыночные цены всех ресурсов
        $query = "SELECT 
                    mp.resource_id, 
                    r.name as resource_name,
                    r.rarity,
                    r.base_price,
                    mp.price as current_price, 
                    mp.last_update,
                    ROUND((mp.price - r.base_price) / r.base_price * 100, 1) as price_change_percent
                  FROM market_prices mp
                  JOIN resources r ON mp.resource_id = r.id
                  ORDER BY r.rarity DESC, r.name";
        
        $result = $db->query($query);
        
        if (!$result) {
            throw new Exception('Ошибка при получении рыночных цен: ' . $db->error);
        }
        
        $prices = [];
        
        while ($row = $result->fetch_assoc()) {
            $prices[] = $row;
        }
        
        jsonResponse(true, '', ['prices' => $prices]);
    } catch (Exception $e) {
        jsonResponse(false, $e->getMessage());
    }
}

/**
 * Получение истории цен для конкретного ресурса
 */
function getPriceHistory() {
    global $db;
    
    try {
        // Получаем ID ресурса из запроса
        $resource_id = isset($_POST['resource_id']) ? (int)$_POST['resource_id'] : 0;
        $days = isset($_POST['days']) ? (int)$_POST['days'] : 30; // По умолчанию 30 дней
        
        if ($resource_id <= 0) {
            throw new Exception('Неверный ID ресурса');
        }
        
        // Ограничиваем количество дней для предотвращения слишком тяжёлых запросов
        $days = min(365, max(1, $days));
        
        // Определяем начальную дату
        $start_date = date('Y-m-d', strtotime("-$days days"));
        
        // Получаем историю цен
        $query = "SELECT 
                    resource_id, 
                    price, 
                    DATE(recorded_at) as date,
                    TIME(recorded_at) as time
                  FROM price_history
                  WHERE resource_id = ? AND recorded_at >= ?
                  ORDER BY recorded_at";
        
        $stmt = $db->prepare($query);
        $stmt->bind_param("is", $resource_id, $start_date);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$result) {
            throw new Exception('Ошибка при получении истории цен: ' . $stmt->error);
        }
        
        $history = [];
        
        while ($row = $result->fetch_assoc()) {
            $history[] = $row;
        }
        
        // Получаем информацию о ресурсе
        $resource_query = "SELECT name, rarity, base_price FROM resources WHERE id = ?";
        $resource_stmt = $db->prepare($resource_query);
        $resource_stmt->bind_param("i", $resource_id);
        $resource_stmt->execute();
        $resource_result = $resource_stmt->get_result();
        
        if (!$resource_result || $resource_result->num_rows === 0) {
            throw new Exception('Ресурс не найден');
        }
        
        $resource = $resource_result->fetch_assoc();
        
        jsonResponse(true, '', [
            'resource' => $resource,
            'history' => $history
        ]);
    } catch (Exception $e) {
        jsonResponse(false, $e->getMessage());
    }
}

/**
 * Получение текущей цены конкретного ресурса
 */
function getResourcePrice() {
    global $db;
    
    try {
        // Получаем ID ресурса из запроса
        $resource_id = isset($_POST['resource_id']) ? (int)$_POST['resource_id'] : 0;
        
        if ($resource_id <= 0) {
            throw new Exception('Неверный ID ресурса');
        }
        
        // Получаем текущую цену ресурса
        $query = "SELECT 
                    mp.resource_id, 
                    r.name as resource_name,
                    r.rarity,
                    r.base_price,
                    mp.price as current_price, 
                    mp.last_update,
                    ROUND((mp.price - r.base_price) / r.base_price * 100, 1) as price_change_percent
                  FROM market_prices mp
                  JOIN resources r ON mp.resource_id = r.id
                  WHERE mp.resource_id = ?";
        
        $stmt = $db->prepare($query);
        $stmt->bind_param("i", $resource_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$result || $result->num_rows === 0) {
            throw new Exception('Цена ресурса не найдена');
        }
        
        $price = $result->fetch_assoc();
        
        // Получаем последние изменения цены
        $history_query = "SELECT price, recorded_at
                          FROM price_history
                          WHERE resource_id = ?
                          ORDER BY recorded_at DESC
                          LIMIT 5";
        
        $history_stmt = $db->prepare($history_query);
        $history_stmt->bind_param("i", $resource_id);
        $history_stmt->execute();
        $history_result = $history_stmt->get_result();
        
        $price_history = [];
        
        while ($row = $history_result->fetch_assoc()) {
            $price_history[] = $row;
        }
        
        jsonResponse(true, '', [
            'price' => $price,
            'recent_history' => $price_history
        ]);
    } catch (Exception $e) {
        jsonResponse(false, $e->getMessage());
    }
}