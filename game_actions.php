<?php
/**
 * Обработка игровых действий
 * Ресурсная Империя
 */

// Включаем вывод ошибок для отладки
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Подключаем конфигурацию
require_once 'config.php';

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Неверный метод запроса');
}

// Определяем действие
$action = isset($_POST['action']) ? $_POST['action'] : '';

switch ($action) {
    case 'get_locations':
        getLocations();
        break;
        
    case 'get_resources':
        getResources();
        break;
        
    case 'get_inventory':
        getInventory();
        break;
        
    case 'mine_resource':
        mineResource();
        break;
        
    case 'update_inventory':
        updateInventory();
        break;
        
    case 'update_gold':
        updateGold();
        break;
        
    case 'sell_resource':
        sellResource();
        break;
        
    default:
        jsonResponse(false, 'Неизвестное действие');
}

/**
 * Получение списка локаций
 */
function getLocations() {
    global $db;
    
    try {
        // Выбираем все локации
        $query = "SELECT l.id, l.name, l.description, l.image, l.difficulty, l.energy_cost 
                FROM locations l 
                ORDER BY l.difficulty";
        
        $result = $db->query($query);
        
        if (!$result) {
            throw new Exception('Ошибка при получении локаций: ' . $db->error);
        }
        
        $locations = [];
        
        while ($row = $result->fetch_assoc()) {
            // Убедимся, что ID числовой
            $row['id'] = (int)$row['id'];
            
            // Получаем ресурсы для локации
            $resources_query = "SELECT r.id, r.name, r.rarity, lr.probability, lr.min_amount, lr.max_amount 
                              FROM location_resources lr 
                              JOIN resources r ON lr.resource_id = r.id 
                              WHERE lr.location_id = ?
                              ORDER BY r.rarity";
            
            $resources_stmt = $db->prepare($resources_query);
            
            if (!$resources_stmt) {
                throw new Exception('Ошибка при подготовке запроса ресурсов: ' . $db->error);
            }
            
            $resources_stmt->bind_param("i", $row['id']);
            $resources_stmt->execute();
            $resources_result = $resources_stmt->get_result();
            
            if (!$resources_result) {
                throw new Exception('Ошибка при выполнении запроса ресурсов: ' . $resources_stmt->error);
            }
            
            $resources = [];
            
            while ($resource = $resources_result->fetch_assoc()) {
                // Убедимся, что ID ресурса числовой
                $resource['id'] = (int)$resource['id'];
                $resources[] = $resource;
            }
            
            // Добавляем локацию с ресурсами
            $row['resources'] = $resources;
            $locations[] = $row;
        }
        
        if (empty($locations)) {
            throw new Exception('Локации не найдены в базе данных');
        }
        
        jsonResponse(true, '', ['locations' => $locations]);
    } catch (Exception $e) {
        jsonResponse(false, $e->getMessage());
    }
}

/**
 * Получение списка всех ресурсов
 */
function getResources() {
    global $db;
    
    try {
        // Выбираем все ресурсы
        $query = "SELECT id, name, description, base_price, rarity FROM resources ORDER BY rarity, name";
        
        $result = $db->query($query);
        
        if (!$result) {
            throw new Exception('Ошибка при получении ресурсов: ' . $db->error);
        }
        
        $resources = [];
        
        while ($row = $result->fetch_assoc()) {
            // Убедимся, что ID числовой
            $row['id'] = (int)$row['id'];
            $resources[] = $row;
        }
        
        jsonResponse(true, '', ['resources' => $resources]);
    } catch (Exception $e) {
        jsonResponse(false, $e->getMessage());
    }
}

/**
 * Получение инвентаря пользователя
 */
function getInventory() {
    global $db;
    
    try {
        // Получаем ID пользователя из запроса
        $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
        
        if ($user_id <= 0) {
            throw new Exception('Неверный ID пользователя');
        }
        
        // Выбираем инвентарь пользователя
        $query = "SELECT i.resource_id, r.name, i.amount, r.base_price, r.rarity 
                FROM inventory i 
                JOIN resources r ON i.resource_id = r.id 
                WHERE i.user_id = ?
                ORDER BY r.rarity DESC, r.name";
        
        $stmt = $db->prepare($query);
        
        if (!$stmt) {
            throw new Exception('Ошибка при подготовке запроса: ' . $db->error);
        }
        
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$result) {
            throw new Exception('Ошибка при выполнении запроса: ' . $stmt->error);
        }
        
        $inventory = [];
        
        while ($row = $result->fetch_assoc()) {
            // Убедимся, что ID ресурса числовой
            $row['resource_id'] = (int)$row['resource_id'];
            $inventory[] = $row;
        }
        
        jsonResponse(true, '', ['inventory' => $inventory]);
    } catch (Exception $e) {
        jsonResponse(false, $e->getMessage());
    }
}

/**
 * Запись истории добычи в базу данных
 */
function logMiningHistory($user_id, $location_id, $resource_id, $amount, $success, $mining_time) {
    global $db;
    
    // Проверяем входные данные
    $user_id = (int)$user_id;
    $location_id = (int)$location_id;
    $resource_id = (int)$resource_id;
    $amount = (int)$amount;
    $success = $success ? 1 : 0;
    $mining_time = (int)$mining_time;
    
    // Если пользователь не авторизован, не записываем историю
    if ($user_id <= 0) {
        return;
    }
    
    // Подготавливаем запрос
    $query = "INSERT INTO mining_history (user_id, location_id, resource_id, amount, success, mining_time) 
              VALUES (?, ?, ?, ?, ?, ?)";
    
    $stmt = $db->prepare($query);
    
    if (!$stmt) {
        error_log('Ошибка при подготовке запроса логирования добычи: ' . $db->error);
        return;
    }
    
    $stmt->bind_param("iiiiii", $user_id, $location_id, $resource_id, $amount, $success, $mining_time);
    
    if (!$stmt->execute()) {
        error_log('Ошибка при записи истории добычи: ' . $stmt->error);
    }
}

/**
 * Добыча ресурса - с добавлением записи в историю добычи
 */
function mineResource() {
    global $db;
    
    try {
        // Получаем данные из запроса
        $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
        $location_id = isset($_POST['location_id']) ? (int)$_POST['location_id'] : 0;
        $resource_id = isset($_POST['resource_id']) ? (int)$_POST['resource_id'] : 0;
        $mining_time = isset($_POST['mining_time']) ? (int)$_POST['mining_time'] : 0;
        
        // Проверяем данные
        if ($user_id <= 0) {
            throw new Exception('Неверный ID пользователя');
        }
        
        if ($location_id <= 0) {
            throw new Exception('Неверный ID локации');
        }
        
        if ($resource_id <= 0) {
            throw new Exception('Неверный ID ресурса');
        }
        
        // Проверяем наличие ресурса в локации
        $check_query = "SELECT lr.probability, lr.min_amount, lr.max_amount, l.difficulty 
                      FROM location_resources lr 
                      JOIN locations l ON lr.location_id = l.id 
                      WHERE lr.location_id = ? AND lr.resource_id = ?";
        
        $check_stmt = $db->prepare($check_query);
        
        if (!$check_stmt) {
            throw new Exception('Ошибка при подготовке запроса: ' . $db->error);
        }
        
        $check_stmt->bind_param("ii", $location_id, $resource_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        if ($check_result->num_rows === 0) {
            throw new Exception('Ресурс не найден в указанной локации');
        }
        
        $resource_info = $check_result->fetch_assoc();
        
        // Определяем успех добычи на основе вероятности и сложности локации
        $success_chance = $resource_info['probability'] / $resource_info['difficulty'];
        $roll = mt_rand() / mt_getrandmax();
        
        if ($roll > $success_chance) {
            // Записываем неудачную попытку в историю
            logMiningHistory($user_id, $location_id, $resource_id, 0, false, $mining_time);
            
            throw new Exception('Не удалось добыть ресурс. Попробуйте еще раз!');
        }
        
        // Определяем количество добытого ресурса
        $min_amount = $resource_info['min_amount'];
        $max_amount = $resource_info['max_amount'];
        $amount = mt_rand($min_amount, $max_amount);
        
        // Добавляем ресурс в инвентарь пользователя
        $inventory_query = "INSERT INTO inventory (user_id, resource_id, amount) 
                           VALUES (?, ?, ?) 
                           ON DUPLICATE KEY UPDATE amount = amount + ?";
        
        $inventory_stmt = $db->prepare($inventory_query);
        
        if (!$inventory_stmt) {
            throw new Exception('Ошибка при подготовке запроса: ' . $db->error);
        }
        
        $inventory_stmt->bind_param("iiii", $user_id, $resource_id, $amount, $amount);
        
        if (!$inventory_stmt->execute()) {
            throw new Exception('Ошибка при обновлении инвентаря: ' . $inventory_stmt->error);
        }
        
        // Записываем успешную добычу в историю
        logMiningHistory($user_id, $location_id, $resource_id, $amount, true, $mining_time);
        
        jsonResponse(true, 'Ресурс успешно добыт', ['amount' => $amount]);
    } catch (Exception $e) {
        jsonResponse(false, $e->getMessage());
    }
}

/**
 * Обновление инвентаря пользователя
 */
function updateInventory() {
    global $db;
    
    try {
        // Получаем данные из запроса
        $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
        $inventory = isset($_POST['inventory']) ? json_decode($_POST['inventory'], true) : [];
        
        // Проверяем данные
        if ($user_id <= 0) {
            throw new Exception('Неверный ID пользователя');
        }
        
        if (!is_array($inventory)) {
            throw new Exception('Неверный формат инвентаря');
        }
        
        // Удаляем старые записи инвентаря
        $delete_query = "DELETE FROM inventory WHERE user_id = ?";
        $delete_stmt = $db->prepare($delete_query);
        
        if (!$delete_stmt) {
            throw new Exception('Ошибка при подготовке запроса: ' . $db->error);
        }
        
        $delete_stmt->bind_param("i", $user_id);
        
        if (!$delete_stmt->execute()) {
            throw new Exception('Ошибка при обновлении инвентаря: ' . $delete_stmt->error);
        }
        
        // Если инвентарь не пуст, добавляем новые записи
        if (!empty($inventory)) {
            $insert_query = "INSERT INTO inventory (user_id, resource_id, amount) VALUES (?, ?, ?)";
            $insert_stmt = $db->prepare($insert_query);
            
            if (!$insert_stmt) {
                throw new Exception('Ошибка при подготовке запроса: ' . $db->error);
            }
            
            foreach ($inventory as $item) {
                if (!isset($item['resource_id']) || !isset($item['amount'])) {
                    continue;
                }
                
                $resource_id = (int)$item['resource_id'];
                $amount = (int)$item['amount'];
                
                if ($resource_id <= 0 || $amount <= 0) {
                    continue;
                }
                
                $insert_stmt->bind_param("iii", $user_id, $resource_id, $amount);
                $insert_stmt->execute();
            }
        }
        
        jsonResponse(true, 'Инвентарь успешно обновлен');
    } catch (Exception $e) {
        jsonResponse(false, $e->getMessage());
    }
}

/**
 * Обновление золота пользователя
 */
function updateGold() {
    global $db;
    
    try {
        // Получаем данные из запроса
        $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
        $gold = isset($_POST['gold']) ? (int)$_POST['gold'] : 0;
        
        // Проверяем данные
        if ($user_id <= 0) {
            throw new Exception('Неверный ID пользователя');
        }
        
        if ($gold < 0) {
            throw new Exception('Неверное количество золота');
        }
        
        // Обновляем золото пользователя
        $query = "UPDATE users SET gold = ? WHERE id = ?";
        $stmt = $db->prepare($query);
        
        if (!$stmt) {
            throw new Exception('Ошибка при подготовке запроса: ' . $db->error);
        }
        
        $stmt->bind_param("ii", $gold, $user_id);
        
        if (!$stmt->execute()) {
            throw new Exception('Ошибка при обновлении золота: ' . $stmt->error);
        }
        
        jsonResponse(true, 'Золото успешно обновлено');
    } catch (Exception $e) {
        jsonResponse(false, $e->getMessage());
    }
}

/**
 * Продажа ресурса
 */
function sellResource() {
    global $db;
    
    try {
        // Получаем данные из запроса
        $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
        $resource_id = isset($_POST['resource_id']) ? (int)$_POST['resource_id'] : 0;
        $amount = isset($_POST['amount']) ? (int)$_POST['amount'] : 0;
        $price = isset($_POST['price']) ? (int)$_POST['price'] : 0;
        
        // Проверяем данные
        if ($user_id <= 0) {
            throw new Exception('Неверный ID пользователя');
        }
        
        if ($resource_id <= 0) {
            throw new Exception('Неверный ID ресурса');
        }
        
        if ($amount <= 0) {
            throw new Exception('Неверное количество ресурса');
        }
        
        if ($price <= 0) {
            throw new Exception('Неверная цена');
        }
        
        // Начинаем транзакцию
        $db->begin_transaction();
        
        try {
            // Проверяем наличие ресурса в инвентаре
            $inventory_query = "SELECT amount FROM inventory WHERE user_id = ? AND resource_id = ?";
            $inventory_stmt = $db->prepare($inventory_query);
            
            if (!$inventory_stmt) {
                throw new Exception('Ошибка при подготовке запроса: ' . $db->error);
            }
            
            $inventory_stmt->bind_param("ii", $user_id, $resource_id);
            $inventory_stmt->execute();
            $inventory_result = $inventory_stmt->get_result();
            
            if ($inventory_result->num_rows === 0) {
                throw new Exception('Ресурс не найден в инвентаре');
            }
            
            $inventory_row = $inventory_result->fetch_assoc();
            
            if ($inventory_row['amount'] < $amount) {
                throw new Exception('Недостаточно ресурсов для продажи');
            }
            
            // Уменьшаем количество ресурса в инвентаре
            $update_inventory_query = "UPDATE inventory SET amount = amount - ? WHERE user_id = ? AND resource_id = ?";
            $update_inventory_stmt = $db->prepare($update_inventory_query);
            
            if (!$update_inventory_stmt) {
                throw new Exception('Ошибка при подготовке запроса: ' . $db->error);
            }
            
            $update_inventory_stmt->bind_param("iii", $amount, $user_id, $resource_id);
            
            if (!$update_inventory_stmt->execute()) {
                throw new Exception('Ошибка при обновлении инвентаря: ' . $update_inventory_stmt->error);
            }
            
            // Если ресурсов не осталось, удаляем запись из инвентаря
            if ($inventory_row['amount'] - $amount <= 0) {
                $delete_inventory_query = "DELETE FROM inventory WHERE user_id = ? AND resource_id = ?";
                $delete_inventory_stmt = $db->prepare($delete_inventory_query);
                
                if (!$delete_inventory_stmt) {
                    throw new Exception('Ошибка при подготовке запроса: ' . $db->error);
                }
                
                $delete_inventory_stmt->bind_param("ii", $user_id, $resource_id);
                
                if (!$delete_inventory_stmt->execute()) {
                    throw new Exception('Ошибка при обновлении инвентаря: ' . $delete_inventory_stmt->error);
                }
            }
            
            // Добавляем золото пользователю
            $total_price = $price * $amount;
            $update_gold_query = "UPDATE users SET gold = gold + ? WHERE id = ?";
            $update_gold_stmt = $db->prepare($update_gold_query);
            
            if (!$update_gold_stmt) {
                throw new Exception('Ошибка при подготовке запроса: ' . $db->error);
            }
            
            $update_gold_stmt->bind_param("ii", $total_price, $user_id);
            
            if (!$update_gold_stmt->execute()) {
                throw new Exception('Ошибка при обновлении золота: ' . $update_gold_stmt->error);
            }
            
            // Фиксируем транзакцию
            $db->commit();
            
            // Получаем обновленное количество золота
            $gold_query = "SELECT gold FROM users WHERE id = ?";
            $gold_stmt = $db->prepare($gold_query);
            
            if (!$gold_stmt) {
                throw new Exception('Ошибка при подготовке запроса: ' . $db->error);
            }
            
            $gold_stmt->bind_param("i", $user_id);
            $gold_stmt->execute();
            $gold_result = $gold_stmt->get_result();
            
            if (!$gold_result) {
                throw new Exception('Ошибка при получении золота: ' . $gold_stmt->error);
            }
            
            $gold_row = $gold_result->fetch_assoc();
            
            jsonResponse(true, 'Ресурс успешно продан', [
                'gold' => $gold_row['gold']
            ]);
        } catch (Exception $e) {
            // Откатываем транзакцию в случае ошибки
            $db->rollback();
            throw $e;
        }
    } catch (Exception $e) {
        jsonResponse(false, $e->getMessage());
    }
}