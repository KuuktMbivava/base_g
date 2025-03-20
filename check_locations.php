<?php
// Подключаем конфигурацию
require_once 'config.php';

// Выбираем все локации
$query = "SELECT * FROM locations";
$result = $db->query($query);

echo "<h2>Проверка локаций в базе данных</h2>";

if (!$result) {
    echo "<p>Ошибка при получении локаций: " . $db->error . "</p>";
} else {
    if ($result->num_rows === 0) {
        echo "<p>Локации не найдены в базе данных.</p>";
    } else {
        echo "<p>Найдено локаций: " . $result->num_rows . "</p>";
        echo "<table border='1'>
                <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Описание</th>
                    <th>Изображение</th>
                    <th>Сложность</th>
                </tr>";
        
        while ($row = $result->fetch_assoc()) {
            echo "<tr>
                    <td>" . $row['id'] . "</td>
                    <td>" . $row['name'] . "</td>
                    <td>" . $row['description'] . "</td>
                    <td>" . $row['image'] . "</td>
                    <td>" . $row['difficulty'] . "</td>
                </tr>";
        }
        
        echo "</table>";
    }
}

// Проверяем связи локаций с ресурсами
echo "<h2>Проверка связей локаций с ресурсами</h2>";

$query = "SELECT lr.location_id, l.name as location_name, lr.resource_id, r.name as resource_name, 
                 lr.probability, lr.min_amount, lr.max_amount
          FROM location_resources lr
          JOIN locations l ON lr.location_id = l.id
          JOIN resources r ON lr.resource_id = r.id";

$result = $db->query($query);

if (!$result) {
    echo "<p>Ошибка при получении связей: " . $db->error . "</p>";
} else {
    if ($result->num_rows === 0) {
        echo "<p>Связи между локациями и ресурсами не найдены.</p>";
    } else {
        echo "<p>Найдено связей: " . $result->num_rows . "</p>";
        echo "<table border='1'>
                <tr>
                    <th>ID локации</th>
                    <th>Название локации</th>
                    <th>ID ресурса</th>
                    <th>Название ресурса</th>
                    <th>Вероятность</th>
                    <th>Мин. количество</th>
                    <th>Макс. количество</th>
                </tr>";
        
        while ($row = $result->fetch_assoc()) {
            echo "<tr>
                    <td>" . $row['location_id'] . "</td>
                    <td>" . $row['location_name'] . "</td>
                    <td>" . $row['resource_id'] . "</td>
                    <td>" . $row['resource_name'] . "</td>
                    <td>" . $row['probability'] . "</td>
                    <td>" . $row['min_amount'] . "</td>
                    <td>" . $row['max_amount'] . "</td>
                </tr>";
        }
        
        echo "</table>";
    }
}