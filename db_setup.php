<?php
/**
 * Скрипт для создания и настройки таблиц БД (с отладкой)
 * Ресурсная Империя
 */

// Включаем вывод ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключаем конфигурацию
require_once 'config.php';

echo "<pre>Начинаем создание таблиц...\n";

// Создание таблиц базы данных по одной с выводом результата после каждой
$tables = [
    // Таблица пользователей
    "users" => "CREATE TABLE IF NOT EXISTS `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `username` VARCHAR(64) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255) NOT NULL,
        `gold` INT DEFAULT 100,
        `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `last_login` TIMESTAMP NULL
    )",
    
    // Таблица токенов авторизации
    "auth_tokens" => "CREATE TABLE IF NOT EXISTS `auth_tokens` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `token` VARCHAR(255) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `expires_at` DATETIME NOT NULL,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    )",
    
    // Таблица локаций
    "locations" => "CREATE TABLE IF NOT EXISTS `locations` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(64) NOT NULL,
        `description` TEXT NOT NULL,
        `image` VARCHAR(255) NOT NULL,
        `difficulty` INT DEFAULT 1,
        `energy_cost` INT DEFAULT 5
    )",
    
    // Таблица ресурсов
    "resources" => "CREATE TABLE IF NOT EXISTS `resources` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(64) NOT NULL,
        `description` TEXT NOT NULL,
        `base_price` INT NOT NULL,
        `rarity` ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common'
    )",
    
    // Таблица связи локаций и ресурсов
    "location_resources" => "CREATE TABLE IF NOT EXISTS `location_resources` (
        `location_id` INT NOT NULL,
        `resource_id` INT NOT NULL,
        `probability` FLOAT DEFAULT 0.5,
        `min_amount` INT DEFAULT 1,
        `max_amount` INT DEFAULT 3,
        PRIMARY KEY (`location_id`, `resource_id`),
        FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE CASCADE
    )",
    
    // Таблица инвентаря пользователей
    "inventory" => "CREATE TABLE IF NOT EXISTS `inventory` (
        `user_id` INT NOT NULL,
        `resource_id` INT NOT NULL,
        `amount` INT NOT NULL DEFAULT 1,
        PRIMARY KEY (`user_id`, `resource_id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE CASCADE
    )",
    
    // Таблица аукционов
    "auctions" => "CREATE TABLE IF NOT EXISTS `auctions` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `seller_id` INT NOT NULL,
        `resource_id` INT NOT NULL,
        `quantity` INT NOT NULL,
        `starting_price` INT NOT NULL,
        `current_price` INT NOT NULL,
        `current_bidder_id` INT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `end_time` DATETIME NOT NULL,
        `status` ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
        FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`current_bidder_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
    )",
    
    // Таблица ставок на аукционах
    "bids" => "CREATE TABLE IF NOT EXISTS `bids` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `auction_id` INT NOT NULL,
        `user_id` INT NOT NULL,
        `bid_amount` INT NOT NULL,
        `bid_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    )",
    
    // Таблица рыночных цен
    "market_prices" => "CREATE TABLE IF NOT EXISTS `market_prices` (
        `resource_id` INT NOT NULL,
        `price` INT NOT NULL,
        `last_update` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`resource_id`),
        FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE CASCADE
    )",
    
    // Таблица игровых достижений
    "achievements" => "CREATE TABLE IF NOT EXISTS `achievements` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(64) NOT NULL,
        `description` TEXT NOT NULL,
        `image` VARCHAR(255) NULL,
        `requirements` TEXT NOT NULL
    )",
    
    // Таблица достижений пользователей
    "user_achievements" => "CREATE TABLE IF NOT EXISTS `user_achievements` (
        `user_id` INT NOT NULL,
        `achievement_id` INT NOT NULL,
        `unlocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`user_id`, `achievement_id`),
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE CASCADE
    )"
];

// Выполнение запросов для создания таблиц
foreach ($tables as $table_name => $query) {
    echo "Создание таблицы '$table_name'... ";
    if ($db->query($query)) {
        echo "Успешно!\n";
    } else {
        echo "ОШИБКА: " . $db->error . "\n";
    }
}

// Проверяем, нужно ли заполнять таблицы начальными данными
echo "\nПроверка наличия данных в таблице локаций...\n";
$check_query = "SELECT COUNT(*) as count FROM locations";
$result = $db->query($check_query);

if (!$result) {
    echo "ОШИБКА при проверке таблицы локаций: " . $db->error . "\n";
} else {
    $row = $result->fetch_assoc();
    echo "Найдено записей: " . $row['count'] . "\n";

    // Если таблицы пусты, заполняем их начальными данными
    if ($row['count'] == 0) {
        echo "\nЗаполнение таблиц начальными данными...\n";
        
        echo "Заполнение локаций... ";
        
        // Начальные локации
        $locations = [
            [
                'name' => 'Зачарованный лес',
                'description' => 'Древний лес, полный таинственных существ и редких ресурсов. Здесь можно добыть ценную древесину, травы и магические кристаллы.',
                'image' => 'https://cdnjs.cloudflare.com/ajax/libs/simple-backgrounds/1.0.0/forest.jpg',
                'difficulty' => 1,
                'energy_cost' => 5
            ],
            // ... другие локации
        ];
        
        // Вставка локаций
        $location_query = "INSERT INTO locations (name, description, image, difficulty, energy_cost) VALUES (?, ?, ?, ?, ?)";
        $location_stmt = $db->prepare($location_query);
        
        if (!$location_stmt) {
            echo "ОШИБКА при подготовке запроса: " . $db->error . "\n";
        } else {
            $success = true;
            foreach ($locations as $location) {
                if (!$location_stmt->bind_param("sssii", 
                    $location['name'], 
                    $location['description'], 
                    $location['image'], 
                    $location['difficulty'], 
                    $location['energy_cost']
                )) {
                    $success = false;
                    echo "ОШИБКА при привязке параметров: " . $location_stmt->error . "\n";
                    break;
                }
                
                if (!$location_stmt->execute()) {
                    $success = false;
                    echo "ОШИБКА при выполнении запроса: " . $location_stmt->error . "\n";
                    break;
                }
            }
            
            if ($success) {
                echo "Успешно!\n";
            }
        }
        
        // Аналогично для других таблиц...
    }
}

echo "\nПроцесс создания таблиц завершен.\n</pre>";