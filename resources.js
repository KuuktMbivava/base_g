/**
 * Модуль для работы с ресурсами
 * Ресурсная Империя
 */

const Resources = {
    // Список всех ресурсов в игре
    list: [],
    
    // Хранилище для текущих рыночных цен
    marketPrices: [],
    
    // Инициализация модуля
    init: function() {
        console.log('Инициализация модуля ресурсов');
        
        // Загружаем ресурсы с сервера
        this.loadResources();
    },
    
    // Загрузка ресурсов с сервера
    loadResources: function() {
        $.ajax({
            url: 'game_actions.php',
            type: 'POST',
            data: {
                action: 'get_resources'
            },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        Resources.list = result.resources;
                    } else {
                        // Если не удалось загрузить с сервера, используем демо-данные
                        Resources.loadDemoResources();
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке ресурсов:', error);
                    Resources.loadDemoResources();
                }
            },
            error: function() {
                console.error('Ошибка при подключении к серверу');
                Resources.loadDemoResources();
            }
        });
    },
    
    // Загрузка демо-ресурсов (для отладки или при недоступности сервера)
    loadDemoResources: function() {
        console.log('Загрузка демо-ресурсов');
        
        this.list = [
            {
                id: 1,
                name: 'Дуб',
                description: 'Прочная древесина для строительства',
                base_price: 10,
                rarity: 'common'
            },
            {
                id: 2,
                name: 'Эльфийская трава',
                description: 'Редкое растение с целебными свойствами',
                base_price: 25,
                rarity: 'uncommon'
            },
            {
                id: 3,
                name: 'Магический кристалл',
                description: 'Источник мистической энергии',
                base_price: 75,
                rarity: 'rare'
            },
            {
                id: 4,
                name: 'Железная руда',
                description: 'Основной материал для изготовления оружия и брони',
                base_price: 15,
                rarity: 'common'
            },
            {
                id: 5,
                name: 'Серебро',
                description: 'Ценный металл с магическими свойствами',
                base_price: 30,
                rarity: 'uncommon'
            },
            {
                id: 6,
                name: 'Золотая жила',
                description: 'Чистое золото высокого качества',
                base_price: 100,
                rarity: 'rare'
            },
            {
                id: 7,
                name: 'Песок',
                description: 'Используется для изготовления стекла',
                base_price: 5,
                rarity: 'common'
            },
            {
                id: 8,
                name: 'Пустынный кварц',
                description: 'Кристалл, накопивший энергию солнца',
                base_price: 35,
                rarity: 'uncommon'
            },
            {
                id: 9,
                name: 'Древний артефакт',
                description: 'Таинственный предмет из давно исчезнувшей цивилизации',
                base_price: 120,
                rarity: 'rare'
            },
            {
                id: 10,
                name: 'Морская соль',
                description: 'Кристаллы соли из чистой морской воды',
                base_price: 8,
                rarity: 'common'
            },
            {
                id: 11,
                name: 'Жемчуг',
                description: 'Красивые жемчужины из морских глубин',
                base_price: 40,
                rarity: 'uncommon'
            },
            {
                id: 12,
                name: 'Коралл',
                description: 'Редкий коралл необычного оттенка',
                base_price: 85,
                rarity: 'rare'
            },
            {
                id: 13,
                name: 'Уголь',
                description: 'Основное топливо для плавки руды',
                base_price: 12,
                rarity: 'common'
            },
            {
                id: 14,
                name: 'Аметист',
                description: 'Красивый фиолетовый кристалл',
                base_price: 45,
                rarity: 'uncommon'
            },
            {
                id: 15,
                name: 'Алмаз',
                description: 'Прочнейший и ценнейший драгоценный камень',
                base_price: 150,
                rarity: 'rare'
            }
        ];
    },
        
    // Получение ресурса по ID
    getResourceById: function(id) {
        return this.list.find(resource => parseInt(resource.id) === parseInt(id));
    },
    
    // Получение информации о ресурсе в локации
    getLocationResource: function(resourceId) {
        if (!Game.currentLocation || !Game.currentLocation.resources) {
            return null;
        }
        
        return Game.currentLocation.resources.find(resource => parseInt(resource.id) === parseInt(resourceId));
    },
    
    // Добыча ресурса - устаревший метод, оставлен для совместимости
    mineResource: function(resourceId) {
        console.warn('Метод mineResource устарел. Используйте автоматическую добычу.');
        
        // Проверяем, авторизован ли пользователь
        if (!Game.player.loggedIn) {
            UI.showNotification('Сначала войдите в игру', 'error');
            return;
        }
        
        // В новой системе добыча происходит автоматически
        UI.showNotification('Добыча происходит автоматически', 'info');
    },
    
    // Добавление ресурса в инвентарь
    addToInventory: function(resource, amount) {
        // Проверяем, что переданные значения валидны
        if (!resource || !resource.id || amount <= 0) {
            console.error('Невозможно добавить ресурс в инвентарь:', resource, amount);
            return;
        }
        
        // Ищем ресурс в инвентаре
        const inventoryItem = Game.inventory.find(item => parseInt(item.resource_id) === parseInt(resource.id));
        
        if (inventoryItem) {
            // Если ресурс уже есть, увеличиваем количество
            inventoryItem.amount += amount;
        } else {
            // Если ресурса нет, добавляем новый элемент
            Game.inventory.push({
                resource_id: resource.id,
                name: resource.name,
                amount: amount,
                rarity: resource.rarity,
                base_price: resource.base_price || 0
            });
        }
        
        // Обновляем отображение инвентаря
        UI.updateInventory();
        
        // Если пользователь авторизован, синхронизируем с сервером
        if (Game.player.loggedIn) {
            $.ajax({
                url: 'game_actions.php',
                type: 'POST',
                data: {
                    action: 'update_inventory',
                    user_id: Game.player.id,
                    inventory: JSON.stringify(Game.inventory)
                },
                error: function(xhr, status, error) {
                    console.error('Ошибка при обновлении инвентаря на сервере:', status, error);
                }
            });
        }
    },
    
// Добавление записи в лог добычи с улучшенным форматированием
addMiningLog: function(resourceName, amount, success, totalTime, errorMessage) {
    console.log('Добавление записи в лог добычи:', resourceName, amount, success, totalTime);
    
    const logContainer = $('#mining-log');
    
    // Проверяем, существует ли контейнер лога
    if (logContainer.length === 0) {
        console.error('Контейнер журнала добычи не найден в DOM!');
        return;
    }
    
    // Создаем элемент лога
    const logItem = $('<div>').addClass('mining-result');
    
    // Форматируем текущее время
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                    now.getMinutes().toString().padStart(2, '0') + ':' + 
                    now.getSeconds().toString().padStart(2, '0');
    
    // Форматируем накопительное время
    const formattedTotalTime = this.formatTotalTime(totalTime);
    
    // Стилизуем сообщение в зависимости от успеха/неуспеха
    if (success) {
        logItem.addClass('mining-success');
        logItem.html(`
            <span class="log-time">[${timeStr}]</span>
            <span class="log-action">Добыто</span>
            <span class="log-amount">${amount}</span>
            <span class="resource-name-in-log">${resourceName}</span>
            <span class="log-time-elapsed">(общее время: ${formattedTotalTime})</span>
        `);
    } else {
        logItem.addClass('mining-failure');
        
        // Проверяем, это сообщение о завершении добычи или о неудаче
        if (resourceName === 'Система') {
            logItem.html(`
                <span class="log-time">[${timeStr}]</span>
                <span class="log-system">${errorMessage}</span>
                <span class="log-time-elapsed">(общее время: ${formattedTotalTime})</span>
            `);
        } else {
            logItem.html(`
                <span class="log-time">[${timeStr}]</span>
                <span class="log-action">Не удалось добыть</span>
                <span class="resource-name-in-log">${resourceName}</span>
                <span class="log-error">${errorMessage || ''}</span>
                <span class="log-time-elapsed">(общее время: ${formattedTotalTime})</span>
            `);
        }
    }
    
    // Добавляем элемент в начало лога с анимацией
    logItem.hide();
    logContainer.prepend(logItem);
    logItem.fadeIn(300);
    
    // Ограничиваем количество записей в логе
    if (logContainer.children().length > 10) {
        logContainer.children().last().fadeOut(300, function() {
            $(this).remove();
        });
    }
},

// Форматирование общего времени в формат mm:ss
formatTotalTime: function(seconds) {
    if (!seconds && seconds !== 0) return "00:00";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
},
    
    // Получение текущих рыночных цен на ресурсы
    getMarketPrices: function() {
        // Проверяем, была ли уже выполнена загрузка цен с сервера
        if (this.marketPrices && this.marketPrices.length > 0) {
            return this.marketPrices;
        }
        
        // Создаем временный массив на основе базовых цен
        const tempPrices = this.list.map(resource => {
            return {
                resource_id: resource.id,
                name: resource.name,
                price: resource.base_price
            };
        });
        
        // Асинхронно загружаем актуальные цены с сервера
        $.ajax({
            url: 'market_api.php',
            type: 'POST',
            data: {
                action: 'get_current_prices'
            },
            success: (response) => {
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success && result.prices) {
                        // Обновляем массив цен
                        this.marketPrices = result.prices.map(item => ({
                            resource_id: parseInt(item.resource_id),
                            name: item.resource_name,
                            price: parseInt(item.current_price)
                        }));
                        
                        console.log('Загружены актуальные рыночные цены:', this.marketPrices);
                    }
                } catch (error) {
                    console.error('Ошибка при обработке рыночных цен:', error);
                }
            },
            error: function() {
                console.error('Ошибка при получении рыночных цен с сервера');
            }
        });
        
        // Возвращаем временные цены до получения актуальных
        return tempPrices;
    },
    
    // Получение текущей рыночной цены ресурса
    getResourcePrice: function(resourceId) {
        // Пробуем найти цену в загруженных рыночных ценах
        if (this.marketPrices && this.marketPrices.length > 0) {
            const priceInfo = this.marketPrices.find(p => parseInt(p.resource_id) === parseInt(resourceId));
            if (priceInfo) {
                return priceInfo.price;
            }
        }
        
        // Если рыночная цена не найдена, используем базовую цену
        const resource = this.getResourceById(parseInt(resourceId));
        return resource ? resource.base_price : 0;
    },
    
    // Продажа ресурса
    sellResource: function(resourceId, amount, optionalPrice) {
        // Проверяем, авторизован ли пользователь
        if (!Game.player.loggedIn) {
            UI.showNotification('Сначала войдите в игру', 'error');
            return false;
        }
        
        // Находим ресурс в инвентаре
        const inventoryItem = Game.inventory.find(item => parseInt(item.resource_id) === parseInt(resourceId));
        
        if (!inventoryItem || inventoryItem.amount < amount) {
            UI.showNotification('Недостаточно ресурсов', 'error');
            return false;
        }
        
        // Получаем актуальную цену ресурса (если цена не передана)
        const price = optionalPrice || this.getResourcePrice(resourceId);
        
        // Уменьшаем количество ресурса в инвентаре
        inventoryItem.amount -= amount;
        
        // Если количество стало 0, удаляем ресурс из инвентаря
        if (inventoryItem.amount === 0) {
            Game.inventory = Game.inventory.filter(item => parseInt(item.resource_id) !== parseInt(resourceId));
        }
        
        // Добавляем золото игроку
        const totalPrice = price * amount;
        Game.updateGold(totalPrice);
        
        // Обновляем отображение инвентаря
        UI.updateInventory();
        
        // Если пользователь авторизован, синхронизируем с сервером
        if (Game.player.loggedIn) {
            $.ajax({
                url: 'game_actions.php',
                type: 'POST',
                data: {
                    action: 'sell_resource',
                    user_id: Game.player.id,
                    resource_id: resourceId,
                    amount: amount,
                    price: price
                }
            });
        }
        
        return true;
    },
    
    // Воспроизведение звуков добычи
    playMiningSound: function(success) {
        // В реальном проекте можно добавить звуковые эффекты
        // Например, с использованием Audio API:
        /*
        const sound = new Audio();
        sound.src = success ? 'sounds/success.mp3' : 'sounds/fail.mp3';
        sound.volume = 0.5;
        sound.play().catch(e => console.log('Ошибка воспроизведения звука:', e));
        */
    }
};