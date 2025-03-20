<?php
/**
 * Скрипт для исправления структуры таблицы mining_history
 * Ресурсная Империя
 */

// Включаем вывод ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключаем конфигурацию
require_once 'config.php';

echo "<h1>Исправление структуры таблицы mining_history</h1>";

// Шаг 1: Проверяем существование таблицы
echo "<h2>Шаг 1: Проверка существования таблицы</h2>";
$table_exists_query = "SHOW TABLES LIKE 'mining_history'";
$table_exists_result = $db->query($table_exists_query);

if ($table_exists_result && $table_exists_result->num_rows > 0) {
    echo "<p style='color: green;'>✅ Таблица mining_history существует.</p>";
    
    // Шаг 2: Проверяем текущую структуру
    echo "<h2>Шаг 2: Текущая структура таблицы</h2>";
    $structure_query = "DESCRIBE mining_history";
    $structure_result = $db->query($structure_query);
    
    if ($structure_result) {
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr style='background-color: #f2f2f2;'><th>Поле</th><th>Тип</th><th>Null</th><th>Ключ</th><th>По умолчанию</th><th>Дополнительно</th></tr>";
        
        $existing_fields = [];
        
        while ($row = $structure_result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($row['Field']) . "</td>";
            echo "<td>" . htmlspecialchars($row['Type']) . "</td>";
            echo "<td>" . htmlspecialchars($row['Null']) . "</td>";
            echo "<td>" . htmlspecialchars($row['Key']) . "</td>";
            echo "<td>" . (is_null($row['Default']) ? '<em>NULL</em>' : htmlspecialchars($row['Default'])) . "</td>";
            echo "<td>" . htmlspecialchars($row['Extra']) . "</td>";
            echo "</tr>";
            
            $existing_fields[$row['Field']] = [
                'Type' => $row['Type'],
                'Null' => $row['Null'],
                'Key' => $row['Key'],
                'Default' => $row['Default'],
                'Extra' => $row['Extra']
            ];
        }
        
        echo "</table>";
        
        // Шаг 3: Определяем требуемую структуру
        echo "<h2>Шаг 3: Требуемая структура таблицы</h2>";
        
        $required_fields = [
            'id' => [
                'Type' => 'int',
                'Null' => 'NO',
                'Key' => 'PRI',
                'Default' => null,
                'Extra' => 'auto_increment'
            ],
            'user_id' => [
                'Type' => 'int',
                'Null' => 'NO',
                'Key' => 'MUL',
                'Default' => null,
                'Extra' => ''
            ],
            'location_id' => [
                'Type' => 'int',
                'Null' => 'NO',
                'Key' => 'MUL',
                'Default' => null,
                'Extra' => ''
            ],
            'resource_id' => [
                'Type' => 'int',
                'Null' => 'NO',
                'Key' => 'MUL',
                'Default' => null,
                'Extra' => ''
            ],
            'amount' => [
                'Type' => 'int',
                'Null' => 'YES',
                'Key' => '',
                'Default' => '0',
                'Extra' => ''
            ],
            'success' => [
                'Type' => 'tinyint(1)',
                'Null' => 'YES',
                'Key' => '',
                'Default' => '0',
                'Extra' => ''
            ],
            'mining_time' => [
                'Type' => 'int',
                'Null' => 'YES',
                'Key' => '',
                'Default' => '0',
                'Extra' => ''
            ],
            'timestamp' => [
                'Type' => 'timestamp',
                'Null' => 'YES',
                'Key' => '',
                'Default' => 'CURRENT_TIMESTAMP',
                'Extra' => ''
            ]
        ];
        
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr style='background-color: #f2f2f2;'><th>Поле</th><th>Тип</th><th>Null</th><th>Ключ</th><th>По умолчанию</th><th>Дополнительно</th></tr>";
        
        foreach ($required_fields as $field => $specs) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($field) . "</td>";
            echo "<td>" . htmlspecialchars($specs['Type']) . "</td>";
            echo "<td>" . htmlspecialchars($specs['Null']) . "</td>";
            echo "<td>" . htmlspecialchars($specs['Key']) . "</td>";
            echo "<td>" . (is_null($specs['Default']) ? '<em>NULL</em>' : htmlspecialchars($specs['Default'])) . "</td>";
            echo "<td>" . htmlspecialchars($specs['Extra']) . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        
        // Шаг 4: Сравниваем и исправляем структуру
        echo "<h2>Шаг 4: Анализ и исправление расхождений</h2>";
        
        // Проверяем отсутствующие поля
        $missing_fields = array_diff(array_keys($required_fields), array_keys($existing_fields));
        
        if (!empty($missing_fields)) {
            echo "<h3>Отсутствующие поля</h3>";
            echo "<ul>";
            
            foreach ($missing_fields as $field) {
                echo "<li><strong>{$field}</strong> - Необходимо добавить</li>";
            }
            
            echo "</ul>";
            
            if (isset($_POST['fix_missing_fields'])) {
                echo "<h4>Процесс добавления отсутствующих полей:</h4>";
                
                foreach ($missing_fields as $field) {
                    $specs = $required_fields[$field];
                    $alter_query = "ALTER TABLE mining_history ADD `{$field}`";
                    
                    // Добавляем тип
                    $alter_query .= " {$specs['Type']}";
                    
                    // Добавляем NULL/NOT NULL
                    if ($specs['Null'] === 'NO') {
                        $alter_query .= " NOT NULL";
                    }
                    
                    // Добавляем DEFAULT
                    if (!is_null($specs['Default'])) {
                        if ($specs['Default'] === 'CURRENT_TIMESTAMP') {
                            $alter_query .= " DEFAULT CURRENT_TIMESTAMP";
                        } else {
                            $alter_query .= " DEFAULT '{$specs['Default']}'";
                        }
                    }
                    
                    // Добавляем AUTO_INCREMENT
                    if ($specs['Extra'] === 'auto_increment') {
                        $alter_query .= " AUTO_INCREMENT";
                    }
                    
                    // Добавляем PRIMARY KEY
                    if ($specs['Key'] === 'PRI') {
                        $alter_query .= " PRIMARY KEY";
                    }
                    
                    // Выполняем запрос
                    echo "<p>Выполнение запроса: <code>{$alter_query}</code> ... ";
                    
                    if ($db->query($alter_query)) {
                        echo "<span style='color: green;'>Успешно</span></p>";
                    } else {
                        echo "<span style='color: red;'>Ошибка: " . $db->error . "</span></p>";
                    }
                }
                
                echo "<p style='color: green;'>✅ Процесс добавления полей завершен.</p>";
                echo "<p><a href='fix-mining-history-structure.php'>Обновить страницу</a> для проверки результатов.</p>";
            } else {
                echo "<form method='post'>";
                echo "<input type='submit' name='fix_missing_fields' value='Добавить отсутствующие поля' style='background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;'>";
                echo "</form>";
            }
        } else {
            echo "<p style='color: green;'>✅ Все необходимые поля присутствуют.</p>";
        }
        
        // Проверяем отличия в существующих полях
        $fields_to_modify = [];
        
        foreach ($existing_fields as $field => $existing_specs) {
            if (isset($required_fields[$field])) {
                $required_specs = $required_fields[$field];
                $differences = [];
                
                // Проверяем тип поля (с учетом возможных вариаций)
                if (stripos($existing_specs['Type'], $required_specs['Type']) === false) {
                    $differences[] = "Тип поля: '{$existing_specs['Type']}' должен быть '{$required_specs['Type']}'";
                }
                
                // Проверяем NULL/NOT NULL
                if ($existing_specs['Null'] !== $required_specs['Null']) {
                    $differences[] = "NULL: '{$existing_specs['Null']}' должно быть '{$required_specs['Null']}'";
                }
                
                // Проверяем AUTO_INCREMENT
                if ($required_specs['Extra'] === 'auto_increment' && stripos($existing_specs['Extra'], 'auto_increment') === false) {
                    $differences[] = "AUTO_INCREMENT отсутствует";
                }
                
                if (!empty($differences)) {
                    $fields_to_modify[$field] = $differences;
                }
            }
        }
        
        if (!empty($fields_to_modify)) {
            echo "<h3>Поля с неправильной структурой</h3>";
            echo "<ul>";
            
            foreach ($fields_to_modify as $field => $differences) {
                echo "<li><strong>{$field}</strong>:<ul>";
                foreach ($differences as $diff) {
                    echo "<li>{$diff}</li>";
                }
                echo "</ul></li>";
            }
            
            echo "</ul>";
            
            if (isset($_POST['fix_field_structure'])) {
                echo "<h4>Процесс исправления структуры полей:</h4>";
                
                foreach ($fields_to_modify as $field => $differences) {
                    $specs = $required_fields[$field];
                    
                    // Формируем запрос на изменение поля
                    $alter_query = "ALTER TABLE mining_history MODIFY COLUMN `{$field}`";
                    
                    // Добавляем тип
                    $alter_query .= " {$specs['Type']}";
                    
                    // Добавляем NULL/NOT NULL
                    if ($specs['Null'] === 'NO') {
                        $alter_query .= " NOT NULL";
                    } else {
                        $alter_query .= " NULL";
                    }
                    
                    // Добавляем DEFAULT
                    if (!is_null($specs['Default'])) {
                        if ($specs['Default'] === 'CURRENT_TIMESTAMP') {
                            $alter_query .= " DEFAULT CURRENT_TIMESTAMP";
                        } else {
                            $alter_query .= " DEFAULT '{$specs['Default']}'";
                        }
                    }
                    
                    // Добавляем AUTO_INCREMENT
                    if ($specs['Extra'] === 'auto_increment') {
                        $alter_query .= " AUTO_INCREMENT";
                    }
                    
                    // Выполняем запрос
                    echo "<p>Выполнение запроса: <code>{$alter_query}</code> ... ";
                    
                    if ($db->query($alter_query)) {
                        echo "<span style='color: green;'>Успешно</span></p>";
                    } else {
                        echo "<span style='color: red;'>Ошибка: " . $db->error . "</span></p>";
                    }
                }
                
                echo "<p style='color: green;'>✅ Процесс исправления структуры полей завершен.</p>";
                echo "<p><a href='fix-mining-history-structure.php'>Обновить страницу</a> для проверки результатов.</p>";
            } else {
                echo "<form method='post'>";
                echo "<input type='submit' name='fix_field_structure' value='Исправить структуру полей' style='background-color: #2196F3; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;'>";
                echo "</form>";
            }
        } else {
            echo "<p style='color: green;'>✅ Структура всех существующих полей корректна.</p>";
        }
        
        // Шаг 5: Добавление внешних ключей, если они отсутствуют
        echo "<h2>Шаг 5: Проверка внешних ключей</h2>";
        
        // Получаем информацию о внешних ключах
        $fk_query = "SELECT
                        CONSTRAINT_NAME,
                        COLUMN_NAME,
                        REFERENCED_TABLE_NAME,
                        REFERENCED_COLUMN_NAME
                    FROM
                        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                    WHERE
                        TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'mining_history'
                        AND REFERENCED_TABLE_NAME IS NOT NULL";
        
        $fk_result = $db->query($fk_query);
        
        $existing_fks = [];
        
        if ($fk_result) {
            while ($row = $fk_result->fetch_assoc()) {
                $existing_fks[$row['COLUMN_NAME']] = [
                    'name' => $row['CONSTRAINT_NAME'],
                    'referenced_table' => $row['REFERENCED_TABLE_NAME'],
                    'referenced_column' => $row['REFERENCED_COLUMN_NAME']
                ];
            }
        }
        
        // Определяем требуемые внешние ключи
        $required_fks = [
            'user_id' => [
                'referenced_table' => 'users',
                'referenced_column' => 'id'
            ],
            'location_id' => [
                'referenced_table' => 'locations',
                'referenced_column' => 'id'
            ],
            'resource_id' => [
                'referenced_table' => 'resources',
                'referenced_column' => 'id'
            ]
        ];
        
        // Сравниваем и находим отсутствующие внешние ключи
        $missing_fks = [];
        
        foreach ($required_fks as $column => $fk_details) {
            if (!isset($existing_fks[$column])) {
                $missing_fks[$column] = $fk_details;
            }
        }
        
        if (!empty($missing_fks)) {
            echo "<p>Обнаружены отсутствующие внешние ключи:</p>";
            echo "<ul>";
            
            foreach ($missing_fks as $column => $fk_details) {
                echo "<li><strong>{$column}</strong> -> {$fk_details['referenced_table']}({$fk_details['referenced_column']})</li>";
            }
            
            echo "</ul>";
            
            if (isset($_POST['fix_foreign_keys'])) {
                echo "<h4>Процесс добавления внешних ключей:</h4>";
                
                foreach ($missing_fks as $column => $fk_details) {
                    $alter_query = "ALTER TABLE mining_history
                                   ADD CONSTRAINT `fk_mining_{$column}`
                                   FOREIGN KEY (`{$column}`)
                                   REFERENCES `{$fk_details['referenced_table']}`(`{$fk_details['referenced_column']}`)
                                   ON DELETE CASCADE";
                    
                    // Выполняем запрос
                    echo "<p>Выполнение запроса: <code>{$alter_query}</code> ... ";
                    
                    if ($db->query($alter_query)) {
                        echo "<span style='color: green;'>Успешно</span></p>";
                    } else {
                        echo "<span style='color: red;'>Ошибка: " . $db->error . "</span></p>";
                    }
                }
                
                echo "<p style='color: green;'>✅ Процесс добавления внешних ключей завершен.</p>";
                echo "<p><a href='fix-mining-history-structure.php'>Обновить страницу</a> для проверки результатов.</p>";
            } else {
                echo "<form method='post'>";
                echo "<input type='submit' name='fix_foreign_keys' value='Добавить внешние ключи' style='background-color: #FF9800; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;'>";
                echo "</form>";
            }
        } else {
            echo "<p style='color: green;'>✅ Все необходимые внешние ключи присутствуют.</p>";
        }
        
        // Шаг 6: Добавление индексов, если они отсутствуют
        echo "<h2>Шаг 6: Проверка индексов</h2>";
        
        // Получаем информацию об индексах
        $index_query = "SHOW INDEX FROM mining_history";
        $index_result = $db->query($index_query);
        
        $existing_indexes = [];
        
        if ($index_result) {
            while ($row = $index_result->fetch_assoc()) {
                $column_name = $row['Column_name'];
                $index_name = $row['Key_name'];
                
                if (!isset($existing_indexes[$column_name])) {
                    $existing_indexes[$column_name] = [];
                }
                
                $existing_indexes[$column_name][] = $index_name;
            }
        }
        
        // Определяем требуемые индексы (кроме тех, что уже будут созданы с внешними ключами)
        $required_indexes = [
            'timestamp' => 'idx_mining_timestamp',
            'success' => 'idx_mining_success'
        ];
        
        // Сравниваем и находим отсутствующие индексы
        $missing_indexes = [];
        
        foreach ($required_indexes as $column => $index_name) {
            if (!isset($existing_indexes[$column]) || !in_array($index_name, $existing_indexes[$column])) {
                $missing_indexes[$column] = $index_name;
            }
        }
        
        if (!empty($missing_indexes)) {
            echo "<p>Обнаружены отсутствующие индексы:</p>";
            echo "<ul>";
            
            foreach ($missing_indexes as $column => $index_name) {
                echo "<li><strong>{$index_name}</strong> для поля {$column}</li>";
            }
            
            echo "</ul>";
            
            if (isset($_POST['fix_indexes'])) {
                echo "<h4>Процесс добавления индексов:</h4>";
                
                foreach ($missing_indexes as $column => $index_name) {
                    $alter_query = "ALTER TABLE mining_history
                                   ADD INDEX `{$index_name}` (`{$column}`)";
                    
                    // Выполняем запрос
                    echo "<p>Выполнение запроса: <code>{$alter_query}</code> ... ";
                    
                    if ($db->query($alter_query)) {
                        echo "<span style='color: green;'>Успешно</span></p>";
                    } else {
                        echo "<span style='color: red;'>Ошибка: " . $db->error . "</span></p>";
                    }
                }
                
                echo "<p style='color: green;'>✅ Процесс добавления индексов завершен.</p>";
                echo "<p><a href='fix-mining-history-structure.php'>Обновить страницу</a> для проверки результатов.</p>";
            } else {
                echo "<form method='post'>";
                echo "<input type='submit' name='fix_indexes' value='Добавить индексы' style='background-color: #9C27B0; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;'>";
                echo "</form>";
            }
        } else {
            echo "<p style='color: green;'>✅ Все необходимые индексы присутствуют.</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Ошибка при получении структуры таблицы: " . $db->error . "</p>";
    }
} else {
    echo "<p style='color: red;'>❌ Таблица mining_history не существует в базе данных!</p>";
    
    // Предлагаем создать таблицу
    if (isset($_POST['create_table'])) {
        // SQL-запрос для создания таблицы с правильной структурой
        $create_table_query = "CREATE TABLE `mining_history` (
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
            FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON DELETE CASCADE,
            INDEX `idx_mining_timestamp` (`timestamp`),
            INDEX `idx_mining_success` (`success`)
        )";
        
        echo "<p>Выполнение запроса: <code>{$create_table_query}</code> ... ";
        
        if ($db->query($create_table_query)) {
            echo "<span style='color: green;'>Успешно</span></p>";
            echo "<p style='color: green;'>✅ Таблица mining_history успешно создана.</p>";
            echo "<p><a href='fix-mining-history-structure.php'>Обновить страницу</a> для проверки результатов.</p>";
        } else {
            echo "<span style='color: red;'>Ошибка: " . $db->error . "</span></p>";
        }
    } else {
        echo "<form method='post'>";
        echo "<input type='submit' name='create_table' value='Создать таблицу mining_history' style='background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;'>";
        echo "</form>";
    }
}

// Шаг 7: Заключение и дополнительные возможности
echo "<h2>Шаг 7: Дополнительные возможности</h2>";

echo "<div style='display: flex; gap: 10px;'>";

// Кнопка для создания тестовой записи
echo "<form method='post'>";
echo "<input type='submit' name='add_test_record' value='Добавить тестовую запись' style='background-color: #2196F3; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;'>";
echo "</form>";

// Кнопка для очистки таблицы
echo "<form method='post' onsubmit='return confirm(\"Вы уверены, что хотите удалить все записи из таблицы?\")'>";
echo "<input type='submit' name='truncate_table' value='Очистить таблицу' style='background-color: #F44336; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;'>";
echo "</form>";

// Кнопка для проверки работы сценария статистики
echo "<form method='post'>";
echo "<input type='submit' name='test_stats' value='Проверить работу статистики' style='background-color: #FF9800; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;'>";
echo "</form>";

// Кнопка для возврата на главную
echo "<a href='index.html' style='background-color: #9E9E9E; color: white; padding: 10px 15px; border: none; border-radius: 4px; text-decoration: none; display: inline-block;'>На главную</a>";

echo "</div>";

// Обработка дополнительных действий
if (isset($_POST['add_test_record'])) {
    echo "<h3>Добавление тестовой записи</h3>";
    
    // Проверяем наличие необходимых таблиц и данных
    $check_query = "SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM locations) as locations_count,
        (SELECT COUNT(*) FROM resources) as resources_count";
    
    $check_result = $db->query($check_query);
    
    if ($check_result) {
        $check_row = $check_result->fetch_assoc();
        
        if ($check_row['users_count'] > 0 && $check_row['locations_count'] > 0 && $check_row['resources_count'] > 0) {
            // Находим первые доступные ID для вставки
            $user_id_query = "SELECT id FROM users LIMIT 1";
            $location_id_query = "SELECT id FROM locations LIMIT 1";
            $resource_id_query = "SELECT id FROM resources LIMIT 1";
            
            $user_id_result = $db->query($user_id_query);
            $location_id_result = $db->query($location_id_query);
            $resource_id_result = $db->query($resource_id_query);
            
            if ($user_id_result && $location_id_result && $resource_id_result) {
                $user_id = $user_id_result->fetch_assoc()['id'];
                $location_id = $location_id_result->fetch_assoc()['id'];
                $resource_id = $resource_id_result->fetch_assoc()['id'];
                
                // Добавляем тестовую запись
                $insert_query = "INSERT INTO mining_history (user_id, location_id, resource_id, amount, success, mining_time) 
                                VALUES ($user_id, $location_id, $resource_id, 5, 1, 30)";
                
                if ($db->query($insert_query)) {
                    echo "<p style='color: green;'>✅ Тестовая запись успешно добавлена.</p>";
                    echo "<p>Детали записи:</p>";
                    echo "<ul>";
                    echo "<li>User ID: $user_id</li>";
                    echo "<li>Location ID: $location_id</li>";
                    echo "<li>Resource ID: $resource_id</li>";
                    echo "<li>Amount: 5</li>";
                    echo "<li>Success: Yes</li>";
                    echo "<li>Mining Time: 30 seconds</li>";
                    echo "</ul>";
                    
                    // Выводим текущее количество записей
                    $count_query = "SELECT COUNT(*) as count FROM mining_history";
                    $count_result = $db->query($count_query);
                    if ($count_result) {
                        $count = $count_result->fetch_assoc()['count'];
                        echo "<p>Всего записей в таблице: <strong>$count</strong></p>";
                    }
                } else {
                    echo "<p style='color: red;'>❌ Ошибка при добавлении записи: " . $db->error . "</p>";
                }
            } else {
                echo "<p style='color: red;'>❌ Не удалось получить необходимые ID для тестовой записи.</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ Отсутствуют необходимые данные:</p>";
            echo "<ul>";
            if ($check_row['users_count'] == 0) echo "<li>Нет пользователей в таблице users</li>";
            if ($check_row['locations_count'] == 0) echo "<li>Нет локаций в таблице locations</li>";
            if ($check_row['resources_count'] == 0) echo "<li>Нет ресурсов в таблице resources</li>";
            echo "</ul>";
        }
    } else {
        echo "<p style='color: red;'>❌ Ошибка при проверке наличия данных: " . $db->error . "</p>";
    }
}

if (isset($_POST['truncate_table'])) {
    echo "<h3>Очистка таблицы</h3>";
    
    // Выполняем TRUNCATE таблицы
    $truncate_query = "TRUNCATE TABLE mining_history";
    
    if ($db->query($truncate_query)) {
        echo "<p style='color: green;'>✅ Таблица успешно очищена.</p>";
    } else {
        echo "<p style='color: red;'>❌ Ошибка при очистке таблицы: " . $db->error . "</p>";
        
        // Если TRUNCATE не сработал (возможно из-за блокировки внешних ключей), 
        // пробуем использовать DELETE
        echo "<p>Попытка использования DELETE вместо TRUNCATE...</p>";
        
        $delete_query = "DELETE FROM mining_history";
        
        if ($db->query($delete_query)) {
            echo "<p style='color: green;'>✅ Все записи успешно удалены.</p>";
        } else {
            echo "<p style='color: red;'>❌ Ошибка при удалении записей: " . $db->error . "</p>";
        }
    }
}

if (isset($_POST['test_stats'])) {
    echo "<h3>Проверка работы API статистики</h3>";
    
    // Проверяем наличие файла get_mining_stats.php
    if (file_exists('get_mining_stats.php')) {
        echo "<p style='color: green;'>✅ Файл get_mining_stats.php существует.</p>";
        
        // Проверяем наличие записей в таблице
        $count_query = "SELECT COUNT(*) as count FROM mining_history";
        $count_result = $db->query($count_query);
        
        if ($count_result) {
            $count = $count_result->fetch_assoc()['count'];
            
            if ($count > 0) {
                echo "<p>В таблице найдено <strong>$count</strong> записей.</p>";
                
                // Получаем первого пользователя с записями
                $user_query = "SELECT DISTINCT user_id FROM mining_history LIMIT 1";
                $user_result = $db->query($user_query);
                
                if ($user_result && $user_result->num_rows > 0) {
                    $user_id = $user_result->fetch_assoc()['user_id'];
                    
                    echo "<p>Тестирование API для пользователя с ID: <strong>$user_id</strong></p>";
                    
                    // Создаем тестовый запрос к API
                    $data = http_build_query(['user_id' => $user_id]);
                    $options = [
                        'http' => [
                            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
                            'method'  => 'POST',
                            'content' => $data
                        ]
                    ];
                    $context = stream_context_create($options);
                    
                    try {
                        $result = @file_get_contents('get_mining_stats.php', false, $context);
                        
                        if ($result === FALSE) {
                            echo "<p style='color: red;'>❌ Ошибка при выполнении запроса к get_mining_stats.php.</p>";
                        } else {
                            echo "<p style='color: green;'>✅ Запрос к API выполнен успешно.</p>";
                            
                            // Проверяем, является ли ответ JSON
                            $json_data = json_decode($result, true);
                            
                            if (json_last_error() === JSON_ERROR_NONE) {
                                echo "<p style='color: green;'>✅ Получен корректный JSON-ответ.</p>";
                                
                                // Проверяем структуру ответа
                                if (isset($json_data['success']) && $json_data['success'] === true) {
                                    echo "<p style='color: green;'>✅ API вернул статус success: true.</p>";
                                    
                                    // Проверяем наличие всех необходимых блоков данных
                                    $missing_sections = [];
                                    
                                    if (!isset($json_data['stats']) || !is_array($json_data['stats'])) {
                                        $missing_sections[] = 'stats';
                                    }
                                    
                                    if (!isset($json_data['resource_stats']) || !is_array($json_data['resource_stats'])) {
                                        $missing_sections[] = 'resource_stats';
                                    }
                                    
                                    if (!isset($json_data['location_stats']) || !is_array($json_data['location_stats'])) {
                                        $missing_sections[] = 'location_stats';
                                    }
                                    
                                    if (empty($missing_sections)) {
                                        echo "<p style='color: green;'>✅ Все необходимые разделы статистики присутствуют в ответе.</p>";
                                        
                                        // Выводим краткое резюме статистики
                                        $stats = $json_data['stats'];
                                        echo "<div style='background-color: #f9f9f9; padding: 10px; border: 1px solid #ddd; margin: 10px 0;'>";
                                        echo "<h4>Статистика добычи:</h4>";
                                        echo "<ul>";
                                        echo "<li>Всего попыток: " . $stats['total_attempts'] . "</li>";
                                        echo "<li>Успешных: " . $stats['success_count'] . "</li>";
                                        echo "<li>Добыто ресурсов: " . $stats['total_resources'] . "</li>";
                                        echo "<li>Процент успеха: " . round($stats['success_rate'], 2) . "%</li>";
                                        echo "</ul>";
                                        echo "</div>";
                                        
                                        echo "<p>Тест статистики пройден успешно! Теперь все должно работать корректно.</p>";
                                    } else {
                                        echo "<p style='color: red;'>❌ В ответе отсутствуют следующие разделы: " . implode(', ', $missing_sections) . "</p>";
                                        echo "<p>Полный ответ API:</p>";
                                        echo "<pre style='background-color: #f9f9f9; padding: 10px; border: 1px solid #ddd; overflow: auto;'>";
                                        echo htmlspecialchars(json_encode($json_data, JSON_PRETTY_PRINT));
                                        echo "</pre>";
                                    }
                                } else {
                                    echo "<p style='color: red;'>❌ API вернул ошибку: " . 
                                        (isset($json_data['message']) ? $json_data['message'] : 'Неизвестная ошибка') . "</p>";
                                    
                                    echo "<p>Полный ответ API:</p>";
                                    echo "<pre style='background-color: #f9f9f9; padding: 10px; border: 1px solid #ddd; overflow: auto;'>";
                                    echo htmlspecialchars(json_encode($json_data, JSON_PRETTY_PRINT));
                                    echo "</pre>";
                                }
                            } else {
                                echo "<p style='color: red;'>❌ Получен некорректный JSON: " . json_last_error_msg() . "</p>";
                                echo "<p>Ответ API:</p>";
                                echo "<pre style='background-color: #f9f9f9; padding: 10px; border: 1px solid #ddd; overflow: auto;'>";
                                echo htmlspecialchars($result);
                                echo "</pre>";
                            }
                        }
                    } catch (Exception $e) {
                        echo "<p style='color: red;'>❌ Исключение при выполнении запроса: " . $e->getMessage() . "</p>";
                    }
                } else {
                    echo "<p style='color: red;'>❌ Не удалось найти пользователя с записями добычи.</p>";
                }
            } else {
                echo "<p style='color: orange;'>⚠️ В таблице нет записей. Сначала добавьте тестовую запись.</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ Ошибка при проверке количества записей: " . $db->error . "</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Файл get_mining_stats.php не найден.</p>";
        echo "<p>Создайте файл get_mining_stats.php со следующим содержимым:</p>";
        
        $sample_code = '<?php
/**
 * Получение статистики добычи ресурсов
 * Ресурсная Империя
 */

// Включаем вывод ошибок для отладки
ini_set(\'display_errors\', 1);
ini_set(\'display_startup_errors\', 1);
error_reporting(E_ALL);

// Подключаем конфигурацию
require_once \'config.php\';

// Проверяем метод запроса
if ($_SERVER[\'REQUEST_METHOD\'] !== \'POST\') {
    jsonResponse(false, \'Неверный метод запроса\');
    exit;
}

// Получаем ID пользователя из запроса
$user_id = isset($_POST[\'user_id\']) ? (int)$_POST[\'user_id\'] : 0;

// Проверяем валидность ID пользователя
if ($user_id <= 0) {
    jsonResponse(false, \'Неверный ID пользователя\');
    exit;
}

// Проверяем существование таблицы
$table_check = $db->query("SHOW TABLES LIKE \'mining_history\'");
if ($table_check->num_rows === 0) {
    jsonResponse(false, \'Таблица истории добычи не найдена\');
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
        throw new Exception(\'Ошибка при подготовке запроса статистики: \' . $db->error);
    }
    
    $stats_stmt->bind_param("i", $user_id);
    $stats_stmt->execute();
    $stats_result = $stats_stmt->get_result();
    
    if (!$stats_result) {
        throw new Exception(\'Ошибка при получении статистики: \' . $stats_stmt->error);
    }
    
    $stats = $stats_result->fetch_assoc();
    
    // Статистика по ресурсам
    $resource_stats_query = "SELECT 
                              r.name as resource_name,
                              r.rarity,
                              COUNT(*) as attempts,
                              SUM(mh.success) as successes,
                              (SUM(mh.success) / COUNT(*) * 100) as success_rate,
                              SUM(CASE WHEN mh.success = 1 THEN mh.amount ELSE 0 END) as total_mined
                            FROM mining_history mh
                            JOIN resources r ON mh.resource_id = r.id
                            WHERE mh.user_id = ?
                            GROUP BY mh.resource_id
                            ORDER BY total_mined DESC";
    
    $resource_stats_stmt = $db->prepare($resource_stats_query);
    
    if (!$resource_stats_stmt) {
        throw new Exception(\'Ошибка при подготовке запроса статистики ресурсов: \' . $db->error);
    }
    
    $resource_stats_stmt->bind_param("i", $user_id);
    $resource_stats_stmt->execute();
    $resource_stats_result = $resource_stats_stmt->get_result();
    
    if (!$resource_stats_result) {
        throw new Exception(\'Ошибка при получении статистики ресурсов: \' . $resource_stats_stmt->error);
    }
    
    $resource_stats = [];
    while ($row = $resource_stats_result->fetch_assoc()) {
        $resource_stats[] = $row;
    }
    
    // Статистика по локациям
    $location_stats_query = "SELECT 
                              l.name as location_name,
                              l.difficulty,
                              COUNT(*) as attempts,
                              SUM(mh.success) as successes,
                              (SUM(mh.success) / COUNT(*) * 100) as success_rate,
                              SUM(CASE WHEN mh.success = 1 THEN mh.amount ELSE 0 END) as total_mined
                            FROM mining_history mh
                            JOIN locations l ON mh.location_id = l.id
                            WHERE mh.user_id = ?
                            GROUP BY mh.location_id
                            ORDER BY total_mined DESC";
    
    $location_stats_stmt = $db->prepare($location_stats_query);
    
    if (!$location_stats_stmt) {
        throw new Exception(\'Ошибка при подготовке запроса статистики локаций: \' . $db->error);
    }
    
    $location_stats_stmt->bind_param("i", $user_id);
    $location_stats_stmt->execute();
    $location_stats_result = $location_stats_stmt->get_result();
    
    if (!$location_stats_result) {
        throw new Exception(\'Ошибка при получении статистики локаций: \' . $location_stats_stmt->error);
    }
    
    $location_stats = [];
    while ($row = $location_stats_result->fetch_assoc()) {
        $location_stats[] = $row;
    }
    
    // Возвращаем успешный ответ с данными
    jsonResponse(true, \'\', [
        \'stats\' => $stats,
        \'resource_stats\' => $resource_stats,
        \'location_stats\' => $location_stats
    ]);
    
} catch (Exception $e) {
    jsonResponse(false, $e->getMessage());
}';
        
        echo "<pre style='background-color: #f9f9f9; padding: 10px; border: 1px solid #ddd; overflow: auto;'>";
        echo htmlspecialchars($sample_code);
        echo "</pre>";
    }
}

// Завершение HTML
echo "<h2>Инструкции по исправлению проблемы статистики</h2>";
echo "<p>После исправления структуры таблицы, выполните следующие шаги:</p>";
echo "<ol>";
echo "<li>Создайте тестовую запись с помощью кнопки выше.</li>";
echo "<li>Проверьте работу API статистики с помощью соответствующей кнопки.</li>";
echo "<li>Замените функцию <code>displayMiningStats</code> в файле <code>ui.js</code> на исправленную версию:</li>";
echo "</ol>";

// Демонстрация исправленной функции
$fixed_function = 'displayMiningStats: function(generalStats, resourceStats, locationStats) {
    console.log("Отображение статистики добычи:", generalStats, resourceStats, locationStats);
    
    const container = $(\'.mining-stats-container\');
    
    // Проверяем наличие статистики
    if (!generalStats) {
        container.append(\'<p>Нет данных о добыче ресурсов.</p>\');
        return;
    }
    
    // Отображаем общую статистику
    let statsHtml = `
        <div class="stats-box general-mining-stats">
            <h4>Общая статистика добычи</h4>
            <div class="stat-item">
                <div class="stat-label">Всего попыток:</div>
                <div class="stat-value">${generalStats.total_attempts || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Успешных добыч:</div>
                <div class="stat-value">${generalStats.success_count || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Процент успеха:</div>
                <div class="stat-value">${(parseFloat(generalStats.success_rate) || 0).toFixed(2)}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Всего добыто ресурсов:</div>
                <div class="stat-value">${generalStats.total_resources || 0}</div>
            </div>
        </div>
    `;
    
    // Добавляем статистику по ресурсам, если она есть
    if (resourceStats && resourceStats.length > 0) {
        statsHtml += `
            <h4>Топ-5 ресурсов по количеству добычи</h4>
            <div class="resource-mining-stats">
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Ресурс</th>
                            <th>Редкость</th>
                            <th>Добыто</th>
                            <th>Успех</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Проверяем и преобразуем данные для безопасной сортировки
        const preparedResources = resourceStats.map(resource => ({
            ...resource,
            total_mined: parseInt(resource.total_mined || 0),
            success_rate: parseFloat(resource.success_rate || 0)
        }));
        
        // Сортируем ресурсы по количеству добытых и берем топ-5
        const topResources = preparedResources
            .sort((a, b) => b.total_mined - a.total_mined)
            .slice(0, 5);
            
        topResources.forEach(resource => {
            const rarityClass = this.getRarityClass(resource.rarity);
            statsHtml += `
                <tr class="${rarityClass}">
                    <td>${resource.resource_name}</td>
                    <td>${this.formatRarity(resource.rarity)}</td>
                    <td>${resource.total_mined}</td>
                    <td>${resource.success_rate.toFixed(2)}%</td>
                </tr>
            `;
        });
        
        statsHtml += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        statsHtml += `<p>Нет данных о добыче конкретных ресурсов.</p>`;
    }
    
    // Добавляем статистику по локациям, если она есть
    if (locationStats && locationStats.length > 0) {
        statsHtml += `
            <h4>Статистика по локациям</h4>
            <div class="location-mining-stats">
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Локация</th>
                            <th>Сложность</th>
                            <th>Добыто</th>
                            <th>Успех</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Преобразуем данные для безопасного отображения
        locationStats.forEach(location => {
            statsHtml += `
                <tr>
                    <td>${location.location_name}</td>
                    <td>${location.difficulty}</td>
                    <td>${parseInt(location.total_mined || 0)}</td>
                    <td>${parseFloat(location.success_rate || 0).toFixed(2)}%</td>
                </tr>
            `;
        });
        
        statsHtml += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        statsHtml += `<p>Нет данных о добыче по локациям.</p>`;
    }
    
    // Добавляем ссылку на полную статистику
    statsHtml += `
        <div class="stats-full-link">
            <a href="check_mining_history.php?user_id=${Game.player.id}" target="_blank">Просмотреть полную статистику добычи</a>
        </div>
    `;
    
    // Добавляем стили для таблицы статистики, если они еще не определены
    if (!$(\'#stats-table-styles\').length) {
        $(\'head\').append(`
            <style id="stats-table-styles">
                .stats-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    margin-bottom: 20px;
                }
                
                .stats-table th, .stats-table td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid rgba(139, 69, 19, 0.2);
                }
                
                .stats-table th {
                    background-color: rgba(139, 69, 19, 0.1);
                    font-weight: bold;
                }
                
                .stats-table tr:hover {
                    background-color: rgba(255, 255, 255, 0.4);
                }
                
                .stats-full-link {
                    margin-top: 20px;
                    text-align: center;
                }
                
                .stats-full-link a {
                    color: #8B4513;
                    text-decoration: none;
                    padding: 5px 10px;
                    border: 1px solid #8B4513;
                    border-radius: 4px;
                }
                
                .stats-full-link a:hover {
                    background-color: rgba(139, 69, 19, 0.1);
                }
            </style>
        `);
    }
    
    container.append(statsHtml);
}';

echo "<pre style='background-color: #f9f9f9; padding: 10px; border: 1px solid #ddd; overflow: auto;'>";
echo htmlspecialchars($fixed_function);
echo "</pre>";

?>