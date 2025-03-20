#!/bin/bash
# Скрипт для запуска обновления рыночных цен через cron

# Путь к каталогу с игрой
GAME_DIR="localhost/textGame2/"

# Переходим в нужный каталог
cd "$GAME_DIR"

# Запускаем PHP-скрипт обновления цен
php market_prices.php >> logs/price_updates.log 2>&1

# Делаем скрипт исполняемым
chmod +x update_prices.sh

# 0 0 * * * Частота обновления цен

0 0 * * * localhost/textGame2/update_prices.sh

# Выходим с кодом успешного завершения
exit 0