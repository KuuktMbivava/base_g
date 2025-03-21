<?php
/**
 * Простой серверный скрипт чата для игры "Ресурсная Империя"
 */

// Устанавливаем заголовок Content-Type для JSON
header('Content-Type: application/json; charset=utf-8');

// Включаем вывод ошибок только для отладки
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

// Путь к файлу для хранения сообщений
$chat_file = 'chat.log';

// Максимальное число сообщений для хранения
$max_messages = 50;
$max_message_length = 500; // Максимальная длина сообщения

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false, 
        'message' => 'Неверный метод запроса'
    ]);
    exit;
}

// Получаем действие из запроса и экранируем его
$action = isset($_POST['action']) ? htmlspecialchars($_POST['action']) : '';

// Проверяем доступность файла чата
if (!is_writable(dirname($chat_file))) {
    echo json_encode([
        'success' => false, 
        'message' => 'Директория чата недоступна для записи'
    ]);
    exit;
}

// Обрабатываем действие
switch ($action) {
    case 'get_messages':
        getMessages();
        break;
    case 'send_message':
        sendMessage();
        break;
    default:
        echo json_encode([
            'success' => false, 
            'message' => 'Неизвестное действие'
        ]);
        break;
}

/**
 * Получение сообщений из файла
 */
function getMessages() {
    global $chat_file, $max_messages;
    
    try {
        // Проверяем, существует ли файл
        if (!file_exists($chat_file)) {
            // Если файла нет, создаем его с первым системным сообщением
            $first_message = [
                'username' => 'Система',
                'message' => 'Добро пожаловать в чат Ресурсной Империи!',
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
            if (file_put_contents($chat_file, json_encode($first_message, JSON_UNESCAPED_UNICODE) . PHP_EOL) === false) {
                throw new Exception('Не удалось создать файл чата');
            }
        }
        
        // Проверяем, доступен ли файл для чтения
        if (!is_readable($chat_file)) {
            throw new Exception('Файл чата недоступен для чтения');
        }
        
        // Читаем все строки из файла
        $lines = file($chat_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        // Если файл пуст или произошла ошибка чтения
        if ($lines === false) {
            throw new Exception('Ошибка чтения файла чата');
        }
        
        // Если файл пуст, возвращаем пустой массив
        if (empty($lines)) {
            echo json_encode([
                'success' => true, 
                'messages' => []
            ]);
            exit;
        }
        
        // Берём последние $max_messages строк
        $lines = array_slice($lines, -$max_messages);
        
        $messages = [];
        foreach ($lines as $line) {
            $msg = json_decode($line, true);
            if ($msg) {
                $messages[] = $msg;
            }
        }
        
        echo json_encode([
            'success' => true, 
            'messages' => $messages
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => 'Ошибка при получении сообщений: ' . $e->getMessage()
        ]);
    }
}

/**
 * Отправка нового сообщения
 */
function sendMessage() {
    global $chat_file, $max_message_length;
    
    try {
        $username = isset($_POST['username']) ? trim($_POST['username']) : '';
        $message = isset($_POST['message']) ? trim($_POST['message']) : '';
        
        // Проверяем данные
        if ($username === '' || $message === '') {
            echo json_encode([
                'success' => false, 
                'message' => 'Необходимо указать имя пользователя и сообщение'
            ]);
            exit;
        }
        
        // Ограничиваем длину сообщения
        if (mb_strlen($message) > $max_message_length) {
            $message = mb_substr($message, 0, $max_message_length) . '...';
        }
        
        // Формируем метку времени
        $timestamp = date('Y-m-d H:i:s');
        
        // Создаем объект сообщения
        $msgData = [
            'username' => htmlspecialchars($username, ENT_QUOTES, 'UTF-8'),
            'message' => htmlspecialchars($message, ENT_QUOTES, 'UTF-8'),
            'timestamp' => $timestamp
        ];
        
        // Преобразуем в JSON и добавляем в файл
        $line = json_encode($msgData, JSON_UNESCAPED_UNICODE) . PHP_EOL;
        
        // Проверяем, доступен ли файл для записи
        if (!is_writable($chat_file) && file_exists($chat_file)) {
            throw new Exception('Файл чата недоступен для записи');
        }
        
        // Сохраняем сообщение в файл
        if (file_put_contents($chat_file, $line, FILE_APPEND) !== false) {
            echo json_encode(['success' => true]);
        } else {
            throw new Exception('Ошибка при сохранении сообщения');
        }
    } catch (Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => 'Ошибка отправки сообщения: ' . $e->getMessage()
        ]);
    }
}