/**
 * Улучшенный модуль аукционной системы
 * Ресурсная Империя
 */

const Auction = {
    // Список активных аукционов
    activeAuctions: [],
    
    // Список моих аукционов
    myAuctions: [],
    
    // Интервал для обновления аукционов
    refreshInterval: null,
    
    // Интервал для обновления таймеров
    timerInterval: null,
    
    // Инициализация модуля
    init: function() {
        console.log('Инициализация модуля аукционов');
        
        // Инициализируем обработчики событий
        this.initEventHandlers();
        
        // Запускаем интервал для обновления таймеров
        this.startTimerUpdates();
    },
    
    // Запуск интервала для обновления таймеров
    startTimerUpdates: function() {
        // Очищаем предыдущий интервал, если есть
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Запускаем новый интервал (раз в секунду)
        this.timerInterval = setInterval(() => {
            // Обновляем отображение таймеров для активных аукционов
            this.updateTimers();
        }, 1000);
    },
    
    // Обновление таймеров на странице
    updateTimers: function() {
        // Обновляем таймеры для активных аукционов
        $('.auction-time').each((index, element) => {
            const $element = $(element);
            const endTime = $element.data('end-time');
            
            if (endTime) {
                const timeLeft = this.getTimeLeft(endTime);
                $element.text(timeLeft);
                
                // Добавляем класс для аукционов, которые скоро закончатся
                const endDateTime = new Date(endTime);
                const now = new Date();
                const timeDiff = endDateTime - now;
                
                if (timeDiff <= 300000) { // 5 минут в миллисекундах
                    $element.closest('.auction-item').addClass('auction-ending-soon');
                } else {
                    $element.closest('.auction-item').removeClass('auction-ending-soon');
                }
            }
        });
    },
    
    // Загрузка активных аукционов
    loadActiveAuctions: function() {
        if (!Game.player.loggedIn) {
            UI.showNotification('Сначала войдите в игру', 'error');
            return;
        }
        
        // Показываем индикатор загрузки и скрываем список аукционов
        $('#auctions-loading').show();
        $('#auctions-list').hide();
        
        $.ajax({
            url: 'auction_system.php',
            type: 'POST',
            data: {
                action: 'get_active_auctions',
                user_id: Game.player.id
            },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        Auction.activeAuctions = result.auctions;
                        Auction.renderActiveAuctions();
                    } else {
                        // Если не удалось загрузить с сервера, используем демо-данные
                        console.warn('Не удалось загрузить аукционы с сервера:', result.message);
                        Auction.loadDemoAuctions();
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке аукционов:', error);
                    Auction.loadDemoAuctions();
                } finally {
                    // Скрываем индикатор загрузки и показываем список аукционов
                    $('#auctions-loading').hide();
                    $('#auctions-list').show();
                }
            },
            error: function() {
                console.error('Ошибка при подключении к серверу');
                Auction.loadDemoAuctions();
                
                // Скрываем индикатор загрузки и показываем список аукционов
                $('#auctions-loading').hide();
                $('#auctions-list').show();
                
                UI.showNotification('Не удалось подключиться к серверу аукционов', 'error');
            }
        });
    },
    
    // Загрузка моих аукционов
    loadMyAuctions: function() {
        if (!Game.player.loggedIn) {
            UI.showNotification('Сначала войдите в игру', 'error');
            return;
        }
        
        // Показываем индикатор загрузки и скрываем список аукционов
        $('#my-auctions-loading').show();
        $('#my-auctions-list').hide();
        
        $.ajax({
            url: 'auction_system.php',
            type: 'POST',
            data: {
                action: 'get_my_auctions',
                user_id: Game.player.id
            },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        Auction.myAuctions = result.auctions;
                        Auction.renderMyAuctions();
                    } else {
                        // Если не удалось загрузить с сервера, используем демо-данные
                        console.warn('Не удалось загрузить мои аукционы с сервера:', result.message);
                        Auction.loadDemoMyAuctions();
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке моих аукционов:', error);
                    Auction.loadDemoMyAuctions();
                } finally {
                    // Скрываем индикатор загрузки и показываем список аукционов
                    $('#my-auctions-loading').hide();
                    $('#my-auctions-list').show();
                }
            },
            error: function() {
                console.error('Ошибка при подключении к серверу');
                Auction.loadDemoMyAuctions();
                
                // Скрываем индикатор загрузки и показываем список аукционов
                $('#my-auctions-loading').hide();
                $('#my-auctions-list').show();
                
                UI.showNotification('Не удалось подключиться к серверу аукционов', 'error');
            }
        });
    },
    
    // Загрузка демо-аукционов (для отладки или при недоступности сервера)
    loadDemoAuctions: function() {
        console.log('Загрузка демо-аукционов');
        
        // Генерируем случайные аукционы
        this.activeAuctions = [];
        
        // Получаем текущие рыночные цены
        const marketPrices = Resources.getMarketPrices();
        
        // Создаем случайное количество аукционов
        const numAuctions = 5 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < numAuctions; i++) {
            // Выбираем случайный ресурс
            const resourceIndex = Math.floor(Math.random() * Resources.list.length);
            const resource = Resources.list[resourceIndex];
            
            // Находим рыночную цену ресурса
            const marketPrice = marketPrices.find(p => p.resource_id === resource.id)?.price || resource.base_price;
            
            // Генерируем случайное количество
            let quantity;
            switch (resource.rarity) {
                case 'common':
                    quantity = 5 + Math.floor(Math.random() * 20);
                    break;
                case 'uncommon':
                    quantity = 2 + Math.floor(Math.random() * 8);
                    break;
                case 'rare':
                    quantity = 1 + Math.floor(Math.random() * 3);
                    break;
                default:
                    quantity = 1;
            }
            
            // Генерируем цену аукциона (начиная с 80-100% от рыночной)
            const startingPrice = Math.floor(marketPrice * (0.8 + Math.random() * 0.2));
            
            // Генерируем случайные имена продавцов
            const sellers = ['Торговец_Алекс', 'Мастер_Гильдии', 'Странник_Север', 'Леди_Удача', 'Лорд_Маркет'];
            const seller = sellers[Math.floor(Math.random() * sellers.length)];
            
            // Генерируем время окончания (от 1 до 24 часов)
            const hoursLeft = 1 + Math.floor(Math.random() * 24);
            const now = new Date();
            const endTime = new Date(now.getTime() + hoursLeft * 60 * 60 * 1000);
            
            // Случайно определяем, имеет ли аукцион текущую ставку
            const hasBids = Math.random() > 0.3;
            const bidsCount = hasBids ? Math.floor(Math.random() * 5) + 1 : 0;
            const currentPrice = hasBids ? Math.floor(startingPrice * (1 + Math.random() * 0.3)) : startingPrice;
            const bidders = ['Искатель_Джон', 'Рыцарь_Света', 'Мудрец_Ганс', 'Охотница_Ева', 'Торговец_Марк'];
            const currentBidder = hasBids ? bidders[Math.floor(Math.random() * bidders.length)] : null;
            
            // Добавляем аукцион в список
            this.activeAuctions.push({
                id: i + 1,
                resource_id: resource.id,
                resource_name: resource.name,
                resource_rarity: resource.rarity,
                quantity: quantity,
                starting_price: startingPrice,
                current_price: currentPrice,
                seller: seller,
                seller_id: Math.floor(Math.random() * 1000) + 1,
                end_time: endTime.toISOString(),
                current_bidder: currentBidder,
                bids_count: bidsCount
            });
        }
        
        this.renderActiveAuctions();
    },
    
    // Загрузка демо моих аукционов
    loadDemoMyAuctions: function() {
        console.log('Загрузка демо моих аукционов');
        
        this.myAuctions = [];
        
        // Создаем 1-3 моих аукциона
        const numAuctions = 1 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numAuctions; i++) {
            // Выбираем случайный ресурс
            const resourceIndex = Math.floor(Math.random() * Resources.list.length);
            const resource = Resources.list[resourceIndex];
            
            // Генерируем случайное количество
            let quantity;
            switch (resource.rarity) {
                case 'common':
                    quantity = 5 + Math.floor(Math.random() * 10);
                    break;
                case 'uncommon':
                    quantity = 2 + Math.floor(Math.random() * 5);
                    break;
                case 'rare':
                    quantity = 1 + Math.floor(Math.random() * 2);
                    break;
                default:
                    quantity = 1;
            }
            
            // Генерируем цену аукциона
            const startingPrice = Math.floor(resource.base_price * (0.9 + Math.random() * 0.4));
            
            // Случайно определяем, есть ли ставки
            const hasBids = Math.random() > 0.5;
            
            // Генерируем время окончания (от 1 до 24 часов)
            const hoursLeft = 1 + Math.floor(Math.random() * 24);
            const now = new Date();
            const endTime = new Date(now.getTime() + hoursLeft * 60 * 60 * 1000);
            
            // Добавляем аукцион в список
            this.myAuctions.push({
                id: 1000 + i,
                resource_id: resource.id,
                resource_name: resource.name,
                resource_rarity: resource.rarity,
                quantity: quantity,
                starting_price: startingPrice,
                current_price: hasBids ? Math.floor(startingPrice * (1 + Math.random() * 0.3)) : startingPrice,
                seller: Game.player.name,
                seller_id: Game.player.id,
                end_time: endTime.toISOString(),
                current_bidder: hasBids ? 'Игрок_' + Math.floor(Math.random() * 100) : null,
                bids_count: hasBids ? 1 + Math.floor(Math.random() * 5) : 0
            });
        }
        
        this.renderMyAuctions();
    },
    
    // Отрисовка активных аукционов с использованием шаблонов
    renderActiveAuctions: function() {
        const container = $('#auctions-list');
        container.empty();
        
        if (this.activeAuctions.length === 0) {
            // Используем шаблон для пустого списка
            const template = document.getElementById('empty-auctions-template');
            const clone = document.importNode(template.content, true);
            
            // Заполняем шаблон данными
            clone.querySelector('p').textContent = 'Нет активных аукционов';
            
            container.append(clone);
            return;
        }
        
        // Сортируем аукционы по времени окончания (сначала те, что скоро закончатся)
        this.activeAuctions.sort((a, b) => new Date(a.end_time) - new Date(b.end_time));
        
        // Для каждого аукциона создаем элемент из шаблона
        this.activeAuctions.forEach(auction => {
            const template = document.getElementById('auction-item-template');
            const clone = document.importNode(template.content, true);
            
            // Заполняем шаблон данными
            const timeLeft = this.getTimeLeft(auction.end_time);
            const rarityClass = this.getRarityClass(auction.resource_rarity);
            
            // Применяем класс редкости
            clone.querySelector('.auction-item').classList.add(rarityClass);
            
            // Заполняем данные аукциона
            this.fillTemplate(clone, {
                resource_name: auction.resource_name,
                quantity: auction.quantity,
                time_left: timeLeft,
                seller: auction.seller,
                current_price: auction.current_price,
                starting_price: auction.starting_price !== auction.current_price ? auction.starting_price : '',
                current_bidder: auction.current_bidder || 'Нет ставок',
                bids_count: auction.bids_count,
                id: auction.id
            });
            
            // Добавляем атрибут с временем окончания для обновления таймера
            clone.querySelector('.auction-time').dataset.endTime = auction.end_time;
            
            // Если текущая цена равна начальной, скрываем начальную цену
            if (auction.current_price === auction.starting_price) {
                const startingPrice = clone.querySelector('.starting-price');
                if (startingPrice) startingPrice.style.display = 'none';
            }
            
            // Если аукцион скоро закончится, добавляем соответствующий класс
            const endTime = new Date(auction.end_time);
            const now = new Date();
            if (endTime - now <= 300000) { // 5 минут в миллисекундах
                clone.querySelector('.auction-item').classList.add('auction-ending-soon');
            }
            
            container.append(clone);
        });
    },
    
    // Отрисовка моих аукционов с использованием шаблонов
    renderMyAuctions: function() {
        const container = $('#my-auctions-list');
        container.empty();
        
        if (this.myAuctions.length === 0) {
            // Используем шаблон для пустого списка
            const template = document.getElementById('empty-auctions-template');
            const clone = document.importNode(template.content, true);
            
            // Заполняем шаблон данными
            clone.querySelector('p').textContent = 'У вас нет активных аукционов';
            
            container.append(clone);
            return;
        }
        
        // Сортируем аукционы по времени окончания (сначала те, что скоро закончатся)
        this.myAuctions.sort((a, b) => new Date(a.end_time) - new Date(b.end_time));
        
        // Для каждого аукциона создаем элемент из шаблона
        this.myAuctions.forEach(auction => {
            const template = document.getElementById('my-auction-item-template');
            const clone = document.importNode(template.content, true);
            
            // Заполняем шаблон данными
            const timeLeft = this.getTimeLeft(auction.end_time);
            const rarityClass = this.getRarityClass(auction.resource_rarity);
            
            // Применяем класс редкости
            clone.querySelector('.auction-item').classList.add(rarityClass);
            
            // Заполняем данные аукциона
            this.fillTemplate(clone, {
                resource_name: auction.resource_name,
                quantity: auction.quantity,
                time_left: timeLeft,
                starting_price: auction.starting_price,
                current_price: auction.current_price,
                current_bidder: auction.current_bidder || 'Нет ставок',
                bids_count: auction.bids_count,
                id: auction.id
            });
            
            // Добавляем атрибут с временем окончания для обновления таймера
            clone.querySelector('.auction-time').dataset.endTime = auction.end_time;
            
            // Если есть ставки, блокируем возможность отмены аукциона
            if (auction.bids_count > 0) {
                const cancelButton = clone.querySelector('.cancel-auction-button');
                cancelButton.disabled = true;
                cancelButton.classList.add('disabled');
                cancelButton.title = 'Нельзя отменить аукцион с активными ставками';
            }
            
            // Если аукцион скоро закончится, добавляем соответствующий класс
            const endTime = new Date(auction.end_time);
            const now = new Date();
            if (endTime - now <= 300000) { // 5 минут в миллисекундах
                clone.querySelector('.auction-item').classList.add('auction-ending-soon');
            }
            
            container.append(clone);
        });
    },
    
    // Заполнение шаблона данными
    fillTemplate: function(template, data) {
        // Заменяем все плейсхолдеры в шаблоне
        const elements = template.querySelectorAll('*');
        elements.forEach(element => {
            // Заменяем текстовое содержимое
            if (element.textContent) {
                element.textContent = element.textContent.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                    return data[key] !== undefined ? data[key] : match;
                });
            }
            
            // Заменяем атрибуты
            Array.from(element.attributes).forEach(attr => {
                if (attr.value) {
                    attr.value = attr.value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                        return data[key] !== undefined ? data[key] : match;
                    });
                }
            });
        });
        
        return template;
    },
    
    // Получение оставшегося времени в формате текста
    getTimeLeft: function(endTimeStr) {
        const endTime = new Date(endTimeStr);
        const now = new Date();
        
        // Разница в миллисекундах
        const diff = endTime - now;
        
        if (diff <= 0) {
            return 'Завершен';
        }
        
        // Преобразуем в часы, минуты и секунды
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (hours > 0) {
            return `${hours} ч ${minutes} мин`;
        } else if (minutes > 0) {
            return `${minutes} мин ${seconds} сек`;
        } else {
            return `${seconds} сек`;
        }
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
    
    // Создание нового аукциона
    createAuction: function(resourceId, quantity, startPrice, duration) {
        // Проверяем, авторизован ли пользователь
        if (!Game.player.loggedIn) {
            UI.showNotification('Сначала войдите в игру', 'error');
            return;
        }
        
        // Показываем индикатор загрузки
        $('#create-auction-button').prop('disabled', true).text('Создание аукциона...');
        
        // Находим ресурс в инвентаре
        const inventoryItem = Game.inventory.find(item => item.resource_id === parseInt(resourceId));
        
        if (!inventoryItem || inventoryItem.amount < quantity) {
            UI.showNotification('Недостаточно ресурсов', 'error');
            $('#create-auction-button').prop('disabled', false).text('Создать аукцион');
            return;
        }
        
        // Отправляем запрос на сервер
        $.ajax({
            url: 'auction_system.php',
            type: 'POST',
            data: {
                action: 'create_auction',
                user_id: Game.player.id,
                resource_id: resourceId,
                quantity: quantity,
                start_price: startPrice,
                duration: duration
            },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        // Уменьшаем количество ресурса в инвентаре
                        inventoryItem.amount -= quantity;
                        
                        // Если количество стало 0, удаляем ресурс из инвентаря
                        if (inventoryItem.amount === 0) {
                            Game.inventory = Game.inventory.filter(item => item.resource_id !== parseInt(resourceId));
                        }
                        
                        // Обновляем отображение инвентаря
                        UI.updateInventory();
                        
                        // Обновляем список моих аукционов
                        Auction.loadMyAuctions();
                        
                        // Показываем уведомление
                        UI.showNotification('Аукцион успешно создан', 'success');
                        
                        // Очищаем поля формы
                        $('#auction-quantity').val(1);
                        $('#auction-start-price').val(10);
                        $('#auction-duration').val(24);
                        
                        // Переключаемся на вкладку "Мои аукционы"
                        $('.auction-tab[data-tab="my-auctions"]').click();
                    } else {
                        UI.showNotification(result.message || 'Ошибка при создании аукциона', 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа:', error);
                    Auction.simulateCreateAuction(resourceId, quantity, startPrice, duration);
                }
                
                // Восстанавливаем кнопку
                $('#create-auction-button').prop('disabled', false).text('Создать аукцион');
            },
            error: function() {
                console.error('Ошибка при подключении к серверу');
                Auction.simulateCreateAuction(resourceId, quantity, startPrice, duration);
                
                // Восстанавливаем кнопку
                $('#create-auction-button').prop('disabled', false).text('Создать аукцион');
            }
        });
    },
    
    // Симуляция создания аукциона (для offline режима или тестирования)
    simulateCreateAuction: function(resourceId, quantity, startPrice, duration) {
        // Находим ресурс в инвентаре
        const inventoryItem = Game.inventory.find(item => item.resource_id === parseInt(resourceId));
        
        if (!inventoryItem || inventoryItem.amount < quantity) {
            UI.showNotification('Недостаточно ресурсов', 'error');
            return;
        }
        
        // Находим информацию о ресурсе
        const resource = Resources.getResourceById(parseInt(resourceId));
        
        if (!resource) {
            UI.showNotification('Ресурс не найден', 'error');
            return;
        }
        
        // Уменьшаем количество ресурса в инвентаре
        inventoryItem.amount -= quantity;
        
        // Если количество стало 0, удаляем ресурс из инвентаря
        if (inventoryItem.amount === 0) {
            Game.inventory = Game.inventory.filter(item => item.resource_id !== parseInt(resourceId));
        }
        
        // Обновляем отображение инвентаря
        UI.updateInventory();
        
        // Создаем новый аукцион
        const now = new Date();
        const endTime = new Date(now.getTime() + duration * 60 * 60 * 1000);
        
        const newAuction = {
            id: 1000 + this.myAuctions.length,
            resource_id: parseInt(resourceId),
            resource_name: resource.name,
            resource_rarity: resource.rarity,
            quantity: parseInt(quantity),
            starting_price: parseInt(startPrice),
            current_price: parseInt(startPrice),
            seller: Game.player.name,
            seller_id: Game.player.id,
            end_time: endTime.toISOString(),
            current_bidder: null,
            bids_count: 0
        };
        
        // Добавляем аукцион в список моих аукционов
        this.myAuctions.push(newAuction);
        
        // Добавляем аукцион в список активных аукционов
        this.activeAuctions.push(newAuction);
        
        // Обновляем отображение
        this.renderMyAuctions();
        
        // Показываем уведомление
        UI.showNotification('Аукцион успешно создан', 'success');
        
        // Очищаем поля формы
        $('#auction-quantity').val(1);
        $('#auction-start-price').val(10);
        $('#auction-duration').val(24);
        
        // Переключаемся на вкладку "Мои аукционы"
        $('.auction-tab[data-tab="my-auctions"]').click();
    },
    
    // Отмена аукциона
    cancelAuction: function(auctionId) {
        // Проверяем, авторизован ли пользователь
        if (!Game.player.loggedIn) {
            UI.showNotification('Сначала войдите в игру', 'error');
            return;
        }
        
        // Находим аукцион в списке моих аукционов
        const auction = this.myAuctions.find(a => a.id === parseInt(auctionId));
        
        if (!auction) {
            UI.showNotification('Аукцион не найден', 'error');
            return;
        }
        
        // Если уже есть ставки, нельзя отменить аукцион
        if (auction.bids_count > 0) {
            UI.showNotification('Нельзя отменить аукцион, на который уже сделаны ставки', 'error');
            return;
        }
        
        // Отправляем запрос на сервер
        $.ajax({
            url: 'auction_system.php',
            type: 'POST',
            data: {
                action: 'cancel_auction',
                user_id: Game.player.id,
                auction_id: auctionId
            },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        // Возвращаем ресурсы в инвентарь
                        Resources.addToInventory({
                            id: auction.resource_id,
                            name: auction.resource_name,
                            rarity: auction.resource_rarity
                        }, auction.quantity);
                        
                        // Удаляем аукцион из списка моих аукционов
                        Auction.myAuctions = Auction.myAuctions.filter(a => a.id !== parseInt(auctionId));
                        
                        // Удаляем аукцион из списка активных аукционов
                        Auction.activeAuctions = Auction.activeAuctions.filter(a => a.id !== parseInt(auctionId));
                        
                        // Обновляем отображение
                        Auction.renderMyAuctions();
                        Auction.renderActiveAuctions();
                        
                        // Показываем уведомление
                        UI.showNotification('Аукцион отменен', 'success');
                    } else {
                        UI.showNotification(result.message, 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа:', error);
                    Auction.simulateCancelAuction(auctionId);
                }
            },
            error: function() {
                console.error('Ошибка при подключении к серверу');
                Auction.simulateCancelAuction(auctionId);
            }
        });
    },
    
    // Симуляция отмены аукциона (для offline режима или тестирования)
    simulateCancelAuction: function(auctionId) {
        // Находим аукцион в списке моих аукционов
        const auction = this.myAuctions.find(a => a.id === parseInt(auctionId));
        
        if (!auction) {
            UI.showNotification('Аукцион не найден', 'error');
            return;
        }
        
        // Если уже есть ставки, нельзя отменить аукцион
        if (auction.bids_count > 0) {
            UI.showNotification('Нельзя отменить аукцион, на который уже сделаны ставки', 'error');
            return;
        }
        
        // Возвращаем ресурсы в инвентарь
        const resource = Resources.getResourceById(auction.resource_id) || {
            id: auction.resource_id,
            name: auction.resource_name,
            rarity: auction.resource_rarity,
            base_price: auction.starting_price
        };
        
        Resources.addToInventory(resource, auction.quantity);
        
        // Удаляем аукцион из списка моих аукционов
        this.myAuctions = this.myAuctions.filter(a => a.id !== parseInt(auctionId));
        
        // Удаляем аукцион из списка активных аукционов
        this.activeAuctions = this.activeAuctions.filter(a => a.id !== parseInt(auctionId));
        
        // Обновляем отображение
        this.renderMyAuctions();
        this.renderActiveAuctions();
        
        // Показываем уведомление
        UI.showNotification('Аукцион отменен', 'success');
    },
    
    // Сделать ставку на аукцион
    placeBid: function(auctionId, bidAmount) {
        // Проверяем, авторизован ли пользователь
        if (!Game.player.loggedIn) {
            UI.showNotification('Сначала войдите в игру', 'error');
            return;
        }
        
        // Проверяем достаточно ли золота
        if (Game.player.gold < bidAmount) {
            UI.showNotification('Недостаточно золота', 'error');
            return;
        }
        
        // Находим аукцион в списке активных аукционов
        const auction = this.activeAuctions.find(a => a.id === parseInt(auctionId));
        
        if (!auction) {
            UI.showNotification('Аукцион не найден', 'error');
            return;
        }
        
        // Проверяем, не наш ли это аукцион
        if (auction.seller_id === Game.player.id) {
            UI.showNotification('Вы не можете сделать ставку на свой аукцион', 'error');
            return;
        }
        
        // Проверяем, не является ли игрок текущим покупателем
        if (auction.current_bidder === Game.player.name) {
            UI.showNotification('Вы уже являетесь текущим покупателем', 'error');
            return;
        }
        
        // Проверяем, достаточно ли высока ставка
        if (bidAmount <= auction.current_price) {
            UI.showNotification('Ставка должна быть выше текущей цены', 'error');
            return;
        }
        
        // Отправляем запрос на сервер
        $.ajax({
            url: 'auction_system.php',
            type: 'POST',
            data: {
                action: 'place_bid',
                user_id: Game.player.id,
                auction_id: auctionId,
                bid_amount: bidAmount
            },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        // Обновляем информацию об аукционе
                        auction.current_price = bidAmount;
                        auction.current_bidder = Game.player.name;
                        auction.bids_count++;
                        
                        // Обновляем отображение
                        Auction.renderActiveAuctions();
                        
                        // Обновляем золото игрока
                        Game.updateGold(-bidAmount);
                        
                        // Показываем уведомление
                        UI.showNotification('Ставка успешно сделана', 'success');
                    } else {
                        UI.showNotification(result.message, 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа:', error);
                    Auction.simulatePlaceBid(auctionId, bidAmount);
                }
            },
            error: function() {
                console.error('Ошибка при подключении к серверу');
                Auction.simulatePlaceBid(auctionId, bidAmount);
            }
        });
    },
    
    // Симуляция ставки (для offline режима или тестирования)
    simulatePlaceBid: function(auctionId, bidAmount) {
        // Находим аукцион в списке активных аукционов
        const auction = this.activeAuctions.find(a => a.id === parseInt(auctionId));
        
        if (!auction) {
            UI.showNotification('Аукцион не найден', 'error');
            return;
        }
        
        // Проверяем, не наш ли это аукцион
        if (auction.seller_id === Game.player.id) {
            UI.showNotification('Вы не можете сделать ставку на свой аукцион', 'error');
            return;
        }
        
        // Проверяем, не является ли игрок текущим покупателем
        if (auction.current_bidder === Game.player.name) {
            UI.showNotification('Вы уже являетесь текущим покупателем', 'error');
            return;
        }
        
        // Проверяем, достаточно ли высока ставка
        if (bidAmount <= auction.current_price) {
            UI.showNotification('Ставка должна быть выше текущей цены', 'error');
            return;
        }
        
        // Обновляем информацию об аукционе
        auction.current_price = bidAmount;
        auction.current_bidder = Game.player.name;
        auction.bids_count++;
        
        // Обновляем золото игрока
        Game.updateGold(-bidAmount);
        
        // Обновляем отображение
        this.renderActiveAuctions();
        
        // Показываем уведомление
        UI.showNotification('Ставка успешно сделана', 'success');
    },
    
    // Обновление списка аукционов для выбора ресурса
    updateResourceSelect: function() {
        const select = $('#auction-resource');
        select.empty();
        
        // Добавляем опции для каждого ресурса в инвентаре
        Game.inventory.forEach(item => {
            select.append($(`<option value="${item.resource_id}" data-amount="${item.amount}">${item.name} (${item.amount} шт.)</option>`));
        });
        
        // Обновляем максимальное количество в поле ввода
        this.updateQuantityMax();
        
        // Добавляем обновление подсказки с рекомендуемой ценой
        this.updatePriceHint();
    },
    
    // Обновление максимального количества для ввода
    updateQuantityMax: function() {
        const resourceSelect = $('#auction-resource');
        const quantityInput = $('#auction-quantity');
        
        if (resourceSelect.find('option:selected').length === 0) {
            quantityInput.attr('max', 1);
            return;
        }
        
        const maxAmount = resourceSelect.find('option:selected').data('amount');
        quantityInput.attr('max', maxAmount);
        
        // Если текущее значение больше максимального, обновляем его
        if (parseInt(quantityInput.val()) > maxAmount) {
            quantityInput.val(maxAmount);
        }
    },
    
    // Обновление рекомендуемой цены с учетом текущей рыночной цены
    updatePriceHint: function() {
        const resourceId = $('#auction-resource').val();
        
        if (!resourceId) {
            $('#price-hint').text('Выберите ресурс для отображения рекомендуемой цены');
            return;
        }
        
        // Получаем текущую рыночную цену для ресурса
        let marketPrice = 0;
        
        // Попытка получить цену из модуля Resources
        if (typeof Resources !== 'undefined' && Resources.getResourcePrice) {
            marketPrice = Resources.getResourcePrice(resourceId);
        } else {
            // Если функция недоступна, пытаемся получить из базовой цены
            const resource = Resources.getResourceById(resourceId);
            marketPrice = resource ? resource.base_price : 0;
        }
        
        // Если не удалось получить цену, просто скрываем подсказку
        if (!marketPrice) {
            $('#price-hint').hide();
            return;
        }
        
        // Вычисляем рекомендуемую цену (на 10% выше рыночной)
        const recommendedPrice = Math.ceil(marketPrice * 1.1);
        
        // Обновляем текст подсказки
        $('#price-hint').show().html(
            'Рекомендуемая начальная цена: <strong>' + recommendedPrice + '</strong> золота ' +
            '(текущая рыночная цена: ' + marketPrice + ' золота)'
        );
        
        // Также обновляем поле ввода начальной цены
        $('#auction-start-price').val(recommendedPrice);
    },
    
    // Логирование информации о завершенных аукционах для анализа рыночных цен
    logAuctionCompletion: function(auction) {
        // Этот код запускается при завершении аукциона
        // Отправляем данные на сервер для учета в расчете рыночных цен
        $.ajax({
            url: 'auction_system.php',
            type: 'POST',
            data: {
                action: 'log_auction_completion',
                auction_id: auction.id,
                resource_id: auction.resource_id,
                quantity: auction.quantity,
                final_price: auction.current_price,
                has_buyer: auction.current_bidder_id !== null
            },
            success: function(response) {
                console.log('Данные о завершенном аукционе отправлены для анализа');
            },
            error: function() {
                console.error('Ошибка при отправке данных о завершенном аукционе');
            }
        });
    },
    
    // Инициализация обработчиков событий
    initEventHandlers: function() {
        // Делегирование событий для кнопок ставок
        $('#auctions-list').on('click', '.bid-button', function() {
            const auctionId = $(this).data('id');
            const currentPrice = parseFloat($(this).data('price'));
            
            // Показываем модальное окно для ввода ставки
            UI.showModal('Сделать ставку', `
                <div class="bid-form">
                    <p>Текущая цена: ${currentPrice} золота</p>
                    <label for="bid-amount">Ваша ставка:</label>
                    <input type="number" id="bid-amount" min="${currentPrice + 1}" value="${Math.ceil(currentPrice * 1.1)}" step="1">
                    <div class="modal-buttons">
                        <button id="confirm-bid" class="game-button">Подтвердить ставку</button>
                        <button id="cancel-bid" class="game-button secondary">Отмена</button>
                    </div>
                </div>
            `);
            
            // Обработчик для кнопки подтверждения ставки
            $('#confirm-bid').on('click', function() {
                const bidAmount = parseInt($('#bid-amount').val());
                
                if (bidAmount <= currentPrice) {
                    UI.showNotification('Ставка должна быть выше текущей цены', 'error');
                    return;
                }
                
                Auction.placeBid(auctionId, bidAmount);
                UI.closeModal();
            });
            
            // Обработчик для кнопки отмены
            $('#cancel-bid').on('click', function() {
                UI.closeModal();
            });
        });
        
        // Делегирование событий для кнопок отмены аукциона
        $('#my-auctions-list').on('click', '.cancel-auction-button', function() {
            const auctionId = $(this).data('id');
            
            // Показываем модальное окно подтверждения
            UI.showModal('Отменить аукцион', `
                <p>Вы уверены, что хотите отменить этот аукцион?</p>
                <p>Ресурсы будут возвращены в ваш инвентарь.</p>
                <div class="modal-buttons">
                    <button id="confirm-cancel" class="game-button">Да, отменить</button>
                    <button id="abort-cancel" class="game-button secondary">Нет, оставить</button>
                </div>
            `);
            
            // Обработчик для кнопки подтверждения отмены
            $('#confirm-cancel').on('click', function() {
                Auction.cancelAuction(auctionId);
                UI.closeModal();
            });
            
            // Обработчик для кнопки отмены отмены
            $('#abort-cancel').on('click', function() {
                UI.closeModal();
            });
        });
        
        // Обработчики для вкладок аукциона
        $('.auction-tab').on('click', function() {
            // Удаляем класс active у всех вкладок и их содержимого
            $('.auction-tab').removeClass('active');
            $('.auction-tab-content').removeClass('active');
            
            // Добавляем класс active к выбранной вкладке и соответствующему содержимому
            $(this).addClass('active');
            $('#' + $(this).data('tab')).addClass('active');
            
            // Загружаем данные в зависимости от выбранной вкладки
            if ($(this).data('tab') === 'active-auctions') {
                Auction.loadActiveAuctions();
            } else if ($(this).data('tab') === 'my-auctions') {
                Auction.loadMyAuctions();
            } else if ($(this).data('tab') === 'create-auction') {
                Auction.updateResourceSelect();
            }
        });
        
        // Обработчик изменения выбранного ресурса
        $('#auction-resource').on('change', function() {
            Auction.updateQuantityMax();
            Auction.updatePriceHint();
        });
        
        // Обработчик для кнопки создания аукциона
        $('#create-auction-button').on('click', function() {
            const resourceId = $('#auction-resource').val();
            const quantity = parseInt($('#auction-quantity').val());
            const startPrice = parseInt($('#auction-start-price').val());
            const duration = parseInt($('#auction-duration').val());
            
            if (!resourceId) {
                UI.showNotification('Выберите ресурс', 'error');
                return;
            }
            
            if (isNaN(quantity) || quantity < 1) {
                UI.showNotification('Укажите корректное количество', 'error');
                return;
            }
            
            if (isNaN(startPrice) || startPrice < 1) {
                UI.showNotification('Укажите корректную начальную цену', 'error');
                return;
            }
            
            if (isNaN(duration) || duration < 1 || duration > 48) {
                UI.showNotification('Укажите корректную длительность (от 1 до 48 часов)', 'error');
                return;
            }
            
            Auction.createAuction(resourceId, quantity, startPrice, duration);
        });
    }
};