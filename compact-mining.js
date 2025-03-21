/**
 * Функция для более компактного отображения страницы добычи ресурсов
 * Заменяет длинные описания и делает интерфейс компактнее
 */

// Добавить эту функцию в модуль Locations или вызвать как отдельный скрипт
function optimizeMiningPage() {
    // Изменение рендеринга ресурсов локации на более компактный
    Locations.renderLocationResources = function(location) {
        const container = $('#available-resources');
        container.empty();
        
        if (!location.resources || location.resources.length === 0) {
            container.html('<p>Ресурсов не найдено</p>');
            return;
        }
        
        // Создаем виджет автоматической добычи более компактный
        const miningWidget = $(`
            <div class="auto-mining-widget" id="auto-mining-widget">
                <div class="auto-mining-title">
                    <i class="mining-icon"></i> Автоматическая добыча
                </div>
                <div class="mining-controls">
                    <button id="start-mining" class="game-button">
                        <span class="mining-status">Начать</span>
                    </button>
                </div>
            </div>
        `);
        
        container.append(miningWidget);
        
        // Создаем компактный выпадающий список ресурсов
        const resourcesDropdown = $(`
            <div class="resources-dropdown">
                <div class="dropdown-header">
                    <span class="dropdown-title">Доступные ресурсы</span>
                    <button class="dropdown-toggle"><span class="toggle-icon">▼</span></button>
                </div>
                <div class="dropdown-content" style="display: none;">
                    <!-- Компактная таблица ресурсов будет здесь -->
                </div>
            </div>
        `);
        
        container.append(resourcesDropdown);
        
        // Создаем компактную таблицу ресурсов
        const tableContainer = $('<div class="resources-table-container"></div>');
        const table = $(`
            <table class="resources-table compact">
                <thead>
                    <tr>
                        <th>Ресурс</th>
                        <th>Редкость</th>
                        <th>Кол-во</th>
                        <th>Шанс</th>
                    </tr>
                </thead>
                <tbody id="resources-table-body">
                </tbody>
            </table>
        `);
        
        tableContainer.append(table);
        $('.dropdown-content', resourcesDropdown).append(tableContainer);
        
        const tableBody = $('#resources-table-body');
        
        // Сортируем ресурсы по редкости (сначала редкие)
        const sortedResources = [...location.resources].sort((a, b) => {
            const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
            return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        });
        
        // Добавляем строки ресурсов
        sortedResources.forEach(resource => {
            const rarityClass = this.getRarityClass(resource.rarity);
            const probability = ((resource.probability || 0.5) / location.difficulty * 100).toFixed(0);
            const probabilityClass = probability >= 50 ? "high-probability" : 
                                    probability >= 20 ? "medium-probability" : "low-probability";
            
            const row = $(`
                <tr class="resource-row ${rarityClass}">
                    <td class="resource-name-col" title="${resource.name}">
                        <span class="resource-name">${resource.name}</span>
                    </td>
                    <td class="resource-rarity-col">${this.formatRarityShort(resource.rarity)}</td>
                    <td class="resource-yield-col">${resource.min_amount || 1}-${resource.max_amount || 1}</td>
                    <td class="resource-probability-col">
                        <span class="probability-value ${probabilityClass}">${probability}%</span>
                    </td>
                </tr>
            `);
            
            tableBody.append(row);
        });
        
        // Обработчик для выпадающего списка
        $('.dropdown-toggle, .dropdown-title', resourcesDropdown).on('click', function() {
            const content = $('.dropdown-content', resourcesDropdown);
            const icon = $('.toggle-icon', resourcesDropdown);
            
            if (content.is(':visible')) {
                content.slideUp(200);
                icon.text('▼');
            } else {
                content.slideDown(200);
                icon.text('▲');
            }
        });
    };
    
    // Изменяем формат журнала добычи - делаем его более компактным
    Resources.addMiningLog = function(resourceName, amount, success, totalTime, errorMessage) {
        const logContainer = $('#mining-log');
        
        if (logContainer.length === 0) {
            console.error('Контейнер журнала добычи не найден!');
            return;
        }
        
        // Создаем элемент лога более компактным
        const logItem = $('<div>').addClass('mining-result');
        
        // Форматируем текущее время компактно
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                        now.getMinutes().toString().padStart(2, '0');
        
        // Стилизуем сообщение кратко
        if (success) {
            logItem.addClass('mining-success');
            logItem.html(`
                <span class="log-time">[${timeStr}]</span>
                <span class="log-amount">+${amount}</span>
                <span class="resource-name-in-log">${resourceName}</span>
            `);
        } else {
            logItem.addClass('mining-failure');
            
            // Если это системное сообщение, показываем только суть
            if (resourceName === 'Система') {
                // Упрощаем сообщение о завершении добычи
                if (errorMessage.includes('Добыча ресурсов остановлена')) {
                    logItem.html(`
                        <span class="log-time">[${timeStr}]</span>
                        <span class="log-system">Добыча остановлена</span>
                    `);
                } else {
                    logItem.html(`
                        <span class="log-time">[${timeStr}]</span>
                        <span class="log-system">${errorMessage}</span>
                    `);
                }
            } else {
                logItem.html(`
                    <span class="log-time">[${timeStr}]</span>
                    <span class="log-action">Неудача:</span>
                    <span class="resource-name-in-log">${resourceName}</span>
                `);
            }
        }
        
        // Добавляем элемент в начало лога с анимацией
        logItem.hide();
        logContainer.prepend(logItem);
        logItem.fadeIn(200);
        
        // Ограничиваем количество записей в логе
        if (logContainer.children().length > 15) {
            logContainer.children().last().remove();
        }
    };
    
    // Изменяем заголовок раздела журнала добычи
    $('#mining-results-section h3').text('Журнал');
    
    // Сокращаем описание локации, если оно слишком длинное
    const locationDescription = $('#location-description').text();
    if (locationDescription.length > 100) {
        $('#location-description').text(locationDescription.substring(0, 97) + '...');
    }
    
    // CSS-стили для более компактного отображения
    $('<style>').text(`
        /* Более компактный виджет добычи */
        .auto-mining-widget {
            padding: 10px;
            margin: 10px 0;
        }
        
        .auto-mining-title {
            font-size: 1rem;
            margin-bottom: 10px;
        }
        
        /* Компактный заголовок локации */
        #location-header {
            margin-bottom: 10px;
        }
        
        #location-name {
            font-size: 1.2rem;
        }
        
        #location-description {
            font-size: 0.85rem;
            margin-bottom: 10px;
            font-style: italic;
            opacity: 0.8;
        }
        
        /* Компактный журнал добычи */
        #mining-results-section {
            height: auto;
            min-height: 150px;
            max-height: 250px;
        }
        
        #mining-results-section h3 {
            font-size: 1rem;
            margin-bottom: 10px;
        }
        
        #mining-log {
            font-size: 0.8rem;
        }
        
        .mining-result {
            padding: 4px;
            margin-bottom: 4px;
        }
        
        /* Компактная таблица ресурсов */
        .resources-table th {
            padding: 5px;
            font-size: 0.8rem;
        }
        
        .resources-table td {
            padding: 4px 5px;
            font-size: 0.75rem;
        }
        
        .resource-name {
            font-size: 0.75rem;
        }
        
        .probability-value {
            padding: 1px 4px;
            font-size: 0.7rem;
        }
        
        /* Более компактный индикатор добычи */
        .mining-status-indicator {
            padding: 8px;
            margin-top: 10px;
            font-size: 0.8rem;
        }
    `).appendTo('head');
}

// Вызов функции оптимизации при загрузке страницы добычи
$(document).ready(function() {
    // Добавляем обработчик для вызова оптимизации при переходе на экран добычи
    const originalGoToLocation = Locations.goToLocation;
    Locations.goToLocation = function(locationId) {
        originalGoToLocation.call(this, locationId);
        
        // Вызываем оптимизацию после перехода
        setTimeout(optimizeMiningPage, 100);
    };
    
    // Если мы уже на экране добычи, применяем оптимизацию сразу
    if ($('#mining-screen').hasClass('active')) {
        optimizeMiningPage();
    }
});