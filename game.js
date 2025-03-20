/**
 * Основной файл игровой логики
 * Ресурсная Империя - текстовая игра на HTML5/JS/PHP
 */

// Глобальный объект игры
const Game = {
    // Данные игрока
    player: {
        id: null,
        name: 'Гость',
        gold: 100,
        loggedIn: false
    },
    
    // Текущее состояние игры
    currentScreen: 'welcome-screen',
    currentLocation: null,
    inventory: [],
    
    // Инициализация игры
    init: function() {
        console.log('Инициализация игры "Ресурсная Империя"');
        
        // Проверяем авторизацию
        this.checkAuth();
        
        // Инициализируем обработчики событий
        this.initEventHandlers();
        
        // Инициализируем другие модули
        Locations.init();
        Resources.init();
        Auction.init();
        UI.init();

        // Добавляем инициализацию Market
        if (typeof Market !== 'undefined') {
        Market.init();
    }
    },
    
    // Проверка авторизации
    checkAuth: function() {
        // Проверяем, есть ли сохраненный токен в localStorage
        const token = localStorage.getItem('gameToken');
        
        if (token) {
            // Пытаемся авторизоваться с сохраненным токеном
            $.ajax({
                url: 'user_management.php',
                type: 'POST',
                data: {
                    action: 'check_auth',
                    token: token
                },
                success: function(response) {
                    try {
                        console.log('Ответ от check_auth:', response);
                        const result = JSON.parse(response);
                        
                        if (result.success) {
                            Game.player.id = result.user_id;
                            Game.player.name = result.username;
                            Game.player.gold = result.gold;
                            Game.player.loggedIn = true;
                            
                            // Обновляем информацию о пользователе
                            UI.updateUserInfo();
                            
                            // Переключаемся на экран локаций
                            Game.switchScreen('locations-screen');
                            
                            // Загружаем инвентарь
                            Game.loadInventory();
                        }
                    } catch (error) {
                        console.error('Ошибка при проверке авторизации:', error);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Ошибка при выполнении запроса check_auth:', status, error);
                }
            });
        }
    },
    
    // Логин пользователя
    login: function(username, password) {
        $.ajax({
            url: 'user_management.php',
            type: 'POST',
            data: {
                action: 'login',
                username: username,
                password: password
            },
            success: function(response) {
                try {
                    console.log('Ответ от login:', response);
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        // Сохраняем токен
                        localStorage.setItem('gameToken', result.token);
                        
                        // Обновляем данные игрока
                        Game.player.id = result.user_id;
                        Game.player.name = result.username;
                        Game.player.gold = result.gold;
                        Game.player.loggedIn = true;
                        
                        // Обновляем интерфейс
                        UI.updateUserInfo();
                        
                        // Переключаемся на экран локаций
                        Game.switchScreen('locations-screen');
                        
                        // Загружаем инвентарь
                        Game.loadInventory();
                        
                        // Показываем уведомление
                        UI.showNotification('Добро пожаловать, ' + result.username + '!', 'success');
                    } else {
                        // Показываем ошибку
                        UI.showNotification(result.message, 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа:', error);
                    UI.showNotification('Ошибка при входе в игру', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('Ошибка при выполнении запроса login:', status, error);
                UI.showNotification('Ошибка при подключении к серверу', 'error');
            }
        });
    },
    
    // Регистрация нового пользователя
    register: function(username, password) {
        $.ajax({
            url: 'user_management.php',
            type: 'POST',
            data: {
                action: 'register',
                username: username,
                password: password
            },
            success: function(response) {
                try {
                    console.log('Ответ от register:', response);
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        UI.showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');
                        
                        // Очищаем поля
                        $('#username').val('');
                        $('#password').val('');
                    } else {
                        UI.showNotification(result.message, 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа:', error);
                    UI.showNotification('Ошибка при регистрации', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('Ошибка при выполнении запроса register:', status, error);
                UI.showNotification('Ошибка при подключении к серверу', 'error');
            }
        });
    },
    
    // Выход из аккаунта
    logout: function() {
        // Удаляем токен
        localStorage.removeItem('gameToken');
        
        // Сбрасываем данные игрока
        Game.player.id = null;
        Game.player.name = 'Гость';
        Game.player.gold = 100;
        Game.player.loggedIn = false;
        
        // Очищаем инвентарь
        Game.inventory = [];
        
        // Обновляем интерфейс
        UI.updateUserInfo();
        
        // Переключаемся на экран приветствия
        Game.switchScreen('welcome-screen');
        
        // Показываем уведомление
        UI.showNotification('Вы вышли из аккаунта', 'info');
    },
    
    // Загрузка инвентаря
    loadInventory: function() {
        if (!this.player.loggedIn) return;
        
        $.ajax({
            url: 'game_actions.php',
            type: 'POST',
            data: {
                action: 'get_inventory',
                user_id: Game.player.id
            },
            success: function(response) {
                try {
                    console.log('Ответ от get_inventory:', response);
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        Game.inventory = result.inventory || [];
                        UI.updateInventory();
                    } else {
                        UI.showNotification('Ошибка при загрузке инвентаря: ' + result.message, 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа:', error);
                }
            },
            error: function(xhr, status, error) {
                console.error('Ошибка при выполнении запроса get_inventory:', status, error);
            }
        });
    },
    
    // Обновление золота игрока
    updateGold: function(amount) {
        this.player.gold += amount;
        UI.updateUserInfo();
        
        // Синхронизируем с сервером
        if (this.player.loggedIn) {
            $.ajax({
                url: 'game_actions.php',
                type: 'POST',
                data: {
                    action: 'update_gold',
                    user_id: this.player.id,
                    gold: this.player.gold
                },
                error: function(xhr, status, error) {
                    console.error('Ошибка при обновлении золота:', status, error);
                }
            });
        }
    },
    
    // Переключение экранов
    switchScreen: function(screenId) {
        console.log('Переключение экрана с', this.currentScreen, 'на', screenId);
        
        // Скрываем текущий экран
        $('#' + this.currentScreen).removeClass('active');
        
        // Показываем новый экран
        $('#' + screenId).addClass('active');
        
        // Обновляем текущий экран
        this.currentScreen = screenId;
    },
    
    // Инициализация обработчиков событий
    initEventHandlers: function() {
        // ... другие обработчики ...
    
        $('#nav-auction, #nav-auction-footer').on('click', function() {
            console.log('Клик по кнопке аукциона'); // Добавим отладочный лог
            
            if (Game.player.loggedIn) {
                console.log('Пользователь авторизован'); // Отладочный лог
                Game.switchScreen('auction-screen');
                
                // Проверяем, существует ли модуль Auction
                if (typeof Auction !== 'undefined' && Auction.loadActiveAuctions) {
                    console.log('Загрузка активных аукционов'); // Отладочный лог
                    Auction.loadActiveAuctions();
                } else {
                    console.error('Модуль Auction не инициализирован');
                    UI.showNotification('Ошибка инициализации аукциона', 'error');
                }
            } else {
                UI.showNotification('Сначала войдите в игру', 'error');
            }
        });
        // Обработчик для кнопки инвентаря в шапке
        $('#nav-inventory').on('click', function() { 
            // ...
        });
        
        // Обработчик для кнопки инвентаря в футере
        $('#nav-stats, #nav-stats-footer').on('click', function() {
            if (Game.player.loggedIn) {
                UI.showStatsScreen();
            } else {
                UI.showNotification('Сначала войдите в игру', 'error');
            }
        });
        
            
        // Переключение на форму регистрации
        $('#register-button').on('click', function() {
            UI.showModal('Регистрация', `
                <div class="login-form">
                    <input type="text" id="reg-username" placeholder="Имя пользователя">
                    <input type="password" id="reg-password" placeholder="Пароль">
                    <input type="password" id="reg-password-confirm" placeholder="Подтвердите пароль">
                    <button id="reg-submit" class="game-button">Зарегистрироваться</button>
                </div>
            `);
            
            // Обработчик для кнопки регистрации
            $('#reg-submit').on('click', function() {
                const username = $('#reg-username').val().trim();
                const password = $('#reg-password').val();
                const passwordConfirm = $('#reg-password-confirm').val();
                
                if (!username || !password) {
                    UI.showNotification('Заполните все поля', 'error');
                    return;
                }
                
                if (password !== passwordConfirm) {
                    UI.showNotification('Пароли не совпадают', 'error');
                    return;
                }
                
                Game.register(username, password);
                UI.closeModal();
            });
        });
           // Единый обработчик для кнопок аукциона в навигации
        $('#nav-auction, #nav-auction-footer').on('click', function() {
            console.log('Клик по кнопке аукциона');
            
            if (Game.player.loggedIn) {
                // Останавливаем добычу, если находимся на экране добычи
                if (Game.currentScreen === 'mining-screen' && 
                    typeof Locations !== 'undefined' && 
                    Locations.cleanupMining) {
                    Locations.cleanupMining();
                }
                
                Game.switchScreen('auction-screen');
                
                // Проверяем, существует ли модуль Auction
                if (typeof Auction !== 'undefined' && Auction.loadActiveAuctions) {
                    console.log('Загрузка активных аукционов');
                    Auction.loadActiveAuctions();
                } else {
                    console.error('Модуль Auction не инициализирован');
                    UI.showNotification('Ошибка инициализации аукциона', 'error');
                }
            } else {
                UI.showNotification('Сначала войдите в игру', 'error');
            }
        });
        
        // Кнопка выхода
        $('#login-button').on('click', function() {
            if (Game.player.loggedIn) {
                // Показываем модальное окно подтверждения
                UI.showModal('Выход из аккаунта', `
                    <p>Вы уверены, что хотите выйти?</p>
                    <div class="modal-buttons">
                        <button id="confirm-logout" class="game-button">Да, выйти</button>
                        <button id="cancel-logout" class="game-button secondary">Отмена</button>
                    </div>
                `);
                
                $('#confirm-logout').on('click', function() {
                    Game.logout();
                    UI.closeModal();
                });
                
                $('#cancel-logout').on('click', function() {
                    UI.closeModal();
                });
            } else {
                // Если не авторизован, просто переключаемся на экран приветствия
                Game.switchScreen('welcome-screen');
            }
        });
        
        // Навигационные кнопки
        $('#nav-locations').on('click', function() {
            if (Game.player.loggedIn) {
                Game.switchScreen('locations-screen');
            } else {
                UI.showNotification('Сначала войдите в игру', 'error');
            }
        });
        
        $('#nav-auction').on('click', function() {
            if (Game.player.loggedIn) {
                Game.switchScreen('auction-screen');
                Auction.loadActiveAuctions();
            } else {
                UI.showNotification('Сначала войдите в игру', 'error');
            }
        });
        
        $('#nav-inventory').on('click', function() {
            if (Game.player.loggedIn) {
                UI.renderFullInventory();
            } else {
                UI.showNotification('Сначала войдите в игру', 'error');
            }
        });
        
        $('#nav-stats, #nav-stats-footer').on('click', function() {
            if (Game.player.loggedIn) {
                UI.showStatsScreen();
            } else {
                UI.showNotification('Сначала войдите в игру', 'error');
            }
        });
    }
};

// Инициализация игры при загрузке страницы
$(document).ready(function() {
    Game.init();
});


$('#nav-market, #nav-market-footer').on('click', function() {
    if (Game.player.loggedIn) {
        Game.switchScreen('market-screen');
        // Инициализация улучшенного интерфейса рынка
        MarketUI.init();
    } else {
        UI.showNotification('Сначала войдите в игру', 'error');
    }
});
