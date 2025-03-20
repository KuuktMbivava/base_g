/**
 * Модуль пользовательского интерфейса
 * Ресурсная Империя
 */

const UI = {
    // Инициализация модуля
    init: function() {
        console.log('Инициализация модуля интерфейса');
        
        // Инициализируем обработчики событий
        this.initEventHandlers();
    },
    
    // Обновление информации о пользователе
    updateUserInfo: function() {
        $('#player-name').text(Game.player.name);
        $('#player-gold').text(Game.player.gold + ' золота');
        
        if (Game.player.loggedIn) {
            $('#login-button').text('Выйти');
        } else {
            $('#login-button').text('Войти');
        }
    },
    
    // Обновление отображения инвентаря в игровом экране
    // Модифицированная версия - не обновляет отображение в локациях, так как элемент удален
    updateInventory: function() {
        // Проверяем, существует ли элемент перед обновлением
        const container = $('#player-inventory');
        if (container.length === 0) {
            // Элемент не найден, значит он был удален - просто логируем обновление
            console.log('Инвентарь обновлен в памяти, без отображения на странице');
            return;
        }
        
        // Если элемент существует (на других страницах), обновляем его
        container.empty();
        
        if (Game.inventory.length === 0) {
            container.html('<p>Инвентарь пуст</p>');
            return;
        }
        
        // Сортируем инвентарь по редкости (от редких к обычным)
        Game.inventory.sort((a, b) => {
            const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
            return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        });
        
        Game.inventory.forEach(item => {
            const rarityClass = this.getRarityClass(item.rarity);
            
            const inventoryItem = $(`
                <div class="inventory-item ${rarityClass}">
                    <div class="item-info">
                        <span class="item-name">${item.name}</span>
                        <span class="item-amount">${item.amount} шт.</span>
                    </div>
                </div>
            `);
            
            container.append(inventoryItem);
        });
    },
    
    // Отрисовка полного инвентаря на отдельном экране с кнопками продажи
    renderFullInventory: function() {
        Game.switchScreen('inventory-screen');
        const container = $('#full-inventory-container');
        container.empty();
        
        if (Game.inventory.length === 0) {
            container.html('<p>Инвентарь пуст</p>');
            return;
        }
        
        // Сортируем инвентарь по редкости
        const sortedInventory = [...Game.inventory].sort((a, b) => {
            const rarityOrder = { 
                legendary: 5, 
                epic: 4, 
                rare: 3, 
                uncommon: 2, 
                common: 1 
            };
            return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        });
        
        const inventoryGrid = $('<div class="inventory-grid"></div>');
        
        sortedInventory.forEach(item => {
            const rarityClass = this.getRarityClass(item.rarity);
            const rarityLabel = this.formatRarity(item.rarity);
            
            const inventoryItem = $(`
                <div class="inventory-item ${rarityClass}">
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-amount">${item.amount} шт.</div>
                        <div class="item-rarity">${rarityLabel}</div>
                    </div>
                    <div class="item-actions">
                        <button class="game-button sell-item" data-id="${item.resource_id}">Продать</button>
                    </div>
                </div>
            `);
            
            inventoryGrid.append(inventoryItem);
        });
        
        container.append(inventoryGrid);
        
        // Добавляем обработчики событий для кнопок продажи
        container.find('.sell-item').on('click', function() {
            const resourceId = parseInt($(this).data('id'));
            const item = Game.inventory.find(i => parseInt(i.resource_id) === resourceId);
            
            if (item) {
                UI.showSellResourceModal(item);
            }
        });
    },
    
// Отрисовка полного инвентаря на отдельном экране с кнопками продажи
renderFullInventory: function() {
    Game.switchScreen('inventory-screen');
    const container = $('#full-inventory-container');
    container.empty();
    
    if (Game.inventory.length === 0) {
        container.html('<p>Инвентарь пуст</p>');
        return;
    }
    
    // Сортируем инвентарь по редкости
    const sortedInventory = [...Game.inventory].sort((a, b) => {
        const rarityOrder = { 
            legendary: 5, 
            epic: 4, 
            rare: 3, 
            uncommon: 2, 
            common: 1 
        };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    });
    
    const inventoryGrid = $('<div class="inventory-grid"></div>');
    
    sortedInventory.forEach(item => {
        const rarityClass = this.getRarityClass(item.rarity);
        const rarityLabel = this.formatRarity(item.rarity);
        
        const inventoryItem = $(`
            <div class="inventory-item ${rarityClass}">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-amount">${item.amount} шт.</div>
                    <div class="item-rarity">${rarityLabel}</div>
                </div>
                <div class="item-actions">
                    <button class="game-button sell-item" data-id="${item.resource_id}">Продать</button>
                </div>
            </div>
        `);
        
        inventoryGrid.append(inventoryItem);
    });
    
    container.append(inventoryGrid);
    
    // Добавляем обработчики событий для кнопок продажи
    container.find('.sell-item').on('click', function() {
        const resourceId = parseInt($(this).data('id'));
        const item = Game.inventory.find(i => parseInt(i.resource_id) === resourceId);
        
        if (item) {
            UI.showSellResourceModal(item);
        }
    });
},
    
    // Показ модального окна продажи ресурса
    showSellResourceModal: function(item) {
        // Получаем текущие рыночные цены
        const marketPrices = Resources.getMarketPrices();
        const priceInfo = marketPrices.find(p => parseInt(p.resource_id) === parseInt(item.resource_id));
        
        if (!priceInfo) {
            this.showNotification('Не удалось определить рыночную цену', 'error');
            return;
        }
        
        // Показываем модальное окно для продажи
        this.showModal('Продажа ресурса', `
            <div class="sell-form">
                <h4>${item.name}</h4>
                <p>У вас есть: ${item.amount} шт.</p>
                <p>Текущая рыночная цена: ${priceInfo.price} золота за 1 шт.</p>
                
                <label for="sell-amount">Количество для продажи:</label>
                <input type="number" id="sell-amount" min="1" max="${item.amount}" value="1">
                
                <p>Итого: <span id="sell-total">${priceInfo.price}</span> золота</p>
                
                <div class="modal-buttons">
                    <button id="confirm-sell" class="game-button">Продать</button>
                    <button id="cancel-sell" class="game-button secondary">Отмена</button>
                </div>
            </div>
        `);
        
        // Обновление итоговой суммы при изменении количества
        $('#sell-amount').on('input', function() {
            const amount = parseInt($(this).val()) || 0;
            $('#sell-total').text(amount * priceInfo.price);
        });
        
        // Обработчик для кнопки подтверждения продажи
        $('#confirm-sell').on('click', () => {
            const amount = parseInt($('#sell-amount').val());
            
            if (isNaN(amount) || amount < 1 || amount > item.amount) {
                this.showNotification('Укажите корректное количество', 'error');
                return;
            }
            
            const success = Resources.sellResource(parseInt(item.resource_id), amount, priceInfo.price);
            
            if (success) {
                this.closeModal();
                this.showNotification(`Продано ${amount} ${item.name} за ${amount * priceInfo.price} золота`, 'success');
                this.renderFullInventory();
            }
        });
        
        // Обработчик для кнопки отмены
        $('#cancel-sell').on('click', () => {
            this.closeModal();
        });
    },
    
    // Показ уведомления
    showNotification: function(message, type = 'info') {
        console.log('Уведомление:', message, type);
        
        const notification = $(`<div class="notification ${type}">${message}</div>`);
        
        $('#notifications-area').append(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(function() {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    },
    
    // Показ модального окна
    showModal: function(title, content) {
        console.log('Открытие модального окна:', title);
        
        // Устанавливаем заголовок и содержимое
        $('#modal-title').text(title);
        $('#modal-content').html(content);
        
        // Показываем модальное окно
        $('#modal-overlay').removeClass('hidden');
    },
    
    // Закрытие модального окна
    closeModal: function() {
        $('#modal-overlay').addClass('hidden');
    },
    
// Исправленная функция отображения экрана статистики
// Добавляем этот код в файл ui.js, чтобы заменить текущую функцию showStatsScreen

// Показ экрана статистики игрока с исправленной обработкой статистики добычи
showStatsScreen: function() {
    console.log('Отображение экрана статистики');
    
    // Проверяем, авторизован ли пользователь
    if (!Game.player.loggedIn) {
        this.showNotification('Сначала войдите в игру', 'error');
        return;
    }
    
    // Переключаемся на экран статистики
    Game.switchScreen('stats-screen');
    
    // Обновляем содержимое экрана статистики
    const container = $('#stats-container');
    container.empty();
    
    // Добавляем индикатор загрузки
    container.html('<div class="loading-indicator">Загрузка статистики...</div>');
    
    // Считаем общее количество ресурсов
    const totalItems = Game.inventory.reduce((sum, item) => sum + parseInt(item.amount || 0), 0);
    
    // Получаем количество аукционов безопасным способом
    let auctionsCount = 0;
    if (typeof Auction !== 'undefined' && Auction && Array.isArray(Auction.myAuctions)) {
        auctionsCount = Auction.myAuctions.length;
    }
    
    // Создаем основной блок статистики игрока
    const basicStatsContent = `
        <div class="stats-container">
            <div class="stat-item">
                <div class="stat-label">Имя:</div>
                <div class="stat-value">${Game.player.name}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Золото:</div>
                <div class="stat-value">${Game.player.gold}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Видов ресурсов в инвентаре:</div>
                <div class="stat-value">${Game.inventory.length}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Общее количество предметов:</div>
                <div class="stat-value">${totalItems}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Активных аукционов:</div>
                <div class="stat-value">${auctionsCount}</div>
            </div>
        </div>
        
        <h3>Распределение ресурсов по редкости</h3>
        <div class="stats-rarity-distribution">
            ${this.generateRarityDistribution()}
        </div>
    `;
    
    container.html(basicStatsContent);
    
    // Добавляем раздел со статистикой добычи
    const miningStatsContainer = $('<div class="mining-stats-container"><h3>Статистика добычи ресурсов</h3><div class="loading-mining-stats">Загрузка данных о добыче...</div></div>');
    container.append(miningStatsContainer);
    
    // Запрашиваем статистику добычи с сервера
    $.ajax({
        url: 'get_mining_stats.php',
        type: 'POST',
        data: {
            user_id: Game.player.id
        },
        success: function(response) {
            try {
                console.log("Получен ответ от get_mining_stats.php:", response);
                const result = JSON.parse(response);
                $('.loading-mining-stats').remove();
                
                if (result.success) {
                    // Отображаем общую статистику добычи
                    UI.displayMiningStats(result.stats, result.resource_stats, result.location_stats);
                } else {
                    $('.mining-stats-container').append('<p>Ошибка при загрузке статистики добычи: ' + result.message + '</p>');
                }
            } catch (error) {
                console.error('Ошибка при обработке ответа:', error);
                console.error('Содержимое ответа:', response);
                $('.loading-mining-stats').remove();
                $('.mining-stats-container').append('<p>Ошибка при обработке данных статистики. Подробности в консоли браузера.</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Ошибка при выполнении запроса:', status, error);
            console.error('Статус:', xhr.status);
            console.error('Ответ:', xhr.responseText);
            $('.loading-mining-stats').remove();
            $('.mining-stats-container').append('<p>Ошибка при соединении с сервером. Не удалось загрузить статистику добычи.</p>');
            
            // Проверяем доступность файла
            $.ajax({
                url: 'get_mining_stats.php',
                type: 'HEAD',
                success: function() {
                    $('.mining-stats-container').append('<p>Файл get_mining_stats.php существует, но возникла ошибка при обработке запроса.</p>');
                },
                error: function() {
                    $('.mining-stats-container').append('<p>Файл get_mining_stats.php не найден на сервере.</p>');
                }
            });
        }
    });
},

displayMiningStats: function(generalStats, resourceStats, locationStats) {
    console.log("Отображение статистики добычи:", generalStats, resourceStats, locationStats);
    
    const container = $('.mining-stats-container');
    container.empty(); // Очищаем контейнер перед добавлением новых данных
    
    // Проверяем наличие статистики
    if (!generalStats) {
        container.append('<p>Нет данных о добыче ресурсов.</p>');
        return;
    }
    
    // Отображаем общую статистику
    let statsHtml = `
        <div class="stats-box general-mining-stats">
            <h4>Общая статистика добычи</h4>
            <div class="stat-item">
                <div class="stat-label">Всего попыток:</div>
                <div class="stat-value">${generalStats.total_attempts || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Успешных добыч:</div>
                <div class="stat-value">${generalStats.success_count || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Процент успеха:</div>
                <div class="stat-value">${(parseFloat(generalStats.success_rate) || 0).toFixed(2)}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Всего добыто ресурсов:</div>
                <div class="stat-value">${generalStats.total_resources || 0}</div>
            </div>
        </div>
    `;
    
    // Добавляем статистику по ресурсам, если она есть
    if (resourceStats && resourceStats.length > 0) {
        statsHtml += `
            <h4>Топ-5 ресурсов по количеству добычи</h4>
            <div class="resource-mining-stats">
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Ресурс</th>
                            <th>Редкость</th>
                            <th>Добыто</th>
                            <th>Успех</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Используем Map для дедупликации ресурсов по имени
        const resourceMap = new Map();
        
        resourceStats.forEach(resource => {
            if (!resource.resource_name) return;
            
            // Если ресурс с таким именем уже существует в Map, обновляем его данные
            if (resourceMap.has(resource.resource_name)) {
                const existingResource = resourceMap.get(resource.resource_name);
                existingResource.total_mined += parseInt(resource.total_mined || 0);
                existingResource.successes += parseInt(resource.successes || 0);
                existingResource.attempts += parseInt(resource.attempts || 0);
                // Пересчитываем success_rate
                existingResource.success_rate = existingResource.attempts > 0 ? 
                    (existingResource.successes / existingResource.attempts * 100) : 0;
            } else {
                // Иначе добавляем новый ресурс в Map
                resourceMap.set(resource.resource_name, {
                    ...resource,
                    total_mined: parseInt(resource.total_mined || 0),
                    successes: parseInt(resource.successes || 0),
                    attempts: parseInt(resource.attempts || 0),
                    success_rate: parseFloat(resource.success_rate || 0)
                });
            }
        });
        
        // Преобразуем Map обратно в массив и сортируем
        const uniqueResources = Array.from(resourceMap.values())
            .sort((a, b) => b.total_mined - a.total_mined)
            .slice(0, 5);
        
        uniqueResources.forEach(resource => {
            const rarityClass = this.getRarityClass(resource.rarity);
            statsHtml += `
                <tr class="${rarityClass}">
                    <td>${resource.resource_name}</td>
                    <td>${this.formatRarity(resource.rarity)}</td>
                    <td>${resource.total_mined}</td>
                    <td>${resource.success_rate.toFixed(2)}%</td>
                </tr>
            `;
        });
        
        statsHtml += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        statsHtml += `<p>Нет данных о добыче конкретных ресурсов.</p>`;
    }

        // Добавляем статистику по локациям, если она есть
    if (locationStats && locationStats.length > 0) {
        statsHtml += `
            <h4>Статистика по локациям</h4>
            <div class="location-mining-stats">
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Локация</th>
                            <th>Сложность</th>
                            <th>Добыто</th>
                            <th>Успех</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Используем Map для дедупликации локаций по имени
        const locationMap = new Map();
        
        locationStats.forEach(location => {
            if (!location.location_name) return;
            
            // Если локация с таким именем уже существует в Map, обновляем её данные
            if (locationMap.has(location.location_name)) {
                const existingLocation = locationMap.get(location.location_name);
                existingLocation.total_mined += parseInt(location.total_mined || 0);
                existingLocation.successes += parseInt(location.successes || 0);
                existingLocation.attempts += parseInt(location.attempts || 0);
                // Пересчитываем success_rate
                existingLocation.success_rate = existingLocation.attempts > 0 ? 
                    (existingLocation.successes / existingLocation.attempts * 100) : 0;
            } else {
                // Иначе добавляем новую локацию в Map
                locationMap.set(location.location_name, {
                    ...location,
                    total_mined: parseInt(location.total_mined || 0),
                    successes: parseInt(location.successes || 0),
                    attempts: parseInt(location.attempts || 0),
                    success_rate: parseFloat(location.success_rate || 0)
                });
            }
        });
        
        // Преобразуем Map обратно в массив и сортируем
        const uniqueLocations = Array.from(locationMap.values())
            .sort((a, b) => b.total_mined - a.total_mined);
        
        uniqueLocations.forEach(location => {
            statsHtml += `
                <tr>
                    <td>${location.location_name}</td>
                    <td>${location.difficulty}</td>
                    <td>${location.total_mined}</td>
                    <td>${location.success_rate.toFixed(2)}%</td>
                </tr>
            `;
        });
        
        statsHtml += `
                    </tbody>
                </table>
            </div>
        `;
    } else {
        statsHtml += `<p>Нет данных о добыче по локациям.</p>`;
    }
    
    // Добавляем ссылку на полную статистику
    statsHtml += `
        <div class="stats-full-link">
            <a href="check_mining_history.php?user_id=${Game.player.id}" target="_blank">Просмотреть полную статистику добычи</a>
        </div>
    `;
    
    // Добавляем стили для таблицы статистики только если они еще не определены
    if (!$('#stats-table-styles').length) {
        $('head').append(`
            <style id="stats-table-styles">
                .stats-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    margin-bottom: 20px;
                }
                
                .stats-table th, .stats-table td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid rgba(139, 69, 19, 0.2);
                }
                
                .stats-table th {
                    background-color: rgba(139, 69, 19, 0.1);
                    font-weight: bold;
                }
                
                .stats-table tr:hover {
                    background-color: rgba(255, 255, 255, 0.4);
                }
                
                .stats-full-link {
                    margin-top: 20px;
                    text-align: center;
                }
                
                .stats-full-link a {
                    color: #8B4513;
                    text-decoration: none;
                    padding: 5px 10px;
                    border: 1px solid #8B4513;
                    border-radius: 4px;
                }
                
                .stats-full-link a:hover {
                    background-color: rgba(139, 69, 19, 0.1);
                }
            </style>
        `);
    }
    
    // Добавляем всю статистику в контейнер за один раз
    container.html(statsHtml);
},
    
    // Генерация статистики распределения ресурсов по редкости
    generateRarityDistribution: function() {
        // Счетчики для каждой редкости
        const rarityCounts = {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            legendary: 0
        };
        
        // Подсчет ресурсов по редкости
        Game.inventory.forEach(item => {
            if (item && item.rarity && rarityCounts.hasOwnProperty(item.rarity)) {
                rarityCounts[item.rarity] += parseInt(item.amount || 0);
            }
        });
        
        // Генерация HTML для графика
        let html = '<div class="rarity-bars">';
        
        // Добавляем бары для каждой редкости
        Object.entries(rarityCounts).forEach(([rarity, count]) => {
            if (count > 0) {
                const rarityClass = this.getRarityClass(rarity);
                const label = this.formatRarity(rarity);
                html += `
                    <div class="rarity-bar-container">
                        <div class="rarity-label">${label}</div>
                        <div class="rarity-bar ${rarityClass}" style="width: ${Math.min(count * 3, 300)}px;">
                            <span class="rarity-count">${count}</span>
                        </div>
                    </div>
                `;
            }
        });
        
        if (Object.values(rarityCounts).every(count => count === 0)) {
            html += '<p>В инвентаре нет ресурсов</p>';
        }
        
        html += '</div>';
        return html;
    },
    
    // Получение класса CSS в зависимости от редкости
    getRarityClass: function(rarity) {
        switch (rarity) {
            case 'common': return 'rarity-common';
            case 'uncommon': return 'rarity-uncommon';
            case 'rare': return 'rarity-rare';
            case 'epic': return 'rarity-epic';
            case 'legendary': return 'rarity-legendary';
            default: return '';
        }
    },
    
    // Форматирование названия редкости
    formatRarity: function(rarity) {
        switch (rarity) {
            case 'common': return 'Обычный';
            case 'uncommon': return 'Необычный';
            case 'rare': return 'Редкий';
            case 'epic': return 'Эпический';
            case 'legendary': return 'Легендарный';
            default: return rarity;
        }
    },
    
    // Инициализация обработчиков событий
    initEventHandlers: function() {
        // Закрытие модального окна
        $('#modal-close').on('click', function() {
            UI.closeModal();
        });
        
        // Закрытие модального окна при клике на оверлей
        $('#modal-overlay').on('click', function(e) {
            if (e.target === this) {
                UI.closeModal();
            }
        });
        
        // Обработчики для кнопок статистики в навигации
        $('#nav-stats, #nav-stats-footer').on('click', function() {
            if (Game.player.loggedIn) {
                UI.showStatsScreen();
            } else {
                UI.showNotification('Сначала войдите в игру', 'error');
            }
        });
    }
};