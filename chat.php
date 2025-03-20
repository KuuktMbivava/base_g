<?php
header('Content-Type: application/json');

// Путь к файлу для хранения сообщений
$chat_file = 'chat.log';
// Максимальное число сообщений для возврата клиенту
$max_messages = 50;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Неверный метод запроса']);
    exit;
}

$action = isset($_POST['action']) ? $_POST['action'] : '';

if ($action === 'get_messages') {
    if (!file_exists($chat_file)) {
        // Если файла ещё нет, возвращаем пустой список
        echo json_encode(['success' => true, 'messages' => []]);
        exit;
    }
    // Читаем все строки из файла
    $lines = file($chat_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    // Берём последние $max_messages строк
    $messages = array_slice($lines, -$max_messages);
    $result = [];
    foreach ($messages as $line) {
        $msg = json_decode($line, true);
        if ($msg) {
            $result[] = $msg;
        }
    }
    echo json_encode(['success' => true, 'messages' => $result]);
    exit;
} elseif ($action === 'send_message') {
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $message = isset($_POST['message']) ? trim($_POST['message']) : '';
    if ($username === '' || $message === '') {
        echo json_encode(['success' => false, 'message' => 'Необходимо указать имя пользователя и сообщение']);
        exit;
    }
    // Формируем метку времени
    $timestamp = date('Y-m-d H:i:s');
    $msgData = [
        'username'  => htmlspecialchars($username, ENT_QUOTES, 'UTF-8'),
        'message'   => htmlspecialchars($message, ENT_QUOTES, 'UTF-8'),
        'timestamp' => $timestamp
    ];
    $line = json_encode($msgData) . PHP_EOL;
    // Добавляем строку в файл
    file_put_contents($chat_file, $line, FILE_APPEND);
    echo json_encode(['success' => true]);
    exit;
} else {
    echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
    exit;
}
?>
