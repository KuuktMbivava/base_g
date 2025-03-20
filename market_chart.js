/**
 * Модуль для отображения рыночных цен и их графиков
 * Ресурсная Империя
 */

const Market = {
    // Список текущих цен
    currentPrices: [],
    
    // Выбранный ресурс для отображения истории цен
    selectedResource: null,
    
    // История цен выбранного ресурса
    priceHistory: [],
    
    // Инициализация модуля
    init: function() {
        console.log('Инициализация модуля рыночных цен');
        
        // Инициализируем обработчики событий
        this.initEventHandlers();
        
        // Загружаем текущие цены
        this.loadCurrentPrices();
    },
    
    // Загрузка текущих рыночных цен
    loadCurrentPrices: function() {
        console.log('Загрузка текущих рыночных цен');
        
        // Показываем индикатор загрузки
        $('#market-prices-container').html('<div class="loading">Загрузка рыночных цен...</div>');
        
        $.ajax({
            url: 'market_api.php',
            type: 'POST',
            data: {
                action: 'get_current_prices'
            },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        Market.currentPrices = result.prices;
                        Market.renderPriceTable();
                    } else {
                        // Если не удалось загрузить с сервера, показываем ошибку
                        $('#market-prices-container').html(
                            '<div class="error-message">Не удалось загрузить рыночные цены: ' + 
                            (result.message || 'Неизвестная ошибка') + '</div>'
                        );
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа:', error);
                    $('#market-prices-container').html(
                        '<div class="error-message">Ошибка при обработке данных рыночных цен</div>'
                    );
                }
            },
            error: function(xhr, status, error) {
                console.error('Ошибка при запросе рыночных цен:', status, error);
                $('#market-prices-container').html(
                    '<div class="error-message">Ошибка подключения к серверу рыночных цен</div>'
                );
            }
        });
    },
    
    renderPriceTable: function() {
        console.log('Рендеринг таблицы цен, данные:', this.currentPrices);
        
        const container = $('#market-prices-container');
        container.empty();
        
        if (!this.currentPrices || this.currentPrices.length === 0) {
            container.html('<div class="empty-message">Нет данных о рыночных ценах</div>');
            return;
        }
        
        // Таблица с более компактными заголовками
        const tableHTML = `
            <div class="market-prices-table-wrapper">
                <table class="market-prices-table">
                    <thead>
                        <tr>
                            <th>Ресурс</th>
                            <th>Редкость</th>
                            <th>Базовая цена</th>
                            <th>Текущая цена</th>
                            <th>Изменение</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody id="market-prices-body">
                        ${this.generatePriceRows()}
                    </tbody>
                </table>
            </div>
        `;
        
        container.html(tableHTML);
        
        // Инициализируем обработчики поиска и фильтров
        this.initSearchAndFilters();
    },
    
    generatePriceRows: function() {
        let rowsHTML = '';
        
        this.currentPrices.forEach(price => {
            const priceChangeClass = this.getPriceChangeClass(price.price_change_percent);
            const rarityClass = this.getRarityClass(price.rarity);
            const rarityLabel = this.formatRarity(price.rarity);
            
            // Форматируем процент изменения
            const changeSign = price.price_change_percent >= 0 ? '+' : '';
            const changeText = `${changeSign}${price.price_change_percent}%`;
            
            // Создаем строку таблицы
            rowsHTML += `
                <tr class="price-row ${rarityClass}" data-resource-id="${price.resource_id}">
                    <td class="resource-name-col" title="${price.resource_name}">${price.resource_name}</td>
                    <td class="resource-rarity-col">${rarityLabel}</td>
                    <td class="resource-base-price-col">${price.base_price}</td>
                    <td class="resource-current-price-col">${price.current_price}</td>
                    <td class="resource-change-col ${priceChangeClass}">${changeText}</td>
                    <td class="resource-actions-col">
                        <button class="view-history-button" data-id="${price.resource_id}">
                            График
                        </button>
                    </td>
                </tr>
            `;
        });
        
        return rowsHTML;
    },
    
    renderPriceTable: function() {
        console.log('Рендеринг таблицы цен, данные:', this.currentPrices);
        
        const container = $('#market-prices-container');
        container.empty();
        
        if (!this.currentPrices || this.currentPrices.length === 0) {
            container.html('<div class="empty-message">Нет данных о рыночных ценах</div>');
            return;
        }
        
        // Таблица с более компактными заголовками
        const tableHTML = `
            <div class="market-prices-table-wrapper">
                <table class="market-prices-table">
                    <thead>
                        <tr>
                            <th>Ресурс</th>
                            <th>Редкость</th>
                            <th>Базовая</th>
                            <th>Текущая</th>
                            <th>Измен.</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody id="market-prices-body">
                        ${this.generatePriceRows()}
                    </tbody>
                </table>
            </div>
        `;
        
        container.html(tableHTML);
        
        // Инициализируем обработчики поиска и фильтров
        this.initSearchAndFilters();
    },
    
initSearchAndFilters: function() {
    // Поиск по названию ресурса
    $('#market-search-input').on('input', function() {
        const searchText = $(this).val().toLowerCase();
        
        // Фильтруем строки таблицы
        $('#market-prices-body tr').each(function() {
            const resourceName = $(this).find('.resource-name-col').text().toLowerCase();
            
            if (resourceName.includes(searchText)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
    
    // Фильтрация по редкости
    $('.filter-button').on('click', function() {
        // Убираем активное состояние у всех кнопок
        $('.filter-button').removeClass('active');
        // Добавляем активное состояние к нажатой кнопке
        $(this).addClass('active');
        
        const rarity = $(this).data('rarity');
        
        // Фильтруем строки таблицы
        $('#market-prices-body tr').each(function() {
            if (rarity === 'all') {
                $(this).show();
            } else {
                // Проверяем, содержит ли строка нужный класс редкости
                if ($(this).hasClass(`rarity-${rarity}`)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            }
        });
    });
},
    
    // Загрузка истории цен ресурса
    loadPriceHistory: function(resourceId, days = 30) {
        console.log('Загрузка истории цен для ресурса ID:', resourceId);
        
        // Сохраняем выбранный ресурс
        this.selectedResource = resourceId;
        
        // Показываем контейнер истории цен
        const container = $('#price-history-container');
        container.show();
        container.find('#price-chart-container').html('<div class="loading">Загрузка истории цен...</div>');
        
        $.ajax({
            url: 'market_api.php',
            type: 'POST',
            data: {
                action: 'get_price_history',
                resource_id: resourceId,
                days: days
            },
            success: function(response) {
                try {
                    const result = JSON.parse(response);
                    
                    if (result.success) {
                        // Обновляем заголовок
                        $('#resource-history-title').text(`История цен: ${result.resource.name}`);
                        
                        // Сохраняем данные истории
                        Market.priceHistory = result.history;
                        
                        // Отображаем график
                        Market.renderPriceChart(result.resource, result.history);
                    } else {
                        $('#price-chart-container').html(
                            '<div class="error-message">Не удалось загрузить историю цен: ' + 
                            (result.message || 'Неизвестная ошибка') + '</div>'
                        );
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ответа:', error);
                    $('#price-chart-container').html(
                        '<div class="error-message">Ошибка при обработке данных истории цен</div>'
                    );
                }
            },
            error: function(xhr, status, error) {
                console.error('Ошибка при запросе истории цен:', status, error);
                $('#price-chart-container').html(
                    '<div class="error-message">Ошибка подключения к серверу</div>'
                );
            }
        });
    },
    
    // Рендеринг графика истории цен
    renderPriceChart: function(resource, history) {
        console.log('Рендеринг графика цен для ресурса:', resource.name);
        
        // Очищаем контейнер
        $('#price-chart-container').empty().html('<canvas id="price-chart"></canvas>');
        
        // Если нет данных, показываем сообщение
        if (!history || history.length === 0) {
            $('#price-chart-container').html('<div class="empty-message">Нет данных о истории цен</div>');
            return;
        }
        
        // Подготавливаем данные для графика
        const dates = history.map(item => item.date);
        const prices = history.map(item => parseInt(item.price));
        
        // Находим минимальную и максимальную цену для настройки масштаба графика
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const basePrice = parseInt(resource.base_price);
        
        // Находим цвет для графика в зависимости от изменения цены
        const currentPrice = prices[prices.length - 1];
        const startPrice = prices[0];
        
        let lineColor;
        if (currentPrice > startPrice) {
            lineColor = '#4CAF50'; // Зеленый для растущих цен
        } else if (currentPrice < startPrice) {
            lineColor = '#F44336'; // Красный для падающих цен
        } else {
            lineColor = '#FFA726'; // Оранжевый для стабильных цен
        }
        
        // Создаем график
        const ctx = document.getElementById('price-chart').getContext('2d');
        
        // Уничтожаем предыдущий график, если он существует
        if (window.priceChart) {
            window.priceChart.destroy();
        }
        
        // Создаем новый график
        window.priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Цена',
                    data: prices,
                    borderColor: lineColor,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                }, {
                    label: 'Базовая цена',
                    data: Array(dates.length).fill(basePrice),
                    borderColor: '#9E9E9E',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        suggestedMin: Math.max(0, minPrice * 0.9),
                        suggestedMax: maxPrice * 1.1,
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
                        callbacks: {
                            label: function(context) {
                                return `Цена: ${context.raw} золота`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    // Получение класса CSS для изменения цены
    getPriceChangeClass: function(changePercent) {
        if (changePercent > 0) {
            return 'price-increase';
        } else if (changePercent < 0) {
            return 'price-decrease';
        } else {
            return 'price-unchanged';
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
        // Кнопка обновления цен (для тестирования)
        $('#refresh-market-prices').on('click', function() {
            Market.loadCurrentPrices();
        });
        
        // Для будущих дополнительных обработчиков
    }
};