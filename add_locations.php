<?php
// Подключаем конфигурацию
require_once 'config.php';

echo "<h2>Добавление локаций в базу данных</h2>";

// Начальные локации
$locations = [
    [
        'name' => 'Зачарованный лес',
        'description' => 'Древний лес, полный таинственных существ и редких ресурсов. Здесь можно добыть ценную древесину, травы и магические кристаллы.',
        'image' => 'https://cdnjs.cloudflare.com/ajax/libs/simple-backgrounds/1.0.0/forest.jpg',
        'difficulty' => 1,
        'energy_cost' => 5
    ],
    [
        'name' => 'Горные пики',
        'description' => 'Высокие горы, богатые рудой и минералами. Добыча здесь сложнее, но вознаграждение значительно больше.',
        'image' => 'https://cdnjs.cloudflare.com/ajax/libs/simple-backgrounds/1.0.0/mountains.jpg',
        'difficulty' => 2,
        'energy_cost' => 8
    ],
    [
        'name' => 'Пустынные дюны',
        'description' => 'Бескрайняя пустыня, скрывающая под песками древние сокровища и редкие материалы.',
        'image' => 'https://cdnjs.cloudflare.com/ajax/libs/simple-backgrounds/1.0.0/desert.jpg',
        'difficulty' => 3,
        'energy_cost' => 10
    ],
    [
        'name' => 'Прибрежные воды',
        'description' => 'Морское побережье со множеством подводных пещер, богатых жемчугом и редкими морскими ресурсами.',
        'image' => 'https://cdnjs.cloudflare.com/ajax/libs/simple-backgrounds/1.0.0/coast.jpg',
        'difficulty' => 2,
        'energy_cost' => 7
    ],
    [
        'name' => 'Глубокие пещеры',
        'description' => 'Тёмные подземные лабиринты, наполненные драгоценными камнями и загадочными артефактами.',
        'image' => 'https://cdnjs.cloudflare.com/ajax/libs/simple-backgrounds/1.0.0/cave.jpg',
        'difficulty' => 4,
        'energy_cost' => 12
    ]
];

// Вставка локаций
$location_query = "INSERT INTO locations (name, description, image, difficulty, energy_cost) VALUES (?, ?, ?, ?, ?)";
$location_stmt = $db->prepare($location_query);

if (!$location_stmt) {
    echo "<p>Ошибка при подготовке запроса: " . $db->error . "</p>";
} else {
    $success_count = 0;
    $error_count = 0;
    
    foreach ($locations as $location) {
        $location_stmt->bind_param("sssii", 
            $location['name'], 
            $location['description'], 
            $location['image'], 
            $location['difficulty'], 
            $location['energy_cost']
        );
        
        if ($location_stmt->execute()) {
            $success_count++;
            echo "<p>Успешно добавлена локация: " . $location['name'] . "</p>";
        } else {
            $error_count++;
            echo "<p>Ошибка при добавлении локации " . $location['name'] . ": " . $location_stmt->error . "</p>";
        }
    }
    
    echo "<p>Итого: добавлено локаций - $success_count, ошибок - $error_count</p>";
}

// Проверим, имеются ли ресурсы в базе
echo "<h2>Проверка ресурсов в базе данных</h2>";
$res_check_query = "SELECT COUNT(*) as count FROM resources";
$res_check_result = $db->query($res_check_query);
$res_count = 0;

if ($res_check_result && $row = $res_check_result->fetch_assoc()) {
    $res_count = $row['count'];
    echo "<p>Найдено ресурсов в базе: $res_count</p>";
}

if ($res_count == 0) {
    echo "<p>Ресурсы отсутствуют. Добавление ресурсов...</p>";
    
    // Добавим ресурсы
    $resources = [
        [
            'name' => 'Дуб',
            'description' => 'Прочная древесина для строительства',
            'base_price' => 10,
            'rarity' => 'common'
        ],
        [
            'name' => 'Эльфийская трава',
            'description' => 'Редкое растение с целебными свойствами',
            'base_price' => 25,
            'rarity' => 'uncommon'
        ],
        [
            'name' => 'Магический кристалл',
            'description' => 'Источник мистической энергии',
            'base_price' => 75,
            'rarity' => 'rare'
        ],
        [
            'name' => 'Железная руда',
            'description' => 'Основной материал для изготовления оружия и брони',
            'base_price' => 15,
            'rarity' => 'common'
        ],
        [
            'name' => 'Серебро',
            'description' => 'Ценный металл с магическими свойствами',
            'base_price' => 30,
            'rarity' => 'uncommon'
        ],
        [
            'name' => 'Золотая жила',
            'description' => 'Чистое золото высокого качества',
            'base_price' => 100,
            'rarity' => 'rare'
        ],
        [
            'name' => 'Песок',
            'description' => 'Используется для изготовления стекла',
            'base_price' => 5,
            'rarity' => 'common'
        ],
        [
            'name' => 'Пустынный кварц',
            'description' => 'Кристалл, накопивший энергию солнца',
            'base_price' => 35,
            'rarity' => 'uncommon'
        ],
        [
            'name' => 'Древний артефакт',
            'description' => 'Таинственный предмет из давно исчезнувшей цивилизации',
            'base_price' => 120,
            'rarity' => 'rare'
        ],
        [
            'name' => 'Морская соль',
            'description' => 'Кристаллы соли из чистой морской воды',
            'base_price' => 8,
            'rarity' => 'common'
        ],
        [
            'name' => 'Жемчуг',
            'description' => 'Красивые жемчужины из морских глубин',
            'base_price' => 40,
            'rarity' => 'uncommon'
        ],
        [
            'name' => 'Коралл',
            'description' => 'Редкий коралл необычного оттенка',
            'base_price' => 85,
            'rarity' => 'rare'
        ],
        [
            'name' => 'Уголь',
            'description' => 'Основное топливо для плавки руды',
            'base_price' => 12,
            'rarity' => 'common'
        ],
        [
            'name' => 'Аметист',
            'description' => 'Красивый фиолетовый кристалл',
            'base_price' => 45,
            'rarity' => 'uncommon'
        ],
        [
            'name' => 'Алмаз',
            'description' => 'Прочнейший и ценнейший драгоценный камень',
            'base_price' => 150,
            'rarity' => 'rare'
        ]
    ];
    
    // Вставка ресурсов
    $resource_query = "INSERT INTO resources (name, description, base_price, rarity) VALUES (?, ?, ?, ?)";
    $resource_stmt = $db->prepare($resource_query);
    
    if (!$resource_stmt) {
        echo "<p>Ошибка при подготовке запроса для ресурсов: " . $db->error . "</p>";
    } else {
        $success_count = 0;
        $error_count = 0;
        
        foreach ($resources as $resource) {
            $resource_stmt->bind_param("ssis", 
                $resource['name'], 
                $resource['description'], 
                $resource['base_price'], 
                $resource['rarity']
            );
            
            if ($resource_stmt->execute()) {
                $success_count++;
            } else {
                $error_count++;
                echo "<p>Ошибка при добавлении ресурса " . $resource['name'] . ": " . $resource_stmt->error . "</p>";
            }
        }
        
        echo "<p>Добавлено ресурсов: $success_count, ошибок: $error_count</p>";
    }
}

// Проверяем наличие связей между локациями и ресурсами
echo "<h2>Проверка связей локаций с ресурсами</h2>";
$lr_check_query = "SELECT COUNT(*) as count FROM location_resources";
$lr_check_result = $db->query($lr_check_query);
$lr_count = 0;

if ($lr_check_result && $row = $lr_check_result->fetch_assoc()) {
    $lr_count = $row['count'];
    echo "<p>Найдено связей локация-ресурс: $lr_count</p>";
}

if ($lr_count == 0) {
    echo "<p>Связи отсутствуют. Добавление связей...</p>";
    
    // Добавляем связи между локациями и ресурсами
    $location_resources = [
        // Лес (id=1)
        [1, 1, 0.7, 1, 3], // Дуб
        [1, 2, 0.4, 1, 2], // Эльфийская трава
        [1, 3, 0.1, 1, 1], // Магический кристалл
        
        // Горы (id=2)
        [2, 4, 0.7, 1, 4], // Железная руда
        [2, 5, 0.4, 1, 2], // Серебро
        [2, 6, 0.1, 1, 1], // Золотая жила
        
        // Пустыня (id=3)
        [3, 7, 0.7, 2, 5], // Песок
        [3, 8, 0.4, 1, 2], // Пустынный кварц
        [3, 9, 0.1, 1, 1], // Древний артефакт
        
        // Побережье (id=4)
        [4, 10, 0.7, 2, 4], // Морская соль
        [4, 11, 0.4, 1, 2], // Жемчуг
        [4, 12, 0.1, 1, 1], // Коралл
        
        // Пещеры (id=5)
        [5, 13, 0.7, 2, 5], // Уголь
        [5, 14, 0.4, 1, 2], // Аметист
        [5, 15, 0.1, 1, 1]  // Алмаз
    ];
    
    // Вставка связей
    $lr_query = "INSERT INTO location_resources (location_id, resource_id, probability, min_amount, max_amount) VALUES (?, ?, ?, ?, ?)";
    $lr_stmt = $db->prepare($lr_query);
    
    if (!$lr_stmt) {
        echo "<p>Ошибка при подготовке запроса для связей: " . $db->error . "</p>";
    } else {
        $success_count = 0;
        $error_count = 0;
        
        foreach ($location_resources as $lr) {
            $lr_stmt->bind_param("iidii", $lr[0], $lr[1], $lr[2], $lr[3], $lr[4]);
            
            if ($lr_stmt->execute()) {
                $success_count++;
            } else {
                $error_count++;
                echo "<p>Ошибка при добавлении связи локация " . $lr[0] . " - ресурс " . $lr[1] . ": " . $lr_stmt->error . "</p>";
            }
        }
        
        echo "<p>Добавлено связей: $success_count, ошибок: $error_count</p>";
    }
}

echo "<p>Данные успешно обновлены. <a href='check_locations.php'>Проверить результаты</a></p>";