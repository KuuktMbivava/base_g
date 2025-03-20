<?php
/**
 * Скрипт для проверки истории добычи ресурсов
 * Ресурсная Империя
 */

// Включаем вывод ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключаем конфигурацию
require_once 'config.php';

echo "<h2>История добычи ресурсов</h2>";

// Получаем ID пользователя из GET-параметра (если есть)
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;

// Базовый запрос для получения истории
$base_query = "SELECT mh.id, mh.user_id, u.username, mh.location_id, l.name as location_name, 
               mh.resource_id, r.name as resource_name, r.rarity, mh.amount, mh.success, 
               mh.mining_time, mh.timestamp
               FROM mining_history mh
               JOIN users u ON mh.user_id = u.id
               JOIN locations l ON mh.location_id = l.id
               JOIN resources r ON mh.resource_id = r.id";

// Если указан ID пользователя, фильтруем по нему
if ($user_id > 0) {
    $query = $base_query . " WHERE mh.user_id = ? ORDER BY mh.timestamp DESC LIMIT 100";
    $stmt = $db->prepare($query);
    $stmt->bind_param("i", $user_id);
} else {
    $query = $base_query . " ORDER BY mh.timestamp DESC LIMIT 100";
    $stmt = $db->prepare($query);
}

$stmt->execute();
$result = $stmt->get_result();

if (!$result) {
    echo "<p>Ошибка при получении истории: " . $db->error . "</p>";
} else {
    if ($result->num_rows === 0) {
        echo "<p>История добычи пуста.</p>";
    } else {
        // Форма для фильтрации по пользователю
        echo "<form method='get' action=''>
                <label for='user_id'>Фильтр по ID пользователя:</label>
                <input type='number' name='user_id' id='user_id' value='$user_id'>
                <button type='submit'>Применить</button>
                <a href='check_mining_history.php'>Сбросить</a>
              </form><br>";
        
        echo "<p>Найдено записей: " . $result->num_rows . "</p>";
        echo "<table border='1' style='border-collapse: collapse;'>
                <tr>
                    <th>ID</th>
                    <th>Пользователь</th>
                    <th>Локация</th>
                    <th>Ресурс</th>
                    <th>Редкость</th>
                    <th>Количество</th>
                    <th>Успех</th>
                    <th>Время добычи (сек)</th>
                    <th>Дата и время</th>
                </tr>";
        
        while ($row = $result->fetch_assoc()) {
            // Определяем цвет строки в зависимости от успеха добычи
            $row_class = $row['success'] ? "style='background-color: rgba(76, 175, 80, 0.1);'" : "style='background-color: rgba(244, 67, 54, 0.1);'";
            
            // Форматируем редкость ресурса
            $rarity_class = "";
            switch ($row['rarity']) {
                case 'common': 
                    $rarity_class = "style='color: #333;'";
                    break;
                case 'uncommon': 
                    $rarity_class = "style='color: #4CAF50; font-weight: bold;'";
                    break;
                case 'rare': 
                    $rarity_class = "style='color: #2196F3; font-weight: bold;'";
                    break;
                case 'epic': 
                    $rarity_class = "style='color: #9C27B0; font-weight: bold;'";
                    break;
                case 'legendary': 
                    $rarity_class = "style='color: #FF9800; font-weight: bold;'";
                    break;
            }
            
            echo "<tr $row_class>
                    <td>" . $row['id'] . "</td>
                    <td>" . htmlspecialchars($row['username']) . " (ID: " . $row['user_id'] . ")</td>
                    <td>" . htmlspecialchars($row['location_name']) . " (ID: " . $row['location_id'] . ")</td>
                    <td>" . htmlspecialchars($row['resource_name']) . " (ID: " . $row['resource_id'] . ")</td>
                    <td $rarity_class>" . ucfirst($row['rarity']) . "</td>
                    <td>" . $row['amount'] . "</td>
                    <td>" . ($row['success'] ? 'Да' : 'Нет') . "</td>
                    <td>" . $row['mining_time'] . "</td>
                    <td>" . $row['timestamp'] . "</td>
                </tr>";
        }
        
        echo "</table>";
    }
}

// Добавляем статистику по добыче
echo "<h2>Статистика добычи ресурсов</h2>";

// Общая статистика
$stats_query = "SELECT 
                  COUNT(*) as total_attempts,
                  SUM(success) as success_count,
                  SUM(CASE WHEN success = 1 THEN amount ELSE 0 END) as total_resources,
                  (SUM(success) / COUNT(*) * 100) as success_rate
                FROM mining_history";

if ($user_id > 0) {
    $stats_query .= " WHERE user_id = $user_id";
}

$stats_result = $db->query($stats_query);
$stats = $stats_result->fetch_assoc();

echo "<h3>Общая статистика</h3>";
echo "<table border='1' style='border-collapse: collapse;'>
        <tr>
            <th>Всего попыток</th>
            <th>Успешных попыток</th>
            <th>Процент успеха</th>
            <th>Всего добыто ресурсов</th>
        </tr>
        <tr>
            <td>" . $stats['total_attempts'] . "</td>
            <td>" . $stats['success_count'] . "</td>
            <td>" . number_format($stats['success_rate'], 2) . "%</td>
            <td>" . $stats['total_resources'] . "</td>
        </tr>
      </table>";

// Статистика по ресурсам
echo "<h3>Статистика по ресурсам</h3>";
$resource_stats_query = "SELECT 
                          r.name as resource_name,
                          r.rarity,
                          COUNT(*) as attempts,
                          SUM(mh.success) as successes,
                          (SUM(mh.success) / COUNT(*) * 100) as success_rate,
                          SUM(CASE WHEN mh.success = 1 THEN mh.amount ELSE 0 END) as total_mined
                        FROM mining_history mh
                        JOIN resources r ON mh.resource_id = r.id";

if ($user_id > 0) {
    $resource_stats_query .= " WHERE mh.user_id = $user_id";
}

$resource_stats_query .= " GROUP BY mh.resource_id ORDER BY r.rarity DESC, successes DESC";

$resource_stats_result = $db->query($resource_stats_query);

if (!$resource_stats_result || $resource_stats_result->num_rows === 0) {
    echo "<p>Нет данных для отображения статистики по ресурсам.</p>";
} else {
    echo "<table border='1' style='border-collapse: collapse;'>
            <tr>
                <th>Ресурс</th>
                <th>Редкость</th>
                <th>Попыток</th>
                <th>Успешно</th>
                <th>% успеха</th>
                <th>Всего добыто</th>
            </tr>";
    
    while ($row = $resource_stats_result->fetch_assoc()) {
        // Форматируем редкость ресурса
        $rarity_class = "";
        switch ($row['rarity']) {
            case 'common': 
                $rarity_class = "style='color: #333;'";
                break;
            case 'uncommon': 
                $rarity_class = "style='color: #4CAF50; font-weight: bold;'";
                break;
            case 'rare': 
                $rarity_class = "style='color: #2196F3; font-weight: bold;'";
                break;
            case 'epic': 
                $rarity_class = "style='color: #9C27B0; font-weight: bold;'";
                break;
            case 'legendary': 
                $rarity_class = "style='color: #FF9800; font-weight: bold;'";
                break;
        }
        
        echo "<tr>
                <td>" . htmlspecialchars($row['resource_name']) . "</td>
                <td $rarity_class>" . ucfirst($row['rarity']) . "</td>
                <td>" . $row['attempts'] . "</td>
                <td>" . $row['successes'] . "</td>
                <td>" . number_format($row['success_rate'], 2) . "%</td>
                <td>" . $row['total_mined'] . "</td>
              </tr>";
    }
    
    echo "</table>";
}

// Статистика по локациям
echo "<h3>Статистика по локациям</h3>";
$location_stats_query = "SELECT 
                          l.name as location_name,
                          l.difficulty,
                          COUNT(*) as attempts,
                          SUM(mh.success) as successes,
                          (SUM(mh.success) / COUNT(*) * 100) as success_rate,
                          SUM(CASE WHEN mh.success = 1 THEN mh.amount ELSE 0 END) as total_mined
                        FROM mining_history mh
                        JOIN locations l ON mh.location_id = l.id";

if ($user_id > 0) {
    $location_stats_query .= " WHERE mh.user_id = $user_id";
}

$location_stats_query .= " GROUP BY mh.location_id ORDER BY l.difficulty, successes DESC";

$location_stats_result = $db->query($location_stats_query);

if (!$location_stats_result || $location_stats_result->num_rows === 0) {
    echo "<p>Нет данных для отображения статистики по локациям.</p>";
} else {
    echo "<table border='1' style='border-collapse: collapse;'>
            <tr>
                <th>Локация</th>
                <th>Сложность</th>
                <th>Попыток</th>
                <th>Успешно</th>
                <th>% успеха</th>
                <th>Всего добыто</th>
            </tr>";
    
    while ($row = $location_stats_result->fetch_assoc()) {
        echo "<tr>
                <td>" . htmlspecialchars($row['location_name']) . "</td>
                <td>" . $row['difficulty'] . "</td>
                <td>" . $row['attempts'] . "</td>
                <td>" . $row['successes'] . "</td>
                <td>" . number_format($row['success_rate'], 2) . "%</td>
                <td>" . $row['total_mined'] . "</td>
              </tr>";
    }
    
    echo "</table>";
}

// Добавляем ссылки для навигации
echo "<div style='margin-top: 20px;'>
        <a href='check_locations.php'>Проверить локации</a> | 
        <a href='index.html'>Вернуться на главную</a>
      </div>";