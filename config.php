<?php
/**
 * Файл конфигурации базы данных
 * Ресурсная Империя
 */

// Параметры подключения к базе данных
$db_host = 'localhost';
$db_name = 'game_db_3';
$db_user = 'root';
$db_pass = '';

// Установка соединения с базой данных
try {
    $db = new mysqli($db_host, $db_user, $db_pass, $db_name);
    
    // Проверка соединения
    if ($db->connect_error) {
        throw new Exception("Ошибка соединения с базой данных: " . $db->connect_error);
    }
    
    // Установка кодировки
    $db->set_charset("utf8");
} catch (Exception $e) {
    // Логируем ошибку (в реальном проекте)
    error_log($e->getMessage());
    
    // Для отладки можно раскомментировать следующую строку
    // echo "Ошибка: " . $e->getMessage();
}

// Секретный ключ для генерации токенов
$secret_key = 'ваш_секретный_ключ_для_шифрования';

// Время жизни токена в секундах (30 дней)
$token_lifetime = 30 * 24 * 60 * 60;

// Функция для ответа в формате JSON
function jsonResponse($success, $message = '', $data = []) {
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    if (!empty($data)) {
        $response = array_merge($response, $data);
    }
    
    echo json_encode($response);
    exit;
}