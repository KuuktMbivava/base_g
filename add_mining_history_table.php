<?php
/**
 * Скрипт для добавления таблицы истории добычи ресурсов
 * Ресурсная Империя
 */

// Включаем вывод ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключаем конфигурацию
require_once 'config.php';

echo "<pre>Начинаем создание таблицы истории добычи ресурсов...\n";

// SQL-запрос для создания таблицы
$query = "CREATE TABLE IF NOT EXISTS `mining_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `location_id` INT NOT NULL,
    `resource_id` INT NOT NULL,
    `amount` INT DEFAULT 0,
    `success` TINYINT(1) DEFAULT 0,
    `mining_time` INT DEFAULT 0,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE CASCADE
)";

// Выполняем запрос
if ($db->query($query)) {
    echo "Таблица mining_history успешно создана!\n";
} else {
    echo "ОШИБКА при создании таблицы: " . $db->error . "\n";
}

// Проверяем, существует ли таблица
$check_query = "SHOW TABLES LIKE 'mining_history'";
$result = $db->query($check_query);

if ($result->num_rows > 0) {
    echo "Проверка: таблица mining_history существует в базе данных.\n";
} else {
    echo "Проверка: таблица mining_history НЕ существует в базе данных!\n";
}

echo "\nПроцесс создания таблицы завершен.\n</pre>";