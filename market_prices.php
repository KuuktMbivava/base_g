<?php
/**
 * Обновление рыночных цен
 * Ресурсная Империя
 * 
 * Этот скрипт вызывается из cron для автоматического обновления цен на ресурсы
 * На основе анализа добычи ресурсов и активности аукционов
 */

// Включаем вывод ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключаем конфигурацию
require_once 'config.php';

// Определяем константы для расчета цен
define('SUPPLY_FACTOR', 0.6); // Фактор влияния предложения на цену
define('DEMAND_FACTOR', 0.4); // Фактор влияния спроса на цену
define('MAX_PRICE_CHANGE', 0.2); // Максимальное изменение цены за один раз (в процентах)
define('PRICE_ELASTICITY', 0.3); // Эластичность цены (влияние факторов)
define('BASE_PRICE_PULL', 0.1); // Сила притяжения к базовой цене
define('RANDOM_FACTOR_MAGNITUDE', 0.05); // Сила случайных колебаний

// Логирование сообщений
function logMessage($message) {
    $date = date('Y-m-d H:i:s');
    echo "[$date] $message\n";
}

// Основной процесс обновления цен
function updateMarketPrices() {
    global $db;
    
    logMessage("Запуск обновления рыночных цен");

    try {
        // Проверяем существование таблиц
        $tables_check = [
            'market_prices' => "SHOW TABLES LIKE 'market_prices'",
            'price_history' => "SHOW TABLES LIKE 'price_history'",
            'mining_history' => "SHOW TABLES LIKE 'mining_history'",
            'auctions' => "SHOW TABLES LIKE 'auctions'"
        ];
        
        foreach ($tables_check as $table => $check_query) {
            $result = $db->query($check_query);
            if ($result->num_rows === 0) {
                throw new Exception("Таблица '$table' не существует в базе данных");
            }
        }
        
        // Получаем данные о добыче ресурсов
        $mining_data = getMiningData();
        logMessage("Получены данные о добыче: " . count($mining_data) . " ресурсов");
        
        // Получаем данные об аукционах
        $auction_data = getAuctionData();
        logMessage("Получены данные об аукционах: " . count($auction_data) . " ресурсов");
        
        // Получаем все ресурсы
        $resources = getAllResources();
        logMessage("Найдено ресурсов: " . count($resources));
        
        // Обновляем цены для каждого ресурса
        foreach ($resources as $resource_id => $resource) {
            updateResourcePrice($resource, $mining_data[$resource_id] ?? [], $auction_data[$resource_id] ?? []);
        }
        
        logMessage("Обновление рыночных цен завершено успешно");
    } catch (Exception $e) {
        logMessage("ОШИБКА: " . $e->getMessage());
    }
}

/**
 * Получение данных о добыче ресурсов за последние сутки
 */
function getMiningData() {
    global $db;
    
    $query = "SELECT 
                resource_id,
                COUNT(*) as attempts,
                SUM(success) as successful_attempts,
                SUM(CASE WHEN success = 1 THEN amount ELSE 0 END) as total_mined
              FROM mining_history 
              WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
              GROUP BY resource_id";
    
    $result = $db->query($query);
    
    if (!$result) {
        throw new Exception("Ошибка при получении данных о добыче: " . $db->error);
    }
    
    $mining_data = [];
    
    while ($row = $result->fetch_assoc()) {
        $mining_data[$row['resource_id']] = $row;
    }
    
    return $mining_data;
}

/**
 * Получение данных об аукционах за последние сутки
 */
function getAuctionData() {
    global $db;
    
    $query = "SELECT 
                resource_id,
                COUNT(*) as auctions_count,
                AVG(current_price) as avg_price,
                COUNT(DISTINCT current_bidder_id) as unique_bidders,
                SUM(CASE WHEN current_bidder_id IS NOT NULL THEN 1 ELSE 0 END) as sold_count,
                SUM(CASE WHEN current_bidder_id IS NULL THEN 1 ELSE 0 END) as unsold_count
              FROM auctions
              WHERE end_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                AND status = 'completed'
              GROUP BY resource_id";
    
    $result = $db->query($query);
    
    if (!$result) {
        throw new Exception("Ошибка при получении данных об аукционах: " . $db->error);
    }
    
    $auction_data = [];
    
    while ($row = $result->fetch_assoc()) {
        $auction_data[$row['resource_id']] = $row;
    }
    
    return $auction_data;
}

/**
 * Получение всех ресурсов
 */
function getAllResources() {
    global $db;
    
    $query = "SELECT r.id, r.name, r.base_price, r.rarity, mp.price as current_price
              FROM resources r
              LEFT JOIN market_prices mp ON r.id = mp.resource_id";
    
    $result = $db->query($query);
    
    if (!$result) {
        throw new Exception("Ошибка при получении списка ресурсов: " . $db->error);
    }
    
    $resources = [];
    
    while ($row = $result->fetch_assoc()) {
        // Если текущая цена не установлена, используем базовую
        if ($row['current_price'] === null) {
            $row['current_price'] = $row['base_price'];
        }
        
        $resources[$row['id']] = $row;
    }
    
    return $resources;
}

/**
 * Обновление цены на конкретный ресурс
 */
function updateResourcePrice($resource, $mining_data, $auction_data) {
    global $db;
    
    $resource_id = $resource['id'];
    $resource_name = $resource['name'];
    $base_price = $resource['base_price'];
    $current_price = $resource['current_price'];
    
    logMessage("Обработка ресурса #{$resource_id}: {$resource_name}");
    
    // Расчет новой цены
    $new_price = calculateNewPrice($resource, $mining_data, $auction_data);
    
    // Округляем до целого числа
    $new_price = round($new_price);
    
    // Проверяем минимальное значение
    $new_price = max(1, $new_price);
    
    // Логируем изменение цены
    $percent_change = (($new_price - $current_price) / $current_price) * 100;
    $change_direction = $percent_change >= 0 ? "+" : "";
    
    // Форматируем процент изменения с двумя знаками после запятой без использования :
    $formatted_percent = number_format($percent_change, 2);
    logMessage("  {$resource_name}: {$current_price} → {$new_price} ({$change_direction}{$formatted_percent}%)");
    
    // Обновляем цену в базе данных
    $update_query = "INSERT INTO market_prices (resource_id, price, last_update) 
                     VALUES (?, ?, NOW()) 
                     ON DUPLICATE KEY UPDATE price = ?, last_update = NOW()";
    
    $update_stmt = $db->prepare($update_query);
    
    if (!$update_stmt) {
        logMessage("  ОШИБКА при подготовке запроса: " . $db->error);
        return;
    }
    
    $update_stmt->bind_param("iii", $resource_id, $new_price, $new_price);
    
    if (!$update_stmt->execute()) {
        logMessage("  ОШИБКА при обновлении цены: " . $update_stmt->error);
        return;
    }
    
    logMessage("  Цена успешно обновлена");
}

/**
 * Расчет новой цены на основе различных факторов
 */
function calculateNewPrice($resource, $mining_data, $auction_data) {
    $base_price = $resource['base_price'];
    $current_price = $resource['current_price'];
    $rarity = $resource['rarity'];
    
    // Фактор редкости
    $rarity_factor = getRarityFactor($rarity);
    
    // Фактор добычи (предложение)
    $mining_factor = calculateMiningFactor($mining_data, $rarity);
    
    // Фактор аукционов (спрос)
    $auction_factor = calculateAuctionFactor($auction_data);
    
    // Фактор случайности
    $random_factor = (mt_rand(-100, 100) / 100) * RANDOM_FACTOR_MAGNITUDE;
    
    // Рассчитываем влияние предложения и спроса
    $supply_influence = $mining_factor * SUPPLY_FACTOR;
    $demand_influence = $auction_factor * DEMAND_FACTOR;
    
    // Комбинированный фактор рынка
    $market_factor = $supply_influence + $demand_influence;
    
    // Возвращение к базовой цене
    $base_pull = ($base_price - $current_price) / $base_price * BASE_PRICE_PULL;
    
    // Расчет процентного изменения цены
    $price_change_percent = $market_factor * PRICE_ELASTICITY + $base_pull + $random_factor * $rarity_factor;
    
    // Ограничиваем максимальное изменение
    $price_change_percent = max(-MAX_PRICE_CHANGE, min(MAX_PRICE_CHANGE, $price_change_percent));
    
    // Новая цена
    $new_price = $current_price * (1 + $price_change_percent);
    
    // Ограничиваем пределы изменения от базовой цены
    $min_price = $base_price * 0.5;
    $max_price = $base_price * 3;
    
    return max($min_price, min($max_price, $new_price));
}

/**
 * Расчет фактора рыночного влияния на основе добычи
 */
function calculateMiningFactor($mining_data, $rarity) {
    // Если нет данных о добыче, возвращаем нейтральное значение
    if (empty($mining_data)) {
        return 0.02; // Небольшой рост цены при отсутствии добычи
    }
    
    $total_mined = $mining_data['total_mined'] ?? 0;
    
    // Расчет множителя в зависимости от редкости
    $rarity_multiplier = 1;
    switch ($rarity) {
        case 'common':
            $rarity_multiplier = 0.05;
            break;
        case 'uncommon':
            $rarity_multiplier = 0.1;
            break;
        case 'rare':
            $rarity_multiplier = 0.2;
            break;
        case 'epic':
            $rarity_multiplier = 0.3;
            break;
        case 'legendary':
            $rarity_multiplier = 0.5;
            break;
    }
    
    // Высокая добыча = отрицательное влияние на цену
    // Чем больше добыто, тем больше падает цена
    $mining_factor = -$total_mined * $rarity_multiplier / 100;
    
    // Ограничиваем фактор
    return max(-0.5, min(0.3, $mining_factor));
}

/**
 * Расчет фактора рыночного влияния на основе аукционов
 */
function calculateAuctionFactor($auction_data) {
    // Если нет данных об аукционах, возвращаем нейтральное значение
    if (empty($auction_data)) {
        return 0;
    }
    
    $auctions_count = $auction_data['auctions_count'] ?? 0;
    $sold_count = $auction_data['sold_count'] ?? 0;
    $unsold_count = $auction_data['unsold_count'] ?? 0;
    $unique_bidders = $auction_data['unique_bidders'] ?? 0;
    
    // Коэффициент продаж (высокий = высокий спрос)
    $sales_ratio = $auctions_count > 0 ? $sold_count / $auctions_count : 0;
    
    // Влияние количества аукционов
    $auction_count_factor = 0.02 * $auctions_count;
    
    // Влияние соотношения продаж
    $sales_factor = $sales_ratio * 0.3;
    
    // Влияние уникальных покупателей
    $bidders_factor = $unique_bidders * 0.05;
    
    // Итоговый фактор аукционов
    $auction_factor = $sales_factor + $bidders_factor - $auction_count_factor;
    
    // Ограничиваем фактор
    return max(-0.3, min(0.5, $auction_factor));
}

/**
 * Получение множителя редкости
 */
function getRarityFactor($rarity) {
    switch ($rarity) {
        case 'common':
            return 1.0;
        case 'uncommon':
            return 1.5;
        case 'rare':
            return 2.0;
        case 'epic':
            return 2.5;
        case 'legendary':
            return 3.0;
        default:
            return 1.0;
    }
}

// Запуск обновления рыночных цен
updateMarketPrices();