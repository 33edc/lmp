(function () {
    'use strict';

    // Режим отладки
    var debug_mode = 1;

    function logDebug(message, data) {
        if (debug_mode) {
            console.log(`[PLUG_SEASON_INFO] ${message}`, data || '');
        }
    }

    // Проверка состояния сезона/серии
    if (Lampa.SettingsApi.get('season_and_seria')) {
        Lampa.Listener.on('season_change', function (event) {
            logDebug('Событие изменения сезона получено:', event);

            if (event.type === 'season_update') {
                logDebug('Тип события подтвержден: season_update');

                var data = Lampa.Activity.active().data;
                logDebug('Данные активного контента получены:', data);

                if (data && data.last_episode_to_air && data.seasons) {
                    logDebug('Проверка наличия данных last_episode_to_air и seasons пройдена');

                    var seasonNumber = data.last_episode_to_air.season_number;
                    var episodeNumber = data.last_episode_to_air.episode_number;
                    var totalEpisodes = data.episode_count;

                    logDebug('Номер сезона:', seasonNumber);
                    logDebug('Номер последней серии:', episodeNumber);
                    logDebug('Общее количество серий:', totalEpisodes);

                    var message = `Сезон: ${seasonNumber}. Серия: ${episodeNumber} из ${totalEpisodes}`;

                    if (!$('.card--new_seria', Lampa.Activity.active().render()).length) {
                        logDebug('Элемент .card--new_seria не найден, создаем новый.');

                        if (window.innerWidth > 600) {
                            logDebug('Ширина окна больше 600px, добавляем элемент к .full-start__poster');
                            $('.full-start__poster').append(`<div class="card--new_seria">${message}</div>`);
                        } else {
                            logDebug('Ширина окна меньше или равна 600px, добавляем элемент к .full-start-new__details');
                            $('.full-start-new__details').append(`<div class="card--new_seria">${message}</div>`);
                        }
                    } else {
                        logDebug('Элемент .card--new_seria уже существует, ничего не делаем.');
                    }
                } else {
                    logDebug('Ошибка: Отсутствуют необходимые данные (last_episode_to_air или seasons).');
                }
            } else {
                logDebug('Тип события не соответствует "season_update".');
            }
        });
    } else {
        logDebug('Настройка "season_and_seria" не включена.');
    }

    // Запуск при загрузке приложения
    if (window.appready) {
        initialize();
    } else {
        Lampa.Manifest.follow('appready', function (event) {
            if (event.type === 'appready') {
                initialize();
            } else {
                logDebug('Ошибка: Событие не является "appready".', event);
            }
        });
    }

    function initialize() {
        logDebug('Инициализация плагина...');
        console.log('[PLUG_SEASON_INFO] Отображение состояния сериала (сезон/серия)');
    }
})();
