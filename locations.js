/**
 * Модуль для работы с локациями
 * Ресурсная Империя
 */

const Locations = {
    // Список локаций
    list: [],
    
    // Интервал для автоматической добычи
    miningInterval: null,
    
    // Флаг, указывающий идет ли добыча ресурсов
    isMining: false,
    
    // Начальное время для таймера в секундах
    initialCountdown: 0,
    
    // Текущее значение таймера
    countdown: 0,
    
    // Общее время добычи (накопительный таймер) в секундах
    totalMiningTime: 0,
    
    // Интервал для отсчета времени
    countdownInterval: null,
    
    // Инициализация модуля
    init: function() {
        console.log('Инициализация модуля локаций');
        
        // Загружаем локации с сервера
        this.loadLocations();
        
        // Проверка загрузки локаций через 2 секунды
        setTimeout(() => {
            console.log('Проверка локаций через 2 секунды:', this.list);
            if (this.list.length === 0) {
                console.warn('ВНИМАНИЕ! Локации не загружены через 2 секунды после инициализации!');
                this.loadDemoLocations();
            }
        }, 2000);
        
        // Инициализируем обработчики событий
        this.initEventHandlers();
    },
    
    // Загрузка локаций с сервера
    loadLocations: function() {
        $.ajax({
            url: 'game_actions.php',
            type: 'POST',
            data: {
                action: 'get_locations'
            },
            success: function(response) {
                try {
                    console.log('Ответ сервера:', response); // Для отладки
                    const result = JSON.parse(response);
                    
                    if (result.success && result.locations && result.locations.length > 0) {
                        Locations.list = result.locations;
                        Locations.renderLocations();
                    } else {
                        console.error('Ошибка при загрузке локаций:', result.message || 'Неизвестная ошибка');
                        // Если не удалось загрузить с сервера, используем демо-данные
                        Locations.loadDemoLocations();
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа:', error);
                    Locations.loadDemoLocations();
                }
            },
            error: function(xhr, status, error) {
                console.error('Ошибка при подключении к серверу:', status, error);
                Locations.loadDemoLocations();
            }
        });
    },
    
    // Загрузка демо-локаций (для отладки или при недоступности сервера)
    loadDemoLocations: function() {
        console.log('Загрузка демо-локаций');
        
        this.list = [
            {
                id: 1,
                name: 'Зачарованный лес',
                description: 'Древний лес, полный таинственных существ и редких ресурсов. Здесь можно добыть ценную древесину, травы и магические кристаллы.',
                image: 'https://cdnjs.cloudflare.com/ajax/libs/simple-backgrounds/1.0.0/forest.jpg',
                difficulty: 1,
                energy_cost: 5,
                resources: [
                    { id: 1, name: 'Дуб', rarity: 'common', min_amount: 1, max_amount: 3, probability: 0.7 },
                    { id: 2, name: 'Эльфийская трава', rarity: 'uncommon', min_amount: 1, max_amount: 2, probability: 0.4 },
                    { id: 3, name: 'Магический кристалл', rarity: 'rare', min_amount: 1, max_amount: 1, probability: 0.1 }
                ]
            },
            {
                id: 2,
                name: 'Горные пики',
                description: 'Высокие горы, богатые рудой и минералами. Добыча здесь сложнее, но вознаграждение значительно больше.',
                image: 'https://cdnjs.cloudflare.com/ajax/libs/simple-backgrounds/1.0.0/mountains.jpg',
                difficulty: 2,
                energy_cost: 8,
                resources: [
                    { id: 4, name: 'Железная руда', rarity: 'common', min_amount: 1, max_amount: 4, probability: 0.7 },
                    { id: 5, name: 'Серебро', rarity: 'uncommon', min_amount: 1, max_amount: 2, probability: 0.4 },
                    { id: 6, name: 'Золотая жила', rarity: 'rare', min_amount: 1, max_amount: 1, probability: 0.1 }
                ]
            },
            {
                id: 3,
                name: 'Пустынные дюны',
                description: 'Бескрайняя пустыня, скрывающая под песками древние сокровища и редкие материалы.',
                image: 'https://cdnjs.cloudflare.com/ajax/libs/simple-backgrounds/1.0.0/desert.jpg',
                difficulty: 3,
                energy_cost: 10,
                resources: [
                    { id: 7, name: 'Песок', rarity: 'common', min_amount: 2, max_amount: 5, probability: 0.7 },
                    { id: 8, name: 'Пустынный кварц', rarity: 'uncommon', min_amount: 1, max_amount: 2, probability: 0.4 },
                    { id: 9, name: 'Древний артефакт', rarity: 'rare', min_amount: 1, max_amount: 1, probability: 0.1 }
                ]
            },
            {
                id: 4,
                name: 'Прибрежные воды',
                description: 'Морское побережье со множеством подводных пещер, богатых жемчугом и редкими морскими ресурсами.',
                image: 'https://cdnjs.cloudflare.com/ajax/libs/simple-backgrounds/1.0.0/coast.jpg',
                difficulty: 2,
                energy_cost: 7,
                resources: [
                    { id: 10, name: 'Морская соль', rarity: 'common', min_amount: 2, max_amount: 4, probability: 0.7 },
                    { id: 11, name: 'Жемчуг', rarity: 'uncommon', min_amount: 1, max_amount: 2, probability: 0.4 },
                    { id: 12, name: 'Коралл', rarity: 'rare', min_amount: 1, max_amount: 1, probability: 0.1 }
                ]
            },
            {
                id: 5,
                name: 'Глубокие пещеры',
                description: 'Тёмные подземные лабиринты, наполненные драгоценными камнями и загадочными артефактами.',
                image: 'https://cdnjs.cloudflare.com/ajax/libs/simple-backgrounds/1.0.0/cave.jpg',
                difficulty: 4,
                energy_cost: 12,
                resources: [
                    { id: 13, name: 'Уголь', rarity: 'common', min_amount: 2, max_amount: 5, probability: 0.7 },
                    { id: 14, name: 'Аметист', rarity: 'uncommon', min_amount: 1, max_amount: 2, probability: 0.4 },
                    { id: 15, name: 'Алмаз', rarity: 'rare', min_amount: 1, max_amount: 1, probability: 0.1 }
                ]
            }
        ];
        
        this.renderLocations();
    },
    
    // Отрисовка локаций в компактном виде
    renderLocations: function() {
        console.log('Отрисовка локаций, количество:', this.list.length);
        
        const container = $('#locations-container');
        container.empty();
        
        if (!this.list || this.list.length === 0) {
            container.html('<p>Локации не найдены. Пожалуйста, обновите страницу или сообщите администратору.</p>');
            return;
        }
        
        // Создаем сетку локаций для компактного отображения
        const locationsGrid = $('<div class="locations-grid"></div>');
        
        this.list.forEach(location => {
            const card = $(`
                <div class="location-card-compact" data-id="${location.id}">
                    <div class="location-info-compact">
                        <div class="location-name-compact">${location.name}</div>
                        <button class="game-button explore-location" data-id="${location.id}">Исследовать</button>
                    </div>
                </div>
            `);
            
            locationsGrid.append(card);
        });
        
        container.append(locationsGrid);
    },
    
    // Получение HTML со звездами сложности
    getDifficultyStars: function(difficulty) {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < difficulty) {
                stars += '★';
            } else {
                stars += '☆';
            }
        }
        return stars;
    },
    
    // Получение локации по ID
    getLocationById: function(id) {
        // Принудительно преобразуем ID в число
        const numericId = parseInt(id);
        console.log('Поиск локации с ID:', numericId, typeof numericId);
        
        // Перебираем каждую локацию вручную для отладки
        let foundLocation = null;
        for (let i = 0; i < this.list.length; i++) {
            const location = this.list[i];
            const locationId = parseInt(location.id);
            console.log(`Сравниваем: локация ${location.name}, ID=${locationId} (${typeof locationId}) с искомым ID=${numericId} (${typeof numericId})`);
            if (locationId === numericId) {
                console.log('НАЙДЕНО СОВПАДЕНИЕ!');
                foundLocation = location;
                break;
            }
        }
        
        console.log('Результат поиска локации:', foundLocation);
        return foundLocation;
    },
    
    // Переход в локацию
    goToLocation: function(locationId) {
        console.log('Текущее количество локаций:', this.list.length);
        
        if (this.list.length === 0) {
            console.error('Список локаций пуст! Загружаем демо-данные...');
            this.loadDemoLocations();
            
            // Повторяем попытку после загрузки демо-данных
            setTimeout(() => {
                this.goToLocation(locationId);
            }, 500);
            
            return;
        }
        
        console.log('Список всех локаций:', JSON.stringify(this.list));
        console.log('Выбранный ID локации:', locationId, 'тип:', typeof locationId);
        
        // Находим локацию в списке
        const location = this.getLocationById(locationId);
        
        if (!location) {
            UI.showNotification('Локация не найдена (ID: ' + locationId + ')', 'error');
            console.error('Локация не найдена в списке. ID:', locationId);
            return;
        }
        
        // Устанавливаем текущую локацию
        Game.currentLocation = location;
        
        // Обновляем интерфейс экрана добычи
        $('#location-name').text(location.name);
        $('#location-description').text(location.description);
        this.renderLocationResources(location);

        
        // Переключаемся на экран добычи
        Game.switchScreen('mining-screen');
    },
    
// Обновленная функция отрисовки ресурсов локации с добавлением id для элементов
renderLocationResources: function(location) {
    const container = $('#available-resources');
    container.empty();
    
    if (!location.resources || location.resources.length === 0) {
        container.html('<p>Ресурсы не найдены в этой локации</p>');
        return;
    }
    
    // Создаем виджет автоматической добычи с явным id для параграфа
    const miningWidget = $(`
        <div class="auto-mining-widget" id="auto-mining-widget">
            <div class="auto-mining-title">
                <i class="mining-icon"></i> Автоматическая добыча ресурсов
            </div>
            <p class="mining-description" id="mining-description">Нажмите кнопку ниже, чтобы начать добычу ресурсов. Ресурсы будут добываться автоматически и добавляться в ваш инвентарь.</p>
            <div class="mining-controls">
                <button id="start-mining" class="game-button">
                    <span class="mining-status">Начать</span>
                </button>
            </div>
        </div>
    `);
    
    container.append(miningWidget);
    
    // Создаем контейнер для выпадающего списка ресурсов
    const resourcesDropdown = $(`
        <div class="resources-dropdown">
            <div class="dropdown-header">
                <span class="dropdown-title">Список доступных ресурсов</span>
                <button class="dropdown-toggle"><span class="toggle-icon">▼</span></button>
            </div>
            <div class="dropdown-content" style="display: none;">
                <!-- Таблица ресурсов будет добавлена сюда -->
            </div>
        </div>
    `);
    
    container.append(resourcesDropdown);
    
    // Создаем стилизованную таблицу ресурсов
    const resourcesContainer = $('<div class="resources-table-container"></div>');
    
    // Создаем таблицу ресурсов с более компактной структурой
    const table = $(`
        <table class="resources-table">
            <thead>
                <tr>
                    <th class="resource-name-col">Название</th>
                    <th class="resource-rarity-col">Тип</th>
                    <th class="resource-yield-col">Кол-во</th>
                    <th class="resource-probability-col">Шанс</th>
                </tr>
            </thead>
            <tbody id="resources-table-body">
            </tbody>
        </table>
    `);
    
    resourcesContainer.append(table);
    $('.dropdown-content', resourcesDropdown).append(resourcesContainer);
    
    const tableBody = $('#resources-table-body');
    
    // Сортируем ресурсы по возрастанию шанса выпадения
    const difficulty = location.difficulty || 1;
    
    const sortedResources = [...location.resources].sort((a, b) => {
        // Вычисляем вероятности с учетом сложности локации
        const probabilityA = (a.probability || 0.5) / difficulty;
        const probabilityB = (b.probability || 0.5) / difficulty;
        
        // Сортируем по возрастанию (от наименьшей вероятности к наибольшей)
        return probabilityA - probabilityB;
    });
    
    // Добавляем строки с ресурсами
    sortedResources.forEach(resource => {
        const rarityClass = this.getRarityClass(resource.rarity);
        // Вычисляем вероятность с учетом сложности локации и округляем до одного знака после запятой
        const probability = ((resource.probability || 0.5) / location.difficulty * 100).toFixed(1);
        
        const probabilityClass = probability >= 50 ? "high-probability" : 
                               probability >= 20 ? "medium-probability" : "low-probability";
        
        const row = $(`
            <tr class="resource-row ${rarityClass}">
                <td class="resource-name-col" title="${resource.name}"><span class="resource-name">${resource.name}</span></td>
                <td class="resource-rarity-col">${this.formatRarityShort(resource.rarity)}</td>
                <td class="resource-yield-col">${resource.min_amount || 1}-${resource.max_amount || 1}</td>
                <td class="resource-probability-col">
                    <span class="probability-value ${probabilityClass}">${probability}%</span>
                </td>
            </tr>
        `);
        
        tableBody.append(row);
    });
    
    // Добавляем обработчик для кнопки скрытия/показа списка ресурсов
    $('.dropdown-toggle', resourcesDropdown).on('click', function() {
        const content = $('.dropdown-content', resourcesDropdown);
        const icon = $('.toggle-icon', this);
        
        if (content.is(':visible')) {
            content.slideUp(200);
            icon.text('▼');
        } else {
            content.slideDown(200);
            icon.text('▲');
        }
    });
    
    // Также позволяем кликать на заголовок для раскрытия/скрытия
    $('.dropdown-title', resourcesDropdown).on('click', function() {
        $('.dropdown-toggle', resourcesDropdown).click();
    });
},

startMining: function() {
    console.log("startMining вызван. Состояние isMining:", this.isMining);
    
    // Если уже идет добыча, ничего не делаем
    if (this.isMining) {
        console.log("Добыча уже запущена, выходим");
        return;
    }
    
    // Проверяем, выбрана ли локация
    if (!Game.currentLocation) {
        UI.showNotification('Выберите локацию для добычи', 'error');
        return;
    }
    
    // Сбрасываем предыдущие интервалы для надежности
    clearTimeout(this.miningInterval);
    clearInterval(this.countdownInterval);
    
    // Устанавливаем флаг добычи
    this.isMining = true;
    console.log("Флаг isMining установлен в", this.isMining);
    
    // Сбрасываем накопительный таймер
    this.totalMiningTime = 0;
    
    // Обновляем интерфейс
    const $button = $('#start-mining');
    $button.html('<span class="mining-status">Остановить</span>');
    $button.addClass('mining-active');
    
    // Добавляем индикатор статуса добычи, если его еще нет
    if ($('#mining-status-indicator').length === 0) {
        $('.auto-mining-widget').append(`
            <div id="mining-status-indicator" class="mining-status-indicator">
                <div class="status-circle"></div>
                <span class="status-text">Идет поиск ресурсов...</span>
            </div>
        `);
    }
    
    // Получаем случайное время для первой добычи
    this.initialCountdown = this.getRandomMiningTime();
    this.countdown = this.initialCountdown;
    
    // Запускаем первую добычу
    console.log("Планирование первой добычи...");
    this.scheduleMining();
    
    // Показываем уведомление
    UI.showNotification('Добыча ресурсов началась', 'success');
},

// Новая функция - реализация старта добычи
startMiningImpl: function() {
    console.log("startMiningImpl вызван");
    
    // Сбрасываем предыдущие интервалы, если они были
    clearTimeout(this.miningInterval);
    clearInterval(this.countdownInterval);
    
    this.isMining = true;
    console.log("Установлен флаг isMining =", this.isMining);
    
    // Сбрасываем накопительный таймер
    this.totalMiningTime = 0;
    
    const $button = $('#start-mining');
    $button.html('<span class="mining-status">Остановить</span>');
    $button.addClass('mining-active');
    
    // Получаем случайное время для первой добычи (5-15 секунд)
    this.initialCountdown = this.getRandomMiningTime();
    this.countdown = this.initialCountdown;
    
    // Запускаем первую добычу
    this.scheduleMining();
    
    // Показываем уведомление
    UI.showNotification('Добыча ресурсов началась', 'success');
},

stopMining: function() {
    console.log("stopMining вызван. Состояние isMining:", this.isMining);
    
    // Если добыча уже остановлена, ничего не делаем
    if (!this.isMining) {
        console.log("Добыча уже остановлена, выходим");
        return;
    }
    
    // Очищаем интервалы и таймеры
    clearTimeout(this.miningInterval);
    clearInterval(this.countdownInterval);
    this.miningInterval = null;
    this.countdownInterval = null;
    
    // Меняем флаг
    this.isMining = false;
    console.log("Флаг isMining установлен в", this.isMining);
    
    // Обновляем интерфейс
    const $button = $('#start-mining');
    $button.html('<span class="mining-status">Начать</span>');
    $button.removeClass('mining-active');
    
    // Удаляем индикатор статуса
    $('#mining-status-indicator').fadeOut(400, function() {
        $(this).remove();
    });
    
    // Показываем уведомление ТОЛЬКО если был какой-то процесс добычи
    if (this.totalMiningTime > 0) {
        Resources.addMiningLog('Система', 0, false, this.totalMiningTime, 'Добыча ресурсов остановлена вручную');
        UI.showNotification('Добыча ресурсов остановлена', 'info');
        // Сбрасываем накопительный таймер
        this.totalMiningTime = 0;
    }
},

scheduleMining: function() {
    // Очищаем предыдущий интервал
    clearTimeout(this.miningInterval);
    
    // Получаем случайное время для добычи (5-15 секунд)
    const miningTime = this.getRandomMiningTime() * 1000; // преобразуем в миллисекунды
    
    console.log('Планирование добычи через', miningTime/1000, 'секунд');
    
    // Устанавливаем таймер для следующей добычи
    this.miningInterval = setTimeout(() => {
        // Проверяем, что добыча все еще активна
        if (!this.isMining) return;
        
        // Выполняем добычу ресурса
        this.attemptResourceMining();
        
        // Обновление накопительного времени
        this.totalMiningTime += this.initialCountdown;
        
        // Получаем новое случайное время для следующей добычи
        this.initialCountdown = this.getRandomMiningTime();
        this.countdown = this.initialCountdown;
        
        // Планируем следующую добычу, если процесс все еще активен
        if (this.isMining) {
            this.scheduleMining();
        }
    }, miningTime);
},

// Обновленный метод для попытки добычи случайного ресурса с добавлением визуальных эффектов
attemptResourceMining: function() {
    console.log('Попытка добычи ресурса...');
    
    // Выбираем случайный ресурс из текущей локации
    const resources = Game.currentLocation.resources;
    const resourceIndex = Math.floor(Math.random() * resources.length);
    const resource = resources[resourceIndex];
    
    // Проверяем вероятность добычи ресурса с учетом сложности локации
    const difficulty = Game.currentLocation.difficulty || 1;
    
    // Получаем вероятность из параметра probability или устанавливаем значение по умолчанию
    const baseProbability = resource.probability || 0.5;
    
    // Корректируем вероятность с учетом сложности
    const actualProbability = baseProbability / difficulty;
    
    // Бросаем кость (генерируем случайное число от 0 до 1)
    const roll = Math.random();
    
    console.log(`Попытка добычи ${resource.name}, вероятность: ${(actualProbability * 100).toFixed(1)}%, бросок: ${(roll * 100).toFixed(1)}%`);
    
    // Обновляем текст индикатора
    $('#mining-status-indicator .status-text').text(`Поиск ресурса: ${resource.name}...`);
    
    // Если игрок авторизован и это случайный ресурс, отправляем запрос на сервер
    if (Game.player.loggedIn && Game.currentLocation && Game.currentLocation.id) {
        $.ajax({
            url: 'game_actions.php',
            type: 'POST',
            data: {
                action: 'mine_resource',
                user_id: Game.player.id,
                location_id: Game.currentLocation.id,
                resource_id: resource.id,
                mining_time: this.totalMiningTime
            },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        // Получаем полную информацию о ресурсе
                        const resourceInfo = Resources.getResourceById(parseInt(resource.id));
                        
                        // Если информация о ресурсе найдена, добавляем его в инвентарь
                        if (resourceInfo) {
                            Resources.addToInventory(resourceInfo, result.amount);
                            Resources.addMiningLog(resourceInfo.name, result.amount, true, Locations.totalMiningTime);
                            UI.showNotification(`Добыто ${result.amount} ${resourceInfo.name}`, 'success');
                            
                            // Воспроизводим звук успешной добычи
                            Locations.playMiningSound(true);
                            
                            // Добавляем эффект успешной добычи
                            $('.auto-mining-widget').addClass('mining-success-flash');
                            setTimeout(() => {
                                $('.auto-mining-widget').removeClass('mining-success-flash');
                            }, 1000);
                            
                            // Обновляем текст индикатора
                            $('#mining-status-indicator .status-text').text(`Успешно добыто: ${resourceInfo.name}`);
                            $('#mining-status-indicator').addClass('success-indicator');
                            setTimeout(() => {
                                $('#mining-status-indicator .status-text').text('Идет поиск ресурсов...');
                                $('#mining-status-indicator').removeClass('success-indicator');
                            }, 3000);
                            
                            console.log(`Успешно добыто ${result.amount} ${resourceInfo.name}`);
                        }
                    } else {
                        // Если добыча не удалась, добавляем запись в лог
                        Resources.addMiningLog(resource.name, 0, false, Locations.totalMiningTime, result.message);
                        
                        // Воспроизводим звук неудачной попытки
                        Locations.playMiningSound(false);
                        
                        // Обновляем текст индикатора
                        $('#mining-status-indicator .status-text').text(`Не удалось добыть: ${resource.name}`);
                        $('#mining-status-indicator').addClass('failure-indicator');
                        setTimeout(() => {
                            $('#mining-status-indicator .status-text').text('Идет поиск ресурсов...');
                            $('#mining-status-indicator').removeClass('failure-indicator');
                        }, 3000);
                        
                        console.log(`Не удалось добыть ${resource.name}: ${result.message}`);
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа:', error);
                    // Обрабатываем локально при ошибке связи
                    Locations.handleLocalMining(resource, roll, actualProbability);
                }
            },
            error: function() {
                console.error('Ошибка при подключении к серверу');
                // Обрабатываем локально при ошибке связи
                Locations.handleLocalMining(resource, roll, actualProbability);
            }
        });
    } else {
        // Для неавторизованных пользователей или при отсутствии ID локации обрабатываем локально
        this.handleLocalMining(resource, roll, actualProbability);
    }
},

// Локальная обработка добычи (для неавторизованных пользователей или при ошибках связи)
handleLocalMining: function(resource, roll, actualProbability) {
    // Если выпало число меньше вероятности, считаем, что добыча успешна
    if (roll < actualProbability) {
        // Определяем количество добытого ресурса
        const minAmount = resource.min_amount || 1;
        const maxAmount = resource.max_amount || 1;
        const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
        
        // Получаем полную информацию о ресурсе
        const resourceInfo = Resources.getResourceById(parseInt(resource.id));
        
        // Если информация о ресурсе найдена, добавляем его в инвентарь
        if (resourceInfo) {
            Resources.addToInventory(resourceInfo, amount);
            Resources.addMiningLog(resourceInfo.name, amount, true, this.totalMiningTime);
            UI.showNotification(`Добыто ${amount} ${resourceInfo.name}`, 'success');
            
            // Воспроизводим звук успешной добычи
            this.playMiningSound(true);
            
            // Добавляем эффект успешной добычи
            $('.auto-mining-widget').addClass('mining-success-flash');
            setTimeout(() => {
                $('.auto-mining-widget').removeClass('mining-success-flash');
            }, 1000);
            
            // Обновляем текст индикатора
            $('#mining-status-indicator .status-text').text(`Успешно добыто: ${resourceInfo.name}`);
            $('#mining-status-indicator').addClass('success-indicator');
            setTimeout(() => {
                $('#mining-status-indicator .status-text').text('Идет поиск ресурсов...');
                $('#mining-status-indicator').removeClass('success-indicator');
            }, 3000);
            
            console.log(`Успешно добыто ${amount} ${resourceInfo.name}`);
        }
    } else {
        // Если добыча не удалась, добавляем запись в лог
        Resources.addMiningLog(resource.name, 0, false, this.totalMiningTime, 'Не удалось добыть ресурс');
        
        // Воспроизводим звук неудачной попытки
        this.playMiningSound(false);
        
        // Обновляем текст индикатора
        $('#mining-status-indicator .status-text').text(`Не удалось добыть: ${resource.name}`);
        $('#mining-status-indicator').addClass('failure-indicator');
        setTimeout(() => {
            $('#mining-status-indicator .status-text').text('Идет поиск ресурсов...');
            $('#mining-status-indicator').removeClass('failure-indicator');
        }, 3000);
        
        console.log(`Не удалось добыть ${resource.name}`);
    }
},

// Получение случайного времени для добычи (от 5 до 15 секунд)
getRandomMiningTime: function() {
    return Math.floor(Math.random() * 11) + 5; // от 5 до 15
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
},

// Очистка всех интервалов и таймеров при уходе с экрана
cleanupMining: function() {
    // Останавливаем добычу при уходе с экрана
    this.stopMining();
    
    // Дополнительная очистка интервалов для надежности
    clearTimeout(this.miningInterval);
    clearInterval(this.countdownInterval);
    this.miningInterval = null;
    this.countdownInterval = null;
    
    console.log('Очистка интервалов добычи');
},

// Добавление метода для получения короткого названия редкости
formatRarityShort: function(rarity) {
    switch (rarity) {
        case 'common': return 'Обычн.';
        case 'uncommon': return 'Необычн.';
        case 'rare': return 'Редкий';
        case 'epic': return 'Эпич.';
        case 'legendary': return 'Легенд.';
        default: return rarity;
    }
},

// Добавление метода для получения короткого названия редкости
formatRarityShort: function(rarity) {
    switch (rarity) {
        case 'common': return 'Обычн.';
        case 'uncommon': return 'Необычн.';
        case 'rare': return 'Редкий';
        case 'epic': return 'Эпич.';
        case 'legendary': return 'Легенд.';
        default: return rarity;
    }
},

// Добавление метода для получения короткого названия редкости
formatRarityShort: function(rarity) {
    switch (rarity) {
        case 'common': return 'Обычн.';
        case 'uncommon': return 'Необычн.';
        case 'rare': return 'Редкий';
        case 'epic': return 'Эпич.';
        case 'legendary': return 'Легенд.';
        default: return rarity;
    }
},
    
    
    
// Планирование следующей добычи - с исправленной логикой
scheduleMining: function() {
    // Очищаем предыдущий интервал
    clearTimeout(this.miningInterval);
    
    // Получаем случайное время для добычи (5-15 секунд)
    const miningTime = this.getRandomMiningTime() * 1000; // преобразуем в миллисекунды
    
    console.log('Планирование добычи через', miningTime/1000, 'секунд');
    
    // Устанавливаем таймер для следующей добычи
    this.miningInterval = setTimeout(() => {
        // Проверяем, что добыча все еще активна
        if (!this.isMining) return;
        
        // Выполняем добычу ресурса
        this.attemptResourceMining();
        
        // Обновление накопительного времени
        this.totalMiningTime += this.initialCountdown;
        
        // Получаем новое случайное время для следующей добычи
        this.initialCountdown = this.getRandomMiningTime();
        this.countdown = this.initialCountdown;
        
        // Планируем следующую добычу, если процесс все еще активен
        if (this.isMining) {
            this.scheduleMining();
        }
    }, miningTime);
},
    
    // Получение случайного времени для добычи (от 5 до 15 секунд)
    getRandomMiningTime: function() {
        return Math.floor(Math.random() * 11) + 5; // от 5 до 15
    },
    
// Метод для попытки добычи случайного ресурса
attemptResourceMining: function() {
    console.log('Попытка добычи ресурса...');
    
    // Выбираем случайный ресурс из текущей локации
    const resources = Game.currentLocation.resources;
    const resourceIndex = Math.floor(Math.random() * resources.length);
    const resource = resources[resourceIndex];
    
    // Проверяем вероятность добычи ресурса с учетом сложности локации
    const difficulty = Game.currentLocation.difficulty || 1;
    
    // Получаем вероятность из параметра probability или устанавливаем значение по умолчанию
    const baseProbability = resource.probability || 0.5;
    
    // Корректируем вероятность с учетом сложности
    const actualProbability = baseProbability / difficulty;
    
    // Бросаем кость (генерируем случайное число от 0 до 1)
    const roll = Math.random();
    
    console.log(`Попытка добычи ${resource.name}, вероятность: ${(actualProbability * 100).toFixed(1)}%, бросок: ${(roll * 100).toFixed(1)}%`);
    
    // Если игрок авторизован и это случайный ресурс, отправляем запрос на сервер
    if (Game.player.loggedIn && Game.currentLocation && Game.currentLocation.id) {
        $.ajax({
            url: 'game_actions.php',
            type: 'POST',
            data: {
                action: 'mine_resource',
                user_id: Game.player.id,
                location_id: Game.currentLocation.id,
                resource_id: resource.id,
                mining_time: this.totalMiningTime
            },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        // Получаем полную информацию о ресурсе
                        const resourceInfo = Resources.getResourceById(parseInt(resource.id));
                        
                        // Если информация о ресурсе найдена, добавляем его в инвентарь
                        if (resourceInfo) {
                            Resources.addToInventory(resourceInfo, result.amount);
                            Resources.addMiningLog(resourceInfo.name, result.amount, true, Locations.totalMiningTime);
                            UI.showNotification(`Добыто ${result.amount} ${resourceInfo.name}`, 'success');
                            
                            // Воспроизводим звук успешной добычи
                            Locations.playMiningSound(true);
                            
                            console.log(`Успешно добыто ${result.amount} ${resourceInfo.name}`);
                        }
                    } else {
                        // Если добыча не удалась, добавляем запись в лог
                        Resources.addMiningLog(resource.name, 0, false, Locations.totalMiningTime, result.message);
                        
                        // Воспроизводим звук неудачной попытки
                        Locations.playMiningSound(false);
                        
                        console.log(`Не удалось добыть ${resource.name}: ${result.message}`);
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа:', error);
                    // Обрабатываем локально при ошибке связи
                    Locations.handleLocalMining(resource, roll, actualProbability);
                }
            },
            error: function() {
                console.error('Ошибка при подключении к серверу');
                // Обрабатываем локально при ошибке связи
                Locations.handleLocalMining(resource, roll, actualProbability);
            }
        });
    } else {
        // Для неавторизованных пользователей или при отсутствии ID локации обрабатываем локально
        this.handleLocalMining(resource, roll, actualProbability);
    }
},

// Локальная обработка добычи (для неавторизованных пользователей или при ошибках связи)
handleLocalMining: function(resource, roll, actualProbability) {
    // Если выпало число меньше вероятности, считаем, что добыча успешна
    if (roll < actualProbability) {
        // Определяем количество добытого ресурса
        const minAmount = resource.min_amount || 1;
        const maxAmount = resource.max_amount || 1;
        const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
        
        // Получаем полную информацию о ресурсе
        const resourceInfo = Resources.getResourceById(parseInt(resource.id));
        
        // Если информация о ресурсе найдена, добавляем его в инвентарь
        if (resourceInfo) {
            Resources.addToInventory(resourceInfo, amount);
            Resources.addMiningLog(resourceInfo.name, amount, true, this.totalMiningTime);
            UI.showNotification(`Добыто ${amount} ${resourceInfo.name}`, 'success');
            
            // Воспроизводим звук успешной добычи
            this.playMiningSound(true);
            
            console.log(`Успешно добыто ${amount} ${resourceInfo.name}`);
        }
    } else {
        // Если добыча не удалась, добавляем запись в лог
        Resources.addMiningLog(resource.name, 0, false, this.totalMiningTime, 'Не удалось добыть ресурс');
        
        // Воспроизводим звук неудачной попытки
        this.playMiningSound(false);
        
        console.log(`Не удалось добыть ${resource.name}`);
    }
},
    
    // Метод для остановки добычи ресурсов
// Метод для остановки добычи ресурсов с дополнительной надежностью
stopMining: function() {
    if (!this.isMining) return; // Если добыча уже остановлена, ничего не делаем
    
    // Очищаем интервалы и таймеры
    clearTimeout(this.miningInterval);
    clearInterval(this.countdownInterval);
    this.miningInterval = null;
    this.countdownInterval = null;
    
    this.isMining = false;
    
    // Задаем текст для описания
    const defaultDescription = 'Нажмите кнопку ниже, чтобы начать добычу ресурсов. Ресурсы будут добываться автоматически и добавляться в ваш инвентарь.';
    
    try {
        // Обновляем интерфейс кнопки
        var $button = $('#start-mining');
        if ($button.length) {
            $button.html('<span class="mining-status">Начать</span>');
            $button.removeClass('mining-active');
        }
        
        // Деактивируем виджет добычи
        var $widget = $('.auto-mining-widget');
        if ($widget.length) {
            $widget.removeClass('active');
        }
        
        // Возвращаем исходный текст описания - пробуем разные селекторы для надежности
        var descriptionUpdated = false;
        
        var $desc = $('.mining-description');
        if ($desc.length) {
            $desc.text(defaultDescription);
            descriptionUpdated = true;
        }
        
        if (!descriptionUpdated) {
            var $widgetParagraph = $('.auto-mining-widget p');
            if ($widgetParagraph.length) {
                $widgetParagraph.text(defaultDescription);
                descriptionUpdated = true;
            }
        }
        
        // Скрываем индикатор активности с анимацией, затем удаляем
        var $indicator = $('#mining-status-indicator');
        if ($indicator.length) {
            $indicator.fadeOut(400, function() {
                $(this).remove();
            });
        } else {
            // На всякий случай для надежности
            $('.mining-status-indicator').remove();
        }
    } catch(e) {
        console.error('Ошибка при обновлении интерфейса:', e);
        
        // Резервный вариант - прямое изменение DOM без jQuery
        try {
            document.querySelector('#start-mining').innerHTML = '<span class="mining-status">Начать</span>';
            document.querySelector('#start-mining').classList.remove('mining-active');
            
            var widgetElements = document.querySelectorAll('.auto-mining-widget');
            for (var i = 0; i < widgetElements.length; i++) {
                widgetElements[i].classList.remove('active');
            }
            
            var descElements = document.querySelectorAll('.mining-description');
            if (descElements.length > 0) {
                for (var j = 0; j < descElements.length; j++) {
                    descElements[j].textContent = defaultDescription;
                }
            } else {
                var paragraphs = document.querySelectorAll('.auto-mining-widget p');
                for (var k = 0; k < paragraphs.length; k++) {
                    paragraphs[k].textContent = defaultDescription;
                }
            }
            
            var indicators = document.querySelectorAll('.mining-status-indicator, #mining-status-indicator');
            for (var l = 0; l < indicators.length; l++) {
                indicators[l].remove();
            }
        } catch(domError) {
            console.error('Ошибка при прямом обновлении DOM:', domError);
        }
    }
    
    // Добавляем сообщение о завершении добычи в лог
    Resources.addMiningLog('Система', 0, false, this.totalMiningTime, 'Добыча ресурсов остановлена вручную');
    
    // Показываем уведомление
    UI.showNotification('Добыча ресурсов остановлена', 'info');
    
    console.log('Добыча ресурсов остановлена');
},
    
    
    // Форматирование времени в минуты и секунды
    formatTime: function(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    
    // Очистка всех интервалов и таймеров при уходе с экрана
    cleanupMining: function() {
        // Останавливаем добычу при уходе с экрана
        this.stopMining();
        
        // Дополнительная очистка интервалов для надежности
        clearTimeout(this.miningInterval);
        clearInterval(this.countdownInterval);
        this.miningInterval = null;
        this.countdownInterval = null;
        
        console.log('Очистка интервалов добычи');
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
    
// Обработчик для кнопки начала/остановки добычи (добавить в метод initEventHandlers)
initEventHandlers: function() {
    // Делегирование событий для кнопок исследования локаций
    $('#locations-container').on('click', '.explore-location', function() {
        const locationId = $(this).data('id');
        console.log('Клик по кнопке локации:', locationId);
        Locations.goToLocation(locationId);
    });

    // Добавляем обработчик клика для всей карточки локации
    $('#locations-container').on('click', '.location-card-compact', function(e) {
        // Проверяем, чтобы клик не был по кнопке (чтобы избежать двойного срабатывания)
        if (!$(e.target).hasClass('explore-location') && !$(e.target).closest('.explore-location').length) {
            const locationId = $(this).data('id');
            console.log('Клик по карточке локации:', locationId);
            Locations.goToLocation(locationId);
        }
    });
    
    // Кнопка "Назад к локациям" - добавляем очистку интервала добычи
    $('#back-to-locations').on('click', function() {
        Locations.cleanupMining();
        Game.switchScreen('locations-screen');
    });
    
    // ИСПРАВЛЕННЫЙ обработчик для кнопки начала/остановки добычи
    $(document).on('click', '#start-mining', function() {
        console.log("Кнопка добычи нажата. Текущее состояние isMining:", Locations.isMining);
        
        if (Locations.isMining) {
            Locations.stopMining();
        } else {
            // Сброс на всякий случай
            clearTimeout(Locations.miningInterval);
            clearInterval(Locations.countdownInterval);
            Locations.isMining = false;
            
            // Запуск добычи
            Locations.startMining();
        }
    });
    
    // Обработчик для кнопки инвентаря
    $('#nav-inventory').on('click', function() {
        if (Game.player.loggedIn) {
            // Очищаем интервал добычи при уходе с экрана
            if (Game.currentScreen === 'mining-screen') {
                Locations.cleanupMining();
            }
            
            Game.switchScreen('inventory-screen');
            UI.renderFullInventory();
        } else {
            UI.showNotification('Сначала войдите в игру', 'error');
        }
    });
}
};