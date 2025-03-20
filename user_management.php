<?php
/**
 * Управление пользователями
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
    case 'register':
        registerUser();
        break;
        
    case 'login':
        loginUser();
        break;
        
    case 'check_auth':
        checkAuth();
        break;
        
    case 'logout':
        logoutUser();
        break;
        
    default:
        jsonResponse(false, 'Неизвестное действие');
}

/**
 * Регистрация нового пользователя
 */
function registerUser() {
    global $db;
    
    // Получаем данные из запроса
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    // Проверяем наличие данных
    if (empty($username) || empty($password)) {
        jsonResponse(false, 'Необходимо указать имя пользователя и пароль');
    }
    
    // Проверяем длину имени пользователя
    if (strlen($username) < 3 || strlen($username) > 64) {
        jsonResponse(false, 'Имя пользователя должно содержать от 3 до 64 символов');
    }
    
    // Проверяем длину пароля
    if (strlen($password) < 6) {
        jsonResponse(false, 'Пароль должен содержать не менее 6 символов');
    }
    
    // Проверяем, не занято ли имя пользователя
    $check_query = "SELECT COUNT(*) as count FROM users WHERE username = ?";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bind_param("s", $username);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    $row = $result->fetch_assoc();
    
    if ($row['count'] > 0) {
        jsonResponse(false, 'Это имя пользователя уже занято');
    }
    
    // Хешируем пароль
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Добавляем пользователя в базу данных
    $insert_query = "INSERT INTO users (username, password_hash) VALUES (?, ?)";
    $insert_stmt = $db->prepare($insert_query);
    $insert_stmt->bind_param("ss", $username, $password_hash);
    
    if ($insert_stmt->execute()) {
        jsonResponse(true, 'Регистрация успешна');
    } else {
        jsonResponse(false, 'Ошибка при регистрации пользователя');
    }
}

/**
 * Аутентификация пользователя
 */
function loginUser() {
    global $db, $secret_key, $token_lifetime;
    
    // Получаем данные из запроса
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    // Проверяем наличие данных
    if (empty($username) || empty($password)) {
        jsonResponse(false, 'Необходимо указать имя пользователя и пароль');
    }
    
    // Ищем пользователя в базе данных
    $query = "SELECT id, username, password_hash, gold FROM users WHERE username = ?";
    $stmt = $db->prepare($query);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        jsonResponse(false, 'Неверное имя пользователя или пароль');
    }
    
    $user = $result->fetch_assoc();
    
    // Проверяем пароль
    if (!password_verify($password, $user['password_hash'])) {
        jsonResponse(false, 'Неверное имя пользователя или пароль');
    }
    
    // Обновляем время последнего входа
    $update_query = "UPDATE users SET last_login = NOW() WHERE id = ?";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->bind_param("i", $user['id']);
    $update_stmt->execute();
    
    // Создаем токен авторизации
    $token = generateToken();
    $expires_at = date('Y-m-d H:i:s', time() + $token_lifetime);
    
    // Удаляем старые токены пользователя
    $delete_query = "DELETE FROM auth_tokens WHERE user_id = ?";
    $delete_stmt = $db->prepare($delete_query);
    $delete_stmt->bind_param("i", $user['id']);
    $delete_stmt->execute();
    
    // Сохраняем новый токен
    $token_query = "INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)";
    $token_stmt = $db->prepare($token_query);
    $token_stmt->bind_param("iss", $user['id'], $token, $expires_at);
    
    if (!$token_stmt->execute()) {
        jsonResponse(false, 'Ошибка при создании токена авторизации');
    }
    
    // Отправляем успешный ответ
    jsonResponse(true, 'Вход выполнен успешно', [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'gold' => $user['gold'],
        'token' => $token
    ]);
}

/**
 * Проверка авторизации по токену
 */
function checkAuth() {
    global $db;
    
    // Получаем токен из запроса
    $token = isset($_POST['token']) ? $_POST['token'] : '';
    
    if (empty($token)) {
        jsonResponse(false, 'Токен не указан');
    }
    
    // Ищем токен в базе данных
    $query = "SELECT a.user_id, a.expires_at, u.username, u.gold 
              FROM auth_tokens a 
              JOIN users u ON a.user_id = u.id 
              WHERE a.token = ? AND a.expires_at > NOW()";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        jsonResponse(false, 'Недействительный или истекший токен');
    }
    
    $auth = $result->fetch_assoc();
    
    // Отправляем успешный ответ
    jsonResponse(true, 'Авторизация подтверждена', [
        'user_id' => $auth['user_id'],
        'username' => $auth['username'],
        'gold' => $auth['gold']
    ]);
}

/**
 * Выход пользователя (удаление токена)
 */
function logoutUser() {
    global $db;
    
    // Получаем токен из запроса
    $token = isset($_POST['token']) ? $_POST['token'] : '';
    
    if (empty($token)) {
        jsonResponse(false, 'Токен не указан');
    }
    
    // Удаляем токен из базы данных
    $query = "DELETE FROM auth_tokens WHERE token = ?";
    $stmt = $db->prepare($query);
    $stmt->bind_param("s", $token);
    $stmt->execute();
    
    jsonResponse(true, 'Выход выполнен успешно');
}

/**
 * Генерация случайного токена
 */
function generateToken() {
    global $secret_key;
    
    // Генерируем случайную строку
    $random = bin2hex(random_bytes(32));
    
    // Добавляем временную метку
    $timestamp = time();
    
    // Создаем токен
    $token = hash('sha256', $random . $timestamp . $secret_key);
    
    return $token;
}