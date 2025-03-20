/**
 * Модуль для улучшенного отображения рыночных цен
 * Ресурсная Империя
 */

const MarketUI = {
    // Текущие рыночные цены
    prices: [],
    
    // Выбранный ресурс для отображения истории цен
    selectedResource: null,
    
    // Период истории цен (в днях)
    historyPeriod: 7,
    
    // Инициализация модуля
    init: function() {
        console.log('Инициализация улучшенного интерфейса рынка');
        
        // Заменяем содержимое экрана рынка
        this.initializeInterface();
        
        // Загружаем демо-данные рыночных цен
        this.loadDemoPrices();
        
        // Инициализируем обработчики событий
        this.initEventHandlers();
    },
    
    // Инициализация интерфейса рынка
    initializeInterface: function() {
        const marketScreen = $('#market-screen');
        
        // Проверяем существование экрана
        if (marketScreen.length === 0) {
            console.error('Экран рынка не найден в DOM');
            return;
        }
        
        // Очищаем содержимое экрана
        marketScreen.empty();
        
        // Создаем новый интерфейс
        const marketHTML = `
            <div class="market-container">
                <h2>Рыночные цены</h2>
                <p class="market-description">
                    Цены на рынке обновляются каждый день на основе спроса и добычи. Следите за изменениями!
                </p>
                
                <!-- Поиск и фильтры -->
                <div class="market-controls">
                    <div class="search-container">
                        <input type="text" id="market-search" placeholder="Поиск ресурсов..." class="market-search">
                    </div>
                    <div class="filter-buttons">
                        <button class="filter-button active" data-filter="all">Все</button>
                        <button class="filter-button" data-filter="common">Обычные</button>
                        <button class="filter-button" data-filter="uncommon">Необычные</button>
                        <button class="filter-button" data-filter="rare">Редкие</button>
                    </div>
                </div>
                
                <!-- Компактная таблица цен -->
                <div class="market-prices-table-wrapper">
                    <table class="market-prices-table compact">
                        <thead>
                            <tr>
                                <th class="sortable" data-sort="name">Ресурс</th>
                                <th class="sortable" data-sort="base">Базовая</th>
                                <th class="sortable" data-sort="current">Текущая</th>
                                <th class="sortable" data-sort="change">Изм., %</th>
                            </tr>
                        </thead>
                        <tbody id="market-prices-body">
                            <tr>
                                <td colspan="6" class="loading-message">Загрузка рыночных цен...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            
            <!-- Модальное окно для графика истории цен -->
            <div id="price-history-modal" class="price-history-modal">
                <div class="price-history-content">
                    <div class="price-history-header">
                        <h3 id="price-history-title">История цен: <span id="resource-name"></span></h3>
                        <div class="period-buttons">
                            <button class="period-button active" data-days="7">Неделя</button>
                            <button class="period-button" data-days="30">Месяц</button>
                            <button class="period-button" data-days="90">3 месяца</button>
                        </div>
                        <button class="close-chart-button">&times;</button>
                    </div>
                    <div class="price-chart-container">
                        <canvas id="price-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        marketScreen.html(marketHTML);
    },
    
// Обновленный метод загрузки рыночных цен с сервера
loadDemoPrices: function() {
    console.log('Загрузка рыночных цен с сервера');
    
    // Очищаем таблицу и показываем индикатор загрузки
    const tableBody = $('#market-prices-body');
    tableBody.html('<tr><td colspan="6" class="loading-message">Загрузка рыночных цен...</td></tr>');
    
    // Отправляем запрос на сервер
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
                    // Преобразуем данные с сервера в формат, используемый интерфейсом
                    this.prices = result.prices.map(item => ({
                        id: parseInt(item.resource_id),
                        name: item.resource_name,
                        rarity: item.rarity,
                        base_price: parseInt(item.base_price),
                        current_price: parseInt(item.current_price),
                        change: parseFloat(item.price_change_percent)
                    }));
                    
                    console.log('Получены рыночные цены:', this.prices);
                    
                    // Обновляем интерфейс
                    this.renderPriceTable();
                    this.updateRecommendations();
                } else {
                    console.error('Ошибка при получении рыночных цен:', result.message);
                    tableBody.html('<tr><td colspan="6" class="empty-message">Ошибка при получении рыночных цен: ' + 
                        (result.message || 'Неизвестная ошибка') + '</td></tr>');
                }
            } catch (error) {
                console.error('Ошибка при обработке ответа:', error);
                tableBody.html('<tr><td colspan="6" class="empty-message">Ошибка при обработке данных рыночных цен</td></tr>');
                // Используем демо-данные как запасной вариант
                this.loadFallbackPrices();
            }
        },
        error: (xhr, status, error) => {
            console.error('Ошибка при запросе рыночных цен:', status, error);
            tableBody.html('<tr><td colspan="6" class="empty-message">Ошибка подключения к серверу рыночных цен</td></tr>');
            // Используем демо-данные как запасной вариант
            this.loadFallbackPrices();
        }
    });
},


    
// Обновленный метод отрисовки таблицы цен - добавляем подсказку и стиль курсора
renderPriceTable: function() {
    const tableBody = $('#market-prices-body');
    tableBody.empty();
    
    if (!this.prices || this.prices.length === 0) {
        tableBody.html('<tr><td colspan="6" class="empty-message">Нет данных о рыночных ценах</td></tr>');
        return;
    }
    
    // Отфильтрованные и отсортированные цены
    const filteredPrices = this.getFilteredPrices();
    
    // Отрисовка строк таблицы
    filteredPrices.forEach(price => {
        const rarityClass = this.getRarityClass(price.rarity);
        const changeClass = this.getPriceChangeClass(price.change);
        const changePrefix = price.change > 0 ? '+' : '';
        
        const row = `
            <tr class="price-row ${rarityClass}" data-id="${price.id}" title="Нажмите для просмотра графика">
                <td class="resource-name-col" title="${price.name}">${price.name}</td>
                <td class="resource-base-price-col">${price.base_price}</td>
                <td class="resource-current-price-col">${price.current_price}</td>
                <td class="resource-change-col ${changeClass}">${changePrefix}${price.change.toFixed(1)}%</td>
            </tr>
        `;
        
        tableBody.append(row);
    });
},
    
    // Получение отфильтрованных цен
    getFilteredPrices: function() {
        let filteredPrices = [...this.prices];
        
        // Поиск по названию
        const searchTerm = $('#market-search').val().toLowerCase();
        if (searchTerm) {
            filteredPrices = filteredPrices.filter(price => 
                price.name.toLowerCase().includes(searchTerm)
            );
        }
        
        // Фильтр по редкости
        const activeFilter = $('.filter-button.active').data('filter');
        if (activeFilter && activeFilter !== 'all') {
            filteredPrices = filteredPrices.filter(price => 
                price.rarity === activeFilter
            );
        }
        
        // Сортировка
        const sortBy = this.currentSortField || 'name';
        const sortDir = this.currentSortDirection || 'asc';
        
        filteredPrices.sort((a, b) => {
            let fieldA, fieldB;
            
            // Определяем, какие поля сравнивать
            switch (sortBy) {
                case 'name':
                    fieldA = a.name.toLowerCase();
                    fieldB = b.name.toLowerCase();
                    break;
                case 'rarity':
                    // Порядок редкости: common, uncommon, rare
                    const rarityOrder = { common: 1, uncommon: 2, rare: 3 };
                    fieldA = rarityOrder[a.rarity] || 0;
                    fieldB = rarityOrder[b.rarity] || 0;
                    break;
                case 'base':
                    fieldA = a.base_price;
                    fieldB = b.base_price;
                    break;
                case 'current':
                    fieldA = a.current_price;
                    fieldB = b.current_price;
                    break;
                case 'change':
                    fieldA = a.change;
                    fieldB = b.change;
                    break;
                default:
                    fieldA = a.name.toLowerCase();
                    fieldB = b.name.toLowerCase();
            }
            
            // Выполняем сортировку
            if (fieldA < fieldB) {
                return sortDir === 'asc' ? -1 : 1;
            }
            if (fieldA > fieldB) {
                return sortDir === 'asc' ? 1 : -1;
            }
            return 0;
        });
        
        return filteredPrices;
    },
    
    // Обновление рекомендаций по покупке/продаже
    updateRecommendations: function() {
        // Рекомендации по покупке (наибольшие падения цены)
        const buyRecommendations = this.prices
            .filter(price => price.change < -5)
            .sort((a, b) => a.change - b.change)
            .slice(0, 3);
            
        // Рекомендации по продаже (наибольшие повышения цены)
        const sellRecommendations = this.prices
            .filter(price => price.change > 10)
            .sort((a, b) => b.change - a.change)
            .slice(0, 3);
            
        // Обновляем разделы с рекомендациями
        this.renderRecommendationsList($('#buy-recommendations'), buyRecommendations, 'buy');
        this.renderRecommendationsList($('#sell-recommendations'), sellRecommendations, 'sell');
    },
    
    // Отрисовка списка рекомендаций
    renderRecommendationsList: function($container, recommendations, type) {
        $container.empty();
        
        if (recommendations.length === 0) {
            $container.html('<li class="no-recommendations">Нет рекомендаций</li>');
            return;
        }
        
        recommendations.forEach(price => {
            const changeClass = type === 'buy' ? 'price-decrease' : 'price-increase';
            const changePrefix = price.change > 0 ? '+' : '';
            
            const item = `
                <li class="recommendation-item">
                    <span class="recommendation-name">${price.name}</span>
                    <span class="recommendation-change ${changeClass}">${changePrefix}${price.change.toFixed(1)}%</span>
                </li>
            `;
            
            $container.append(item);
        });
    },

    // Показать модальное окно
showModal: function() {
    const modal = $('#price-history-modal');
    modal.css('display', 'flex');
    
    // Добавляем класс для анимации
    setTimeout(() => {
        modal.addClass('active');
    }, 10); // Небольшая задержка для работы CSS transitions
},

// Скрыть модальное окно
hideModal: function() {
    const modal = $('#price-history-modal');
    
    // Удаляем класс для анимации
    modal.removeClass('active');
    
    // Скрываем после завершения анимации
    setTimeout(() => {
        modal.css('display', 'none');
    }, 300); // Время должно соответствовать transition в CSS
},
// Обновленный метод для показа истории цен
showPriceHistory: function(resourceId) {
    const resource = this.prices.find(p => p.id === resourceId);
    if (!resource) return;
    
    this.selectedResource = resource;
    
    // Обновляем заголовок
    $('#resource-name').text(resource.name);
    
    // Показываем модальное окно с индикатором загрузки
    this.showModal();
    $('.price-chart-container').html('<div class="loading-message">Загрузка истории цен...</div>');
    
    // Отправляем запрос на сервер
    $.ajax({
        url: 'market_api.php',
        type: 'POST',
        data: {
            action: 'get_price_history',
            resource_id: resourceId,
            days: this.historyPeriod
        },
        success: (response) => {
            try {
                const result = JSON.parse(response);
                
                if (result.success && result.history) {
                    // Преобразуем данные с сервера для графика
                    const historyData = this.prepareHistoryData(result.history, result.resource);
                    this.renderPriceChart(historyData);
                } else {
                    console.error('Ошибка при получении истории цен:', result.message);
                    $('.price-chart-container').html('<div class="empty-message">Ошибка при получении истории цен: ' + 
                        (result.message || 'Неизвестная ошибка') + '</div>');
                    
                    // Используем сгенерированные данные как запасной вариант
                    const fallbackData = this.generatePriceHistory(resource, this.historyPeriod);
                    this.renderPriceChart(fallbackData);
                }
            } catch (error) {
                console.error('Ошибка при обработке ответа истории цен:', error);
                $('.price-chart-container').html('<div class="empty-message">Ошибка при обработке данных истории цен</div>');
                
                // Используем сгенерированные данные как запасной вариант
                const fallbackData = this.generatePriceHistory(resource, this.historyPeriod);
                this.renderPriceChart(fallbackData);
            }
        },
        error: (xhr, status, error) => {
            console.error('Ошибка при запросе истории цен:', status, error);
            $('.price-chart-container').html('<div class="empty-message">Ошибка подключения к серверу</div>');
            
            // Используем сгенерированные данные как запасной вариант
            const fallbackData = this.generatePriceHistory(resource, this.historyPeriod);
            this.renderPriceChart(fallbackData);
        }
    });
},
    
    // Генерация демо-данных для истории цен
    generatePriceHistory: function(resource, days) {
        const historyData = {
            labels: [],
            prices: []
        };
        
        const currentPrice = resource.current_price;
        const basePrice = resource.base_price;
        
        // Генерируем данные для каждого дня
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
            
            // Расчет цены с трендом и случайными колебаниями
            const progress = (days - i) / days;
            const randomFactor = 0.1; // 10% случайных колебаний
            const randomVariation = (Math.random() * 2 - 1) * randomFactor * basePrice;
            
            const price = Math.round(basePrice + (currentPrice - basePrice) * progress + randomVariation);
            
            historyData.labels.push(dateStr);
            historyData.prices.push(price);
        }
        
        // Добавляем базовую цену в виде константной линии
        historyData.basePrice = basePrice;
        
        return historyData;
    },
    
    // Отрисовка графика истории цен с использованием Chart.js
    renderPriceChart: function(historyData) {
        const ctx = document.getElementById('price-chart').getContext('2d');
        
        // Уничтожаем предыдущий график, если он существует
        if (window.priceChart) {
            window.priceChart.destroy();
        }
        
        const resource = this.selectedResource;
        
        // Создаем новый график
        window.priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: historyData.labels,
                datasets: [
                    {
                        label: 'Рыночная цена',
                        data: historyData.prices,
                        borderColor: '#8B4513',
                        backgroundColor: 'rgba(139, 69, 19, 0.1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: '#8B4513',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Базовая цена',
                        data: Array(historyData.labels.length).fill(historyData.basePrice),
                        borderColor: '#888',
                        borderDash: [5, 5],
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Цена (золото)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Дата'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        });
    },
    
    // Форматирование редкости в короткий формат
    formatRarityShort: function(rarity) {
        switch (rarity) {
            case 'common': return 'Обыч.';
            case 'uncommon': return 'Необыч.';
            case 'rare': return 'Редк.';
            case 'epic': return 'Эпич.';
            case 'legendary': return 'Леген.';
            default: return rarity;
        }
    },
    
    // Получение класса CSS для изменения цены
    getPriceChangeClass: function(change) {
        if (change > 0) return 'price-increase';
        if (change < 0) return 'price-decrease';
        return 'price-unchanged';
    },
    
    // Получение класса CSS для редкости
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
    
 // Обновленная функция для инициализации обработчиков событий
initEventHandlers: function() {
    // Поиск по ресурсам
    $('#market-search').on('input', () => {
        this.renderPriceTable();
    });
    
    // Фильтрация по редкости
    $('.filter-button').on('click', function() {
        $('.filter-button').removeClass('active');
        $(this).addClass('active');
        MarketUI.renderPriceTable();
    });
    
    // Сортировка таблицы
    $('.sortable').on('click', function() {
        const sortField = $(this).data('sort');
        
        // Меняем направление сортировки, если кликнули на тот же столбец
        if (MarketUI.currentSortField === sortField) {
            MarketUI.currentSortDirection = MarketUI.currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            MarketUI.currentSortField = sortField;
            MarketUI.currentSortDirection = 'asc';
        }
        
        // Убираем классы сортировки со всех заголовков
        $('.sortable').removeClass('sort-asc sort-desc');
        
        // Добавляем класс сортировки к текущему заголовку
        $(this).addClass(MarketUI.currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        
        MarketUI.renderPriceTable();
    });
    
    // Открытие модального окна при клике на строку таблицы
    $(document).on('click', '.price-row', function(e) {
        // Проверяем, что клик не был на кнопке просмотра истории (у нее свой обработчик)
        if (!$(e.target).hasClass('view-history-button') && !$(e.target).closest('.view-history-button').length) {
            const resourceId = parseInt($(this).data('id'));
            MarketUI.showPriceHistory(resourceId);
        }
    });
    
    // Сохраняем оригинальный обработчик для кнопки истории
    $(document).on('click', '.view-history-button', function(e) {
        e.stopPropagation(); // Останавливаем всплытие события
        const resourceId = parseInt($(this).data('id'));
        MarketUI.showPriceHistory(resourceId);
    });
    
    // Изменение периода истории цен
    $('.period-button').on('click', function() {
        $('.period-button').removeClass('active');
        $(this).addClass('active');
        
        const days = parseInt($(this).data('days'));
        MarketUI.historyPeriod = days;
        
        if (MarketUI.selectedResource) {
            MarketUI.showPriceHistory(MarketUI.selectedResource.id);
        }
    });
    
// Закрытие модального окна
$('.close-chart-button').on('click', function() {
    MarketUI.hideModal();
});

// Закрытие модального окна при клике вне содержимого
$('#price-history-modal').on('click', function(e) {
    if ($(e.target).is('#price-history-modal')) {
        MarketUI.hideModal();
    }
});
},

    
    // Загрузка демо-данных как запасной вариант
loadFallbackPrices: function() {
    console.log('Загрузка демо-данных рыночных цен (запасной вариант)');
    
    // Демо-данные для использования в случае ошибки сервера
    this.prices = [
        { id: 1, name: "Дуб", rarity: "common", base_price: 10, current_price: 12, change: 20.0 },
        { id: 2, name: "Эльф. трава", rarity: "uncommon", base_price: 25, current_price: 30, change: 20.0 },
        { id: 3, name: "Маг. кристалл", rarity: "rare", base_price: 75, current_price: 85, change: 13.3 },
        { id: 4, name: "Железн. руда", rarity: "common", base_price: 15, current_price: 14, change: -6.7 },
        { id: 5, name: "Серебро", rarity: "uncommon", base_price: 30, current_price: 28, change: -6.7 },
        { id: 6, name: "Золото", rarity: "rare", base_price: 100, current_price: 110, change: 10.0 },
        { id: 7, name: "Песок", rarity: "common", base_price: 5, current_price: 6, change: 20.0 },
        { id: 8, name: "Пуст. кварц", rarity: "uncommon", base_price: 35, current_price: 38, change: 8.6 },
        { id: 9, name: "Артефакт", rarity: "rare", base_price: 120, current_price: 125, change: 4.2 },
        { id: 10, name: "Морская соль", rarity: "common", base_price: 8, current_price: 7, change: -12.5 }
    ];
    
    this.renderPriceTable();
    this.updateRecommendations();
    
    // Показываем уведомление пользователю
    UI.showNotification('Используются демо-данные рыночных цен', 'info');
},


    // Метод для подготовки данных истории цен с сервера
    prepareHistoryData: function(historyData, resourceInfo) {
    const formattedData = {
        labels: [],
        prices: [],
        basePrice: parseInt(resourceInfo.base_price)
    };
    
    // Группируем данные по дате (может быть несколько записей за день)
    const groupedByDate = {};
    
    historyData.forEach(item => {
        const date = item.date.split('T')[0];
        if (!groupedByDate[date]) {
            groupedByDate[date] = [];
        }
        groupedByDate[date].push(parseInt(item.price));
    });
    
    // Берем последнюю цену за каждый день
    Object.keys(groupedByDate).forEach(date => {
        const prices = groupedByDate[date];
        const formattedDate = new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
        
        formattedData.labels.push(formattedDate);
        formattedData.prices.push(prices[prices.length - 1]);
    });
    
    return formattedData;
}
};