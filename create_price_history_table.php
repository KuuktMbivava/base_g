<?php
/**
 * Скрипт для создания таблицы истории цен ресурсов
 * Ресурсная Империя
 */

// Включаем вывод ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключаем конфигурацию
require_once 'config.php';

echo "<pre>Начинаем создание таблиц для системы рыночных цен...\n";

// Создание таблицы текущих рыночных цен (если она еще не существует)
$market_prices_query = "CREATE TABLE IF NOT EXISTS `market_prices` (
    `resource_id` INT NOT NULL PRIMARY KEY,
    `price` INT NOT NULL,
    `last_update` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE CASCADE
)";

if ($db->query($market_prices_query)) {
    echo "Таблица market_prices успешно создана или уже существует!\n";
} else {
    echo "ОШИБКА при создании таблицы market_prices: " . $db->error . "\n";
}

// Создание таблицы истории цен для анализа трендов
$price_history_query = "CREATE TABLE IF NOT EXISTS `price_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `resource_id` INT NOT NULL,
    `price` INT NOT NULL,
    `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE CASCADE,
    INDEX `idx_resource_date` (`resource_id`, `recorded_at`)
)";

if ($db->query($price_history_query)) {
    echo "Таблица price_history успешно создана или уже существует!\n";
} else {
    echo "ОШИБКА при создании таблицы price_history: " . $db->error . "\n";
}

// Создание триггера для автоматического добавления записи в историю при изменении цены
$drop_trigger_query = "DROP TRIGGER IF EXISTS `market_price_update_history`";
if ($db->query($drop_trigger_query)) {
    echo "Предыдущий триггер market_price_update_history удален (если существовал).\n";
} else {
    echo "ОШИБКА при удалении триггера: " . $db->error . "\n";
}

$create_trigger_query = "
CREATE TRIGGER `market_price_update_history` 
AFTER UPDATE ON `market_prices` 
FOR EACH ROW 
BEGIN
    IF NEW.price != OLD.price THEN
        INSERT INTO `price_history` (resource_id, price) 
        VALUES (NEW.resource_id, NEW.price);
    END IF;
END;
";

if ($db->query($create_trigger_query)) {
    echo "Триггер market_price_update_history успешно создан!\n";
} else {
    echo "ОШИБКА при создании триггера: " . $db->error . "\n";
}

// Проверка, существуют ли таблицы
echo "\nПроверка созданных таблиц:\n";

$tables = ['market_prices', 'price_history'];
foreach ($tables as $table) {
    $check_query = "SHOW TABLES LIKE '$table'";
    $result = $db->query($check_query);
    
    if ($result->num_rows > 0) {
        echo "- Таблица $table существует.\n";
    } else {
        echo "- ОШИБКА: Таблица $table НЕ существует!\n";
    }
}

// Проверка триггера
$check_trigger_query = "SHOW TRIGGERS WHERE `Trigger` = 'market_price_update_history'";
$result = $db->query($check_trigger_query);

if ($result->num_rows > 0) {
    echo "- Триггер market_price_update_history существует.\n";
} else {
    echo "- ОШИБКА: Триггер market_price_update_history НЕ существует!\n";
}

// Инициализация начальных цен на основе базовых цен ресурсов
echo "\nИнициализация начальных рыночных цен...\n";

$init_prices_query = "
    INSERT INTO market_prices (resource_id, price, last_update)
    SELECT id, base_price, NOW() FROM resources
    ON DUPLICATE KEY UPDATE price = resources.base_price, last_update = NOW()
";

if ($db->query($init_prices_query)) {
    echo "Начальные рыночные цены успешно инициализированы!\n";
    
    // Создаем первые записи в истории цен
    $init_history_query = "
        INSERT INTO price_history (resource_id, price)
        SELECT resource_id, price FROM market_prices
    ";
    
    if ($db->query($init_history_query)) {
        echo "Первые записи истории цен успешно созданы!\n";
    } else {
        echo "ОШИБКА при создании первых записей истории цен: " . $db->error . "\n";
    }
} else {
    echo "ОШИБКА при инициализации рыночных цен: " . $db->error . "\n";
}

echo "\nПроцесс создания таблиц для системы рыночных цен завершен.\n</pre>";

// Добавление кнопки возврата
echo '<p><a href="index.html">Вернуться на главную</a></p>';