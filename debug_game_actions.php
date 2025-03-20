<?php
/**
 * Отладочный скрипт для получения локаций
 * Ресурсная Империя
 */

// Включаем вывод ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключаем конфигурацию
require_once 'config.php';

echo "<h2>Отладка запроса локаций</h2>";
echo "<pre>";

// Выбираем все локации
echo "Поиск локаций в базе данных...\n";
$query = "SELECT l.id, l.name, l.description, l.image, l.difficulty, l.energy_cost 
          FROM locations l 
          ORDER BY l.difficulty";

$result = $db->query($query);

if (!$result) {
    echo "Ошибка при выполнении запроса: " . $db->error . "\n";
    exit;
}

echo "Найдено локаций: " . $result->num_rows . "\n\n";

$locations = [];

while ($row = $result->fetch_assoc()) {
    echo "Локация ID " . $row['id'] . ": " . $row['name'] . "\n";
    
    // Получаем ресурсы для локации
    echo "  Получение ресурсов для локации ID " . $row['id'] . "...\n";
    $resources_query = "SELECT r.id, r.name, r.rarity, lr.probability, lr.min_amount, lr.max_amount 
                        FROM location_resources lr 
                        JOIN resources r ON lr.resource_id = r.id 
                        WHERE lr.location_id = ?
                        ORDER BY r.rarity";
    
    $resources_stmt = $db->prepare($resources_query);
    
    if (!$resources_stmt) {
        echo "  Ошибка при подготовке запроса ресурсов: " . $db->error . "\n";
        continue;
    }
    
    $resources_stmt->bind_param("i", $row['id']);
    $resources_stmt->execute();
    $resources_result = $resources_stmt->get_result();
    
    if (!$resources_result) {
        echo "  Ошибка при выполнении запроса ресурсов: " . $resources_stmt->error . "\n";
        continue;
    }
    
    echo "  Найдено ресурсов: " . $resources_result->num_rows . "\n";
    
    $resources = [];
    
    while ($resource = $resources_result->fetch_assoc()) {
        echo "    Ресурс ID " . $resource['id'] . ": " . $resource['name'] . " (редкость: " . $resource['rarity'] . ")\n";
        $resources[] = $resource;
    }
    
    // Добавляем локацию с ресурсами
    $row['resources'] = $resources;
    $locations[] = $row;
    
    echo "\n";
}

// Формируем JSON-ответ
$response = [
    'success' => true,
    'locations' => $locations
];

echo "\nJSON-ответ:";
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

echo "</pre>";

echo "<h3>Проверка getLocations() из game_actions.php</h3>";
echo "<div id='response-output' style='border: 1px solid #ccc; padding: 10px; margin-top: 10px;'></div>";

// Добавляем JavaScript для тестового запроса
echo "<script src='https://code.jquery.com/jquery-3.6.0.min.js'></script>";
echo <<<EOT
<script>
$(document).ready(function() {
    $.ajax({
        url: 'game_actions.php',
        type: 'POST',
        data: {
            action: 'get_locations'
        },
        success: function(response) {
            $('#response-output').html('<h4>Ответ от game_actions.php:</h4><pre>' + response + '</pre>');
            
            try {
                const result = JSON.parse(response);
                console.log('Parsed result:', result);
                
                if (result.success && result.locations) {
                    $('#response-output').append('<p style="color: green;">✓ Успешно получены локации: ' + result.locations.length + '</p>');
                } else {
                    $('#response-output').append('<p style="color: red;">✗ Ошибка: ' + (result.message || 'Неизвестная ошибка') + '</p>');
                }
            } catch (error) {
                $('#response-output').append('<p style="color: red;">✗ Ошибка парсинга JSON: ' + error.message + '</p>');
            }
        },
        error: function(xhr, status, error) {
            $('#response-output').html('<h4>Ошибка при выполнении запроса:</h4><p>' + status + ': ' + error + '</p>');
        }
    });
});
</script>
EOT;