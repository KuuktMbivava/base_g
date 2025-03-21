/**
 * Улучшенный модуль чата для игры "Ресурсная Империя"
 * Реализует отправку и получение сообщений с помощью AJAX.
 */

const Chat = {
    refreshInterval: null,
    messageCount: 0,
    lastMessageId: 0,
    isInitialized: false,
    failedAttempts: 0,
    maxFailedAttempts: 5,
    reconnectTimeout: null,
    reconnectDelay: 5000, // 5 секунд до повторного подключения
    messagesCache: [], // Кэш полученных сообщений для предотвращения мигания
    chatCleared: false, // Флаг очистки чата

    init: function() {
        console.log('Инициализация модуля чата');
        
        if (this.isInitialized) {
            console.log('Модуль чата уже инициализирован');
            return;
        }
        
        this.isInitialized = true;
        this.initEventHandlers();
        this.setupChatUI();
        
        // Задержка перед первым запросом для уверенности, что DOM полностью загружен
        setTimeout(() => {
            this.loadChatMessages();
            
            // Обновляем чат каждые 3 секунды
            this.startRefreshTimer();
        }, 500);
        
        // Устанавливаем обработчик при закрытии страницы
        window.addEventListener('beforeunload', function() {
            Chat.stopRefreshTimer();
        });
    },

    setupChatUI: function() {
        // Проверяем, существует ли контейнер чата
        if ($('#chat-container').length === 0) {
            console.warn('Контейнер чата не найден в DOM');
            return;
        }
        
        // Проверяем существование всех необходимых элементов
        if ($('#chat-messages').length === 0) {
            $('#chat-container').append('<div id="chat-messages"></div>');
        }
        
        if ($('#chat-input-container').length === 0) {
            $('#chat-container').append(`
                <div id="chat-input-container">
                    <input type="text" id="chat-input" placeholder="Введите сообщение..." maxlength="500">
                    <button id="chat-send-button" class="chat-button">Отправить</button>
                    <button id="chat-clear-button" class="chat-button" title="Очистить чат">🗑️</button>
                </div>
            `);
        }
        
        // Очищаем содержимое чата и показываем индикатор загрузки
        if (!$('#chat-messages').find('.empty-chat').length) {
            $('#chat-messages').empty().html('<div class="empty-chat">Загрузка сообщений...</div>');
        }
        
        // Показываем индикатор статуса
        this.updateChatStatus('connecting');
    },

    initEventHandlers: function() {
        // Отправка сообщения по клику на кнопку
        $(document).off('click', '#chat-send-button').on('click', '#chat-send-button', function() {
            Chat.sendMessage();
        });
        
        // Отправка сообщения при нажатии Enter
        $(document).off('keypress', '#chat-input').on('keypress', '#chat-input', function(e) {
            if (e.which === 13) {
                Chat.sendMessage();
                e.preventDefault();
            }
        });
        
        // Очистка сообщений чата
        $(document).off('click', '#chat-clear-button').on('click', '#chat-clear-button', function() {
            Chat.clearChatMessages();
        });
    },

    startRefreshTimer: function() {
        // Останавливаем предыдущий таймер, если есть
        this.stopRefreshTimer();
        
        // Запускаем новый интервал (раз в 3 секунды)
        this.refreshInterval = setInterval(() => {
            this.loadChatMessages();
        }, 3000);
        
        console.log('Таймер обновления чата запущен');
    },

    stopRefreshTimer: function() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('Таймер обновления чата остановлен');
        }
    },

    loadChatMessages: function() {
        // Проверяем существование контейнера сообщений
        if ($('#chat-messages').length === 0) {
            console.warn('Контейнер сообщений чата не найден в DOM');
            return;
        }
        
        // Если чат был очищен пользователем, не обновляем сообщения до следующей отправки
        if (this.chatCleared) {
            return;
        }
        
        $.ajax({
            url: 'chat.php',
            type: 'POST',
            data: { 
                action: 'get_messages'
            },
            dataType: 'text', // Важно указать text, а не json
            success: (response) => {
                try {
                    // Преобразуем текстовый ответ в JSON
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        // Обновляем индикатор статуса
                        this.updateChatStatus('connected');
                        
                        // Сбрасываем счетчик неудачных попыток
                        this.failedAttempts = 0;
                        
                        if (result.messages && result.messages.length > 0) {
                            // Сравниваем с кэшем сообщений, чтобы избежать мигания
                            if (this.hasNewMessages(result.messages)) {
                                this.renderMessages(result.messages);
                                // Обновляем кэш
                                this.messagesCache = result.messages;
                            }
                        } else if ($('#chat-messages .empty-chat').length === 0 && $('#chat-messages').is(':empty')) {
                            // Если сообщений нет и контейнер пуст, показываем сообщение
                            $('#chat-messages').html('<div class="empty-chat">Нет сообщений в чате</div>');
                        }
                    } else {
                        console.warn('Ошибка при загрузке сообщений чата:', result.message);
                        this.updateChatStatus('error', result.message);
                        this.handleConnectionError();
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа чата:', error, 'Ответ сервера:', response);
                    this.handleConnectionError();
                }
            },
            error: (xhr, status, error) => {
                console.error('Ошибка подключения при загрузке чата:', status, error);
                this.handleConnectionError();
            }
        });
    },

    // Проверяем, есть ли новые сообщения
    hasNewMessages: function(newMessages) {
        if (!this.messagesCache || this.messagesCache.length === 0) {
            return true; // Если кэш пуст, считаем, что есть новые сообщения
        }
        
        if (newMessages.length !== this.messagesCache.length) {
            return true; // Если количество сообщений изменилось
        }
        
        // Проверяем, изменилось ли последнее сообщение
        const lastNewMsg = newMessages[newMessages.length - 1];
        const lastCachedMsg = this.messagesCache[this.messagesCache.length - 1];
        
        if (!lastNewMsg || !lastCachedMsg) {
            return true;
        }
        
        // Сравниваем содержимое и время последних сообщений
        if (lastNewMsg.message !== lastCachedMsg.message || 
            lastNewMsg.username !== lastCachedMsg.username || 
            lastNewMsg.timestamp !== lastCachedMsg.timestamp) {
            return true;
        }
        
        return false; // Если ничего не изменилось
    },

    handleConnectionError: function() {
        this.failedAttempts++;
        console.log(`Ошибка подключения к чату. Попытка ${this.failedAttempts} из ${this.maxFailedAttempts}`);
        
        if (this.failedAttempts >= this.maxFailedAttempts) {
            // Если превышен лимит попыток, останавливаем таймер и показываем ошибку
            this.stopRefreshTimer();
            this.updateChatStatus('disconnected', 'Соединение потеряно');
            
            // Пытаемся восстановить соединение через некоторое время
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
            }
            
            this.reconnectTimeout = setTimeout(() => {
                console.log('Попытка восстановления соединения с чатом...');
                this.failedAttempts = 0;
                this.updateChatStatus('connecting');
                this.loadChatMessages(); // Сначала пробуем загрузить сообщения
                this.startRefreshTimer(); // Затем запускаем таймер снова
            }, this.reconnectDelay);
        } else {
            this.updateChatStatus('error', 'Ошибка подключения');
        }
    },

    updateChatStatus: function(status, message) {
        const statusElement = $('#chat-status');
        if (!statusElement.length) {
            // Если элемент статуса не существует, создаем его
            $('#chat-header').append(`
                <div id="chat-status" class="chat-status connecting">
                    <span class="status-indicator"></span>
                    <span class="status-text">Подключение...</span>
                </div>
            `);
        }
        
        const statusElement2 = $('#chat-status');
        
        // Удаляем все предыдущие классы состояния
        statusElement2.removeClass('connecting connected error disconnected');
        
        // Устанавливаем новый класс состояния
        statusElement2.addClass(status);
        
        // Обновляем текст статуса
        let statusText = '';
        switch(status) {
            case 'connecting':
                statusText = 'Подключение...';
                break;
            case 'connected':
                statusText = 'Онлайн';
                break;
            case 'error':
                statusText = message || 'Ошибка';
                break;
            case 'disconnected':
                statusText = 'Отключено';
                break;
        }
        
        statusElement2.find('.status-text').text(statusText);
    },

    renderMessages: function(messages) {
        if (!messages || messages.length === 0) return;
        
        const chatContainer = $('#chat-messages');
        if (!chatContainer.length) return;
        
        // Очищаем сообщение о пустом чате, если оно есть
        chatContainer.find('.empty-chat').remove();
        
        // Сохраняем позицию прокрутки, чтобы определить, был ли чат прокручен вниз
        const wasScrolledToBottom = this.isScrolledToBottom(chatContainer);
        
        // Сохраняем текущие сообщения в DOM для сравнения
        const existingMessages = {};
        chatContainer.find('.chat-message, .system-message').each(function() {
            const msgId = $(this).data('msg-id');
            if (msgId) {
                existingMessages[msgId] = true;
            }
        });
        
        // Добавляем только новые сообщения
        let hasNewMessages = false;
        
        messages.forEach((msg, index) => {
            // Создаем уникальный идентификатор для сообщения
            const msgId = this.createMessageId(msg);
            
            // Если это сообщение уже есть, пропускаем его
            if (existingMessages[msgId]) {
                return;
            }
            
            hasNewMessages = true;
            
            // Проверяем, является ли сообщение от текущего пользователя
            const isOwnMessage = Game.player.loggedIn && msg.username === Game.player.name;
            const messageHtml = this.formatChatMessage(msg, isOwnMessage, msgId);
            
            // Добавляем сообщение в контейнер
            chatContainer.append(messageHtml);
            
            // Увеличиваем счетчик сообщений
            this.messageCount++;
        });
        
        // Прокручиваем чат вниз только если он уже был прокручен вниз или были добавлены новые сообщения
        if (wasScrolledToBottom && hasNewMessages) {
            this.scrollChatToBottom(chatContainer);
        }
        
        // Обновляем счетчик сообщений
        if ($('#chat-message-counter').length) {
            $('#chat-message-counter').text(`${this.messageCount} сообщений`);
        }
    },

    // Проверяем, прокручен ли чат в самый низ
    isScrolledToBottom: function(container) {
        return container[0].scrollHeight - container[0].scrollTop - container[0].clientHeight < 10;
    },

    // Создаем уникальный идентификатор для сообщения
    createMessageId: function(msg) {
        // Создаем хэш на основе имени, сообщения и времени
        return `msg-${this.hashString(msg.username + msg.message + msg.timestamp)}`;
    },

    // Простая хэш-функция для строк
    hashString: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0; // Преобразуем в 32-битное целое
        }
        return Math.abs(hash).toString(16); // Возвращаем как 16-ричную строку
    },

    formatChatMessage: function(msg, isOwnMessage, msgId) {
        const messageClass = isOwnMessage ? 'chat-message own-message' : 'chat-message other-message';
        
        // Проверяем, не является ли сообщение системным
        if (msg.username === 'Система') {
            return $(`<div class="system-message" data-msg-id="${msgId}">${this.escapeHTML(msg.message)}</div>`);
        }
        
        // Создаем HTML сообщения с экранированием значений
        return $(`
            <div class="${messageClass}" data-msg-id="${msgId}">
                <span class="chat-username" title="${this.escapeHTML(msg.username)}">${this.escapeHTML(msg.username)}:</span>
                <span class="chat-text">${this.escapeHTML(msg.message)}</span>
                <span class="chat-timestamp" title="${this.escapeHTML(msg.timestamp)}">${this.formatTimestamp(msg.timestamp)}</span>
            </div>
        `);
    },

    // Функция для безопасного экранирования HTML
    escapeHTML: function(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    formatTimestamp: function(timestamp) {
        if (!timestamp) return '';
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                // Если дата недействительна, пробуем другой формат
                const parts = timestamp.split(' ');
                if (parts.length === 2) {
                    const dateParts = parts[0].split('-');
                    const timeParts = parts[1].split(':');
                    if (dateParts.length === 3 && timeParts.length >= 2) {
                        date = new Date(
                            parseInt(dateParts[0]),
                            parseInt(dateParts[1]) - 1,
                            parseInt(dateParts[2]),
                            parseInt(timeParts[0]),
                            parseInt(timeParts[1])
                        );
                    }
                }
                
                if (isNaN(date.getTime())) {
                    return timestamp; // Возвращаем исходную строку, если не удалось распарсить
                }
            }
            
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            
            return `${hours}:${minutes}`;
        } catch (e) {
            console.error('Ошибка форматирования времени:', e);
            return timestamp; // Возвращаем исходную строку, если не удалось распарсить
        }
    },

    scrollChatToBottom: function(container) {
        if (!container) {
            container = $('#chat-messages');
        }
        
        if (container.length) {
            container.stop().animate({
                scrollTop: container[0].scrollHeight
            }, 300);
        }
    },

    sendMessage: function() {
        const message = $('#chat-input').val().trim();
        if (!message) return;
        
        const username = Game.player.loggedIn ? Game.player.name : 'Гость';
        
        // Сбрасываем флаг очистки чата при отправке нового сообщения
        this.chatCleared = false;
        
        // Показываем индикатор отправки
        if ($('#chat-sending-indicator').length === 0) {
            $('#chat-input-container').append('<div id="chat-sending-indicator" style="display: none;">Отправка...</div>');
        }
        
        $('#chat-sending-indicator').show();
        $('#chat-send-button').prop('disabled', true);
        
        $.ajax({
            url: 'chat.php',
            type: 'POST',
            data: {
                action: 'send_message',
                username: username,
                message: message
            },
            dataType: 'text', // Указываем text, а не json
            success: (response) => {
                try {
                    // Преобразуем текстовый ответ в JSON
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        // Очищаем поле ввода
                        $('#chat-input').val('');
                        
                        // Обнуляем кэш сообщений для принудительного обновления
                        this.messagesCache = [];
                        
                        // Загружаем сообщения заново
                        this.loadChatMessages();
                    } else {
                        this.showNotification(result.message || 'Ошибка при отправке сообщения', 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа на отправку сообщения:', error, 'Ответ:', response);
                    this.showNotification('Произошла ошибка при отправке сообщения', 'error');
                }
            },
            error: (xhr, status, error) => {
                console.error('Ошибка подключения при отправке сообщения:', status, error);
                this.showNotification('Ошибка подключения к серверу', 'error');
            },
            complete: () => {
                // Скрываем индикатор отправки
                $('#chat-sending-indicator').hide();
                $('#chat-send-button').prop('disabled', false);
            }
        });
    },

    clearChatMessages: function() {
        // Очищаем только интерфейс чата, не удаляя сообщения с сервера
        $('#chat-messages').empty().html('<div class="empty-chat">Чат очищен</div>');
        
        // Сбрасываем счетчик сообщений
        this.messageCount = 0;
        if ($('#chat-message-counter').length) {
            $('#chat-message-counter').text(`0 сообщений`);
        }
        
        // Очищаем кэш сообщений
        this.messagesCache = [];
        
        // Устанавливаем флаг очистки чата
        this.chatCleared = true;
        
        this.showNotification('Чат очищен', 'info');
    },

    showNotification: function(message, type) {
        if (typeof UI !== 'undefined' && UI.showNotification) {
            UI.showNotification(message, type);
        } else {
            alert(message);
        }
    }
};

// Инициализируем чат при загрузке страницы
$(document).ready(function() {
    // Проверяем, существует ли контейнер чата
    if ($('#chat-container').length > 0) {
        // Небольшая задержка для уверенности, что другие модули загружены
        setTimeout(() => {
            Chat.init();
        }, 1000);
    } else {
        console.log('Контейнер чата не найден, инициализация отложена');
    }
});