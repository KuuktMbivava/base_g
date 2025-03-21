// Дополнение к существующему объекту Chat

// Добавляем эти функции в модуль Chat
const chatExtension = {
    // Функция для инициализации фиксированного чата
    setupFixedChat: function() {
        // Проверяем, существует ли контейнер чата
        if ($('#chat-container').length === 0) {
            console.warn('Контейнер чата не найден в DOM');
            return;
        }
        
        // Перемещаем контейнер чата в конец body
        $('body').append($('#chat-container'));
        
        // Добавляем кнопку для сворачивания/разворачивания чата
        if ($('.toggle-chat-button').length === 0) {
            $('#chat-header').append('<button class="toggle-chat-button">▼</button>');
        }
        
        // Обработчик для сворачивания/разворачивания чата
        $('#chat-header, .toggle-chat-button').on('click', function() {
            $('#chat-container').toggleClass('collapsed');
            // Меняем иконку в зависимости от состояния
            if ($('#chat-container').hasClass('collapsed')) {
                $('.toggle-chat-button').html('▲');
            } else {
                $('.toggle-chat-button').html('▼');
                // При разворачивании прокручиваем чат вниз
                Chat.scrollChatToBottom();
            }
        });
        
        // Обработчик для полей ввода и кнопок в чате
        $('#chat-input, #chat-send-button, #chat-clear-button').on('click', function(e) {
            // Останавливаем всплытие события, чтобы не сворачивать чат
            e.stopPropagation();
        });
        
        // Устанавливаем начальное состояние чата (свернут)
        $('#chat-container').addClass('collapsed');
    },
    
    // Функция для скрытия/показа чата на определенных экранах
    toggleChatVisibility: function(screen) {
        // Список экранов, где чат должен быть скрыт
        const hideOnScreens = ['inventory-screen', 'stats-screen'];
        
        if (hideOnScreens.includes(screen)) {
            $('body').addClass('hide-chat');
        } else {
            $('body').removeClass('hide-chat');
        }
    }
};

// Расширяем оригинальный объект Chat
// Вызвать после загрузки оригинального Chat
function extendChatModule() {
    // Сохраняем оригинальный метод init
    const originalInit = Chat.init;
    
    // Перезаписываем метод init
    Chat.init = function() {
        // Вызываем оригинальный метод
        originalInit.apply(this, arguments);
        
        // Добавляем наши расширения
        this.setupFixedChat = chatExtension.setupFixedChat;
        this.toggleChatVisibility = chatExtension.toggleChatVisibility;
        
        // Вызываем новые методы
        this.setupFixedChat();
    };
}

// Это добавление к Game.switchScreen для управления видимостью чата
// Добавляем эту логику после загрузки Game
function extendGameModule() {
    // Сохраняем оригинальный метод switchScreen
    const originalSwitchScreen = Game.switchScreen;
    
    // Перезаписываем метод switchScreen
    Game.switchScreen = function(screenId) {
        // Вызываем оригинальный метод
        originalSwitchScreen.apply(this, arguments);
        
        // Управляем видимостью чата
        if (typeof Chat !== 'undefined' && Chat.toggleChatVisibility) {
            Chat.toggleChatVisibility(screenId);
        }
    };
}