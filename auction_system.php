<?php
/**
 * Система аукционов
 * Ресурсная Империя
 */

// Подключаем конфигурацию
require_once 'config.php';

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Неверный метод запроса');
}

// Определяем действие
$action = isset($_POST['action']) ? $_POST['action'] : '';

switch ($action) {
    case 'get_active_auctions':
        getActiveAuctions();
        break;
        
    case 'get_my_auctions':
        getMyAuctions();
        break;
        
    case 'create_auction':
        createAuction();
        break;
        
    case 'cancel_auction':
        cancelAuction();
        break;
        
    case 'place_bid':
        placeBid();
        break;
        
    default:
        jsonResponse(false, 'Неизвестное действие');
}

/**
 * Получение списка активных аукционов
 */
function getActiveAuctions() {
    global $db;
    
    // Получаем ID пользователя из запроса
    $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
    
    if ($user_id <= 0) {
        jsonResponse(false, 'Неверный ID пользователя');
    }
    
    // Обновляем статус завершившихся аукционов
    updateAuctionsStatus();
    
    // Выбираем активные аукционы, кроме созданных пользователем
    $query = "SELECT a.id, a.seller_id, u.username as seller, a.resource_id, r.name as resource_name, 
                     r.rarity as resource_rarity, a.quantity, a.starting_price, a.current_price, 
                     a.current_bidder_id, u2.username as current_bidder, a.end_time,
                     (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bids_count
              FROM auctions a
              JOIN users u ON a.seller_id = u.id
              JOIN resources r ON a.resource_id = r.id
              LEFT JOIN users u2 ON a.current_bidder_id = u2.id
              WHERE a.status = 'active' AND a.seller_id != ?
              ORDER BY a.end_time";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $auctions = [];
    
    while ($row = $result->fetch_assoc()) {
        $auctions[] = $row;
    }
    
    jsonResponse(true, '', ['auctions' => $auctions]);
}

/**
 * Получение списка моих аукционов
 */
function getMyAuctions() {
    global $db;
    
    // Получаем ID пользователя из запроса
    $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
    
    if ($user_id <= 0) {
        jsonResponse(false, 'Неверный ID пользователя');
    }
    
    // Обновляем статус завершившихся аукционов
    updateAuctionsStatus();
    
    // Выбираем аукционы, созданные пользователем
    $query = "SELECT a.id, a.seller_id, u.username as seller, a.resource_id, r.name as resource_name, 
                     r.rarity as resource_rarity, a.quantity, a.starting_price, a.current_price, 
                     a.current_bidder_id, u2.username as current_bidder, a.end_time,
                     (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bids_count
              FROM auctions a
              JOIN users u ON a.seller_id = u.id
              JOIN resources r ON a.resource_id = r.id
              LEFT JOIN users u2 ON a.current_bidder_id = u2.id
              WHERE a.seller_id = ? AND a.status = 'active'
              ORDER BY a.end_time";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $auctions = [];
    
    while ($row = $result->fetch_assoc()) {
        $auctions[] = $row;
    }
    
    jsonResponse(true, '', ['auctions' => $auctions]);
}

/**
 * Создание нового аукциона
 */
function createAuction() {
    global $db;
    
    // Получаем данные из запроса
    $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
    $resource_id = isset($_POST['resource_id']) ? (int)$_POST['resource_id'] : 0;
    $quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 0;
    $start_price = isset($_POST['start_price']) ? (int)$_POST['start_price'] : 0;
    $duration = isset($_POST['duration']) ? (int)$_POST['duration'] : 24;
    
    // Проверяем данные
    if ($user_id <= 0) {
        jsonResponse(false, 'Неверный ID пользователя');
    }
    
    if ($resource_id <= 0) {
        jsonResponse(false, 'Неверный ID ресурса');
    }
    
    if ($quantity <= 0) {
        jsonResponse(false, 'Неверное количество ресурса');
    }
    
    if ($start_price <= 0) {
        jsonResponse(false, 'Неверная начальная цена');
    }
    
    if ($duration <= 0 || $duration > 48) {
        jsonResponse(false, 'Неверная длительность аукциона');
    }
    
    // Начинаем транзакцию
    $db->begin_transaction();
    
    try {
        // Проверяем наличие ресурса в инвентаре
        $inventory_query = "SELECT amount FROM inventory WHERE user_id = ? AND resource_id = ?";
        $inventory_stmt = $db->prepare($inventory_query);
        $inventory_stmt->bind_param("ii", $user_id, $resource_id);
        $inventory_stmt->execute();
        $inventory_result = $inventory_stmt->get_result();
        
        if ($inventory_result->num_rows === 0) {
            throw new Exception('Ресурс не найден в инвентаре');
        }
        
        $inventory_row = $inventory_result->fetch_assoc();
        
        if ($inventory_row['amount'] < $quantity) {
            throw new Exception('Недостаточно ресурсов для создания аукциона');
        }
        
        // Уменьшаем количество ресурса в инвентаре
        $update_inventory_query = "UPDATE inventory SET amount = amount - ? WHERE user_id = ? AND resource_id = ?";
        $update_inventory_stmt = $db->prepare($update_inventory_query);
        $update_inventory_stmt->bind_param("iii", $quantity, $user_id, $resource_id);
        
        if (!$update_inventory_stmt->execute()) {
            throw new Exception('Ошибка при обновлении инвентаря');
        }
        
        // Если ресурсов не осталось, удаляем запись из инвентаря
        if ($inventory_row['amount'] - $quantity <= 0) {
            $delete_inventory_query = "DELETE FROM inventory WHERE user_id = ? AND resource_id = ?";
            $delete_inventory_stmt = $db->prepare($delete_inventory_query);
            $delete_inventory_stmt->bind_param("ii", $user_id, $resource_id);
            
            if (!$delete_inventory_stmt->execute()) {
                throw new Exception('Ошибка при обновлении инвентаря');
            }
        }
        
        // Создаем аукцион
        $end_time = date('Y-m-d H:i:s', time() + $duration * 60 * 60);
        
        $auction_query = "INSERT INTO auctions (seller_id, resource_id, quantity, starting_price, current_price, end_time) 
                          VALUES (?, ?, ?, ?, ?, ?)";
        $auction_stmt = $db->prepare($auction_query);
        $auction_stmt->bind_param("iiiiss", $user_id, $resource_id, $quantity, $start_price, $start_price, $end_time);
        
        if (!$auction_stmt->execute()) {
            throw new Exception('Ошибка при создании аукциона');
        }
        
        // Получаем ID созданного аукциона
        $auction_id = $db->insert_id;
        
        // Фиксируем транзакцию
        $db->commit();
        
        jsonResponse(true, 'Аукцион успешно создан', ['auction_id' => $auction_id]);
    } catch (Exception $e) {
        // Откатываем транзакцию в случае ошибки
        $db->rollback();
        jsonResponse(false, $e->getMessage());
    }
}

/**
 * Отмена аукциона
 */
function cancelAuction() {
    global $db;
    
    // Получаем данные из запроса
    $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
    $auction_id = isset($_POST['auction_id']) ? (int)$_POST['auction_id'] : 0;
    
    // Проверяем данные
    if ($user_id <= 0) {
        jsonResponse(false, 'Неверный ID пользователя');
    }
    
    if ($auction_id <= 0) {
        jsonResponse(false, 'Неверный ID аукциона');
    }
    
    // Начинаем транзакцию
    $db->begin_transaction();
    
    try {
        // Проверяем, существует ли аукцион и принадлежит ли он пользователю
        $auction_query = "SELECT a.id, a.seller_id, a.resource_id, a.quantity, a.current_bidder_id,
                                 (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as bids_count
                          FROM auctions a
                          WHERE a.id = ? AND a.seller_id = ? AND a.status = 'active'";
        $auction_stmt = $db->prepare($auction_query);
        $auction_stmt->bind_param("ii", $auction_id, $user_id);
        $auction_stmt->execute();
        $auction_result = $auction_stmt->get_result();
        
        if ($auction_result->num_rows === 0) {
            throw new Exception('Аукцион не найден или вы не являетесь его владельцем');
        }
        
        $auction = $auction_result->fetch_assoc();
        
        // Проверяем, есть ли ставки на аукционе
        if ($auction['bids_count'] > 0 || $auction['current_bidder_id'] !== null) {
            throw new Exception('Нельзя отменить аукцион, на который уже сделаны ставки');
        }
        
        // Возвращаем ресурсы в инвентарь
        $inventory_query = "INSERT INTO inventory (user_id, resource_id, amount) 
                            VALUES (?, ?, ?) 
                            ON DUPLICATE KEY UPDATE amount = amount + ?";
        $inventory_stmt = $db->prepare($inventory_query);
        $inventory_stmt->bind_param("iiii", $user_id, $auction['resource_id'], $auction['quantity'], $auction['quantity']);
        
        if (!$inventory_stmt->execute()) {
            throw new Exception('Ошибка при обновлении инвентаря');
        }
        
        // Отменяем аукцион
        $update_auction_query = "UPDATE auctions SET status = 'cancelled' WHERE id = ?";
        $update_auction_stmt = $db->prepare($update_auction_query);
        $update_auction_stmt->bind_param("i", $auction_id);
        
        if (!$update_auction_stmt->execute()) {
            throw new Exception('Ошибка при отмене аукциона');
        }
        
        // Фиксируем транзакцию
        $db->commit();
        
        jsonResponse(true, 'Аукцион успешно отменен');
    } catch (Exception $e) {
        // Откатываем транзакцию в случае ошибки
        $db->rollback();
        jsonResponse(false, $e->getMessage());
    }
}

/**
 * Размещение ставки на аукцион
 */
function placeBid() {
    global $db;
    
    // Получаем данные из запроса
    $user_id = isset($_POST['user_id']) ? (int)$_POST['user_id'] : 0;
    $auction_id = isset($_POST['auction_id']) ? (int)$_POST['auction_id'] : 0;
    $bid_amount = isset($_POST['bid_amount']) ? (int)$_POST['bid_amount'] : 0;
    
    // Проверяем данные
    if ($user_id <= 0) {
        jsonResponse(false, 'Неверный ID пользователя');
    }
    
    if ($auction_id <= 0) {
        jsonResponse(false, 'Неверный ID аукциона');
    }
    
    if ($bid_amount <= 0) {
        jsonResponse(false, 'Неверная сумма ставки');
    }
    
    // Начинаем транзакцию
    $db->begin_transaction();
    
    try {
        // Обновляем статус завершившихся аукционов
        updateAuctionsStatus();
        
        // Проверяем, существует ли аукцион
        $auction_query = "SELECT a.id, a.seller_id, a.current_price, a.current_bidder_id, a.end_time
                          FROM auctions a
                          WHERE a.id = ? AND a.status = 'active'";
        $auction_stmt = $db->prepare($auction_query);
        $auction_stmt->bind_param("i", $auction_id);
        $auction_stmt->execute();
        $auction_result = $auction_stmt->get_result();
        
        if ($auction_result->num_rows === 0) {
            throw new Exception('Аукцион не найден или уже завершен');
        }
        
        $auction = $auction_result->fetch_assoc();
        
        // Проверяем, не является ли пользователь владельцем аукциона
        if ($auction['seller_id'] == $user_id) {
            throw new Exception('Вы не можете сделать ставку на свой аукцион');
        }
        
        // Проверяем, не является ли пользователь текущим победителем
        if ($auction['current_bidder_id'] == $user_id) {
            throw new Exception('Вы уже являетесь текущим победителем аукциона');
        }
        
        // Проверяем, достаточно ли высока ставка
        if ($bid_amount <= $auction['current_price']) {
            throw new Exception('Ставка должна быть выше текущей цены');
        }
        
        // Проверяем, не закончился ли аукцион
        $now = new DateTime();
        $end_time = new DateTime($auction['end_time']);
        
        if ($now > $end_time) {
            throw new Exception('Аукцион уже завершен');
        }
        
        // Проверяем, достаточно ли у пользователя золота
        $user_query = "SELECT gold FROM users WHERE id = ?";
        $user_stmt = $db->prepare($user_query);
        $user_stmt->bind_param("i", $user_id);
        $user_stmt->execute();
        $user_result = $user_stmt->get_result();
        
        if ($user_result->num_rows === 0) {
            throw new Exception('Пользователь не найден');
        }
        
        $user = $user_result->fetch_assoc();
        
        if ($user['gold'] < $bid_amount) {
            throw new Exception('Недостаточно золота для ставки');
        }
        
        // Если есть предыдущий победитель, возвращаем ему золото
        if ($auction['current_bidder_id'] !== null) {
            $refund_query = "UPDATE users SET gold = gold + ? WHERE id = ?";
            $refund_stmt = $db->prepare($refund_query);
            $refund_stmt->bind_param("ii", $auction['current_price'], $auction['current_bidder_id']);
            
            if (!$refund_stmt->execute()) {
                throw new Exception('Ошибка при возврате золота предыдущему победителю');
            }
        }
        
        // Резервируем золото пользователя для ставки
        $update_gold_query = "UPDATE users SET gold = gold - ? WHERE id = ?";
        $update_gold_stmt = $db->prepare($update_gold_query);
        $update_gold_stmt->bind_param("ii", $bid_amount, $user_id);
        
        if (!$update_gold_stmt->execute()) {
            throw new Exception('Ошибка при обновлении золота');
        }
        
        // Обновляем информацию об аукционе
        $update_auction_query = "UPDATE auctions SET current_price = ?, current_bidder_id = ? WHERE id = ?";
        $update_auction_stmt = $db->prepare($update_auction_query);
        $update_auction_stmt->bind_param("iii", $bid_amount, $user_id, $auction_id);
        
        if (!$update_auction_stmt->execute()) {
            throw new Exception('Ошибка при обновлении информации об аукционе');
        }
        
        // Добавляем запись о ставке
        $bid_query = "INSERT INTO bids (auction_id, user_id, bid_amount) VALUES (?, ?, ?)";
        $bid_stmt = $db->prepare($bid_query);
        $bid_stmt->bind_param("iii", $auction_id, $user_id, $bid_amount);
        
        if (!$bid_stmt->execute()) {
            throw new Exception('Ошибка при добавлении ставки');
        }
        
        // Продлеваем время аукциона, если до окончания осталось менее 5 минут
        $time_diff = $end_time->getTimestamp() - $now->getTimestamp();
        
        if ($time_diff < 300) { // 5 минут в секундах
            $new_end_time = new DateTime();
            $new_end_time->add(new DateInterval('PT5M')); // Добавляем 5 минут
            
            $extend_query = "UPDATE auctions SET end_time = ? WHERE id = ?";
            $extend_stmt = $db->prepare($extend_query);
            $new_end_time_str = $new_end_time->format('Y-m-d H:i:s');
            $extend_stmt->bind_param("si", $new_end_time_str, $auction_id);
            
            $extend_stmt->execute();
        }
        
        // Фиксируем транзакцию
        $db->commit();
        
        // Получаем обновленное количество золота
        $gold_query = "SELECT gold FROM users WHERE id = ?";
        $gold_stmt = $db->prepare($gold_query);
        $gold_stmt->bind_param("i", $user_id);
        $gold_stmt->execute();
        $gold_result = $gold_stmt->get_result();
        $gold_row = $gold_result->fetch_assoc();
        
        jsonResponse(true, 'Ставка успешно сделана', [
            'gold' => $gold_row['gold']
        ]);
    } catch (Exception $e) {
        // Откатываем транзакцию в случае ошибки
        $db->rollback();
        jsonResponse(false, $e->getMessage());
    }
}

/**
 * Обновление статуса завершившихся аукционов
 */
function updateAuctionsStatus() {
    global $db;
    
    // Находим все завершившиеся активные аукционы
    $query = "SELECT id, seller_id, resource_id, quantity, current_bidder_id, current_price 
              FROM auctions 
              WHERE status = 'active' AND end_time <= NOW()";
    
    $result = $db->query($query);
    
    if ($result->num_rows === 0) {
        return; // Нет завершившихся аукционов
    }
    
    while ($auction = $result->fetch_assoc()) {
        // Начинаем транзакцию для каждого аукциона
        $db->begin_transaction();
        
        try {
            // Если есть победитель, передаем ресурсы и золото
            if ($auction['current_bidder_id'] !== null) {
                // Передаем ресурсы победителю
                $inventory_query = "INSERT INTO inventory (user_id, resource_id, amount) 
                                    VALUES (?, ?, ?) 
                                    ON DUPLICATE KEY UPDATE amount = amount + ?";
                
                $inventory_stmt = $db->prepare($inventory_query);
                $inventory_stmt->bind_param("iiii", 
                    $auction['current_bidder_id'], 
                    $auction['resource_id'], 
                    $auction['quantity'], 
                    $auction['quantity']
                );
                
                if (!$inventory_stmt->execute()) {
                    throw new Exception('Ошибка при передаче ресурсов победителю');
                }
                
                // Передаем золото продавцу
                $gold_query = "UPDATE users SET gold = gold + ? WHERE id = ?";
                $gold_stmt = $db->prepare($gold_query);
                $gold_stmt->bind_param("ii", $auction['current_price'], $auction['seller_id']);
                
                if (!$gold_stmt->execute()) {
                    throw new Exception('Ошибка при передаче золота продавцу');
                }
            } else {
                // Если победителя нет, возвращаем ресурсы продавцу
                $inventory_query = "INSERT INTO inventory (user_id, resource_id, amount) 
                                    VALUES (?, ?, ?) 
                                    ON DUPLICATE KEY UPDATE amount = amount + ?";
                
                $inventory_stmt = $db->prepare($inventory_query);
                $inventory_stmt->bind_param("iiii", 
                    $auction['seller_id'], 
                    $auction['resource_id'], 
                    $auction['quantity'], 
                    $auction['quantity']
                );
                
                if (!$inventory_stmt->execute()) {
                    throw new Exception('Ошибка при возврате ресурсов продавцу');
                }
            }
            
            // Обновляем статус аукциона
            $update_query = "UPDATE auctions SET status = 'completed' WHERE id = ?";
            $update_stmt = $db->prepare($update_query);
            $update_stmt->bind_param("i", $auction['id']);
            
            if (!$update_stmt->execute()) {
                throw new Exception('Ошибка при обновлении статуса аукциона');
            }
            
            // Фиксируем транзакцию
            $db->commit();
        } catch (Exception $e) {
            // Откатываем транзакцию в случае ошибки
            $db->rollback();
            
            // Логируем ошибку (в реальном проекте)
            error_log('Ошибка при обработке завершившегося аукциона: ' . $e->getMessage());
        }
    }
}