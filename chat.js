/**
 * Модуль чата для игры "Ресурсная Империя"
 * Реализует отправку и получение сообщений с помощью AJAX.
 */

const Chat = {
    refreshInterval: null,

    init: function() {
        console.log('Инициализация модуля чата');
        this.initEventHandlers();
        this.loadChatMessages();
        // Обновляем чат каждые 3 секунды
        this.refreshInterval = setInterval(() => {
            Chat.loadChatMessages();
        }, 3000);
    },

    initEventHandlers: function() {
        // Отправка сообщения по клику на кнопку
        $('#chat-send-button').on('click', function() {
            Chat.sendMessage();
        });
        // Отправка сообщения при нажатии Enter
        $('#chat-input').on('keypress', function(e) {
            if (e.which === 13) {
                Chat.sendMessage();
            }
        });
    },

    loadChatMessages: function() {
        $.ajax({
            url: 'chat.php',
            type: 'POST',
            data: { action: 'get_messages' },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    if (result.success && result.messages) {
                        Chat.renderMessages(result.messages);
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке сообщений чата:', error);
                }
            },
            error: function() {
                console.error('Ошибка подключения при загрузке сообщений чата');
            }
        });
    },

    renderMessages: function(messages) {
        // Ожидается, что messages – массив объектов { username, message, timestamp }
        const chatContainer = $('#chat-messages');
        chatContainer.empty();
        messages.forEach(msg => {
            const messageHtml = `
                <div class="chat-message">
                    <span class="chat-username">${msg.username}:</span>
                    <span class="chat-text">${msg.message}</span>
                    <span class="chat-timestamp">${msg.timestamp}</span>
                </div>
            `;
            chatContainer.append(messageHtml);
        });
        // Прокручиваем чат вниз
        chatContainer.scrollTop(chatContainer[0].scrollHeight);
    },

    sendMessage: function() {
        const message = $('#chat-input').val().trim();
        if (!message) return;
        const username = Game.player.loggedIn ? Game.player.name : 'Гость';
        $.ajax({
            url: 'chat.php',
            type: 'POST',
            data: {
                action: 'send_message',
                username: username,
                message: message
            },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    if (result.success) {
                        $('#chat-input').val('');
                        Chat.loadChatMessages();
                    } else {
                        Chat.showNotification(result.message, 'error');
                    }
                } catch (error) {
                    Chat.showNotification('Ошибка при обработке ответа сервера', 'error');
                }
            },
            error: function() {
                Chat.showNotification('Ошибка подключения к серверу', 'error');
            }
        });
    },

    showNotification: function(message, type) {
        if (typeof UI !== 'undefined' && UI.showNotification) {
            UI.showNotification(message, type);
        } else {
            alert(message);
        }
    }
};

$(document).ready(function() {
    Chat.init();
});
