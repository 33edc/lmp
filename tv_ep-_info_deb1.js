(function() {
    'use strict';

    // Включаем режим отладки
    const debug_mode = 1;

    // Функция для вывода отладочных сообщений
    function debugLog(message) {
        if (debug_mode === 1) {
            console.log('[Season_info][DEBUG]', message);
        }
    }

    // Функция для вывода ошибок
    function debugError(error) {
        if (debug_mode === 1) {
            console.error('[Season_info][ERROR]', error);
        }
    }

    // Инициализация платформы Lampa для TV
    try {
        Lampa.Platform.tv();
        debugLog('Платформа Lampa успешно инициализирована.');
    } catch (error) {
        debugError('Ошибка при инициализации платформы Lampa: ' + error.message);
    }

    // Основная функция для отображения информации о сериале
    function displaySeasonAndEpisode() {
        debugLog('Запуск функции displaySeasonAndEpisode.');

        // Проверяем, включена ли настройка отображения информации о сезонах и сериях
        try {
            const isSeasonAndSeriaEnabled = Lampa.SettingsApi.get('season_and_seria');
            debugLog('Настройка season_and_seria: ' + isSeasonAndSeriaEnabled);

            if (isSeasonAndSeriaEnabled !== false) {
                // Слушаем события активности
                Lampa.Listener.on('activity', function(event) {
                    debugLog('Событие активности: ' + event.type);

                    // Проверяем, что активность связана с просмотром сериала
                    try {
                        const activity = Lampa.Activity.active().activity;
                        debugLog('Тип активности: ' + activity.type);

                        if (activity.type === 'activity') {
                            // Если событие - отображение информации о сериале
                            if (event.type === 'show') {
                                debugLog('Событие show обрабатывается.');

                                // Получаем данные о сериале
                                const showData = activity.show;
                                debugLog('Данные о сериале получены: ' + JSON.stringify(showData));

                                // Проверяем, что это TV-шоу и есть информация о последнем эпизоде
                                if (showData.type === 'tv' && showData.last_episode_to_air && showData.last_episode_to_air.season_number) {
                                    debugLog('Тип сериала: TV. Есть информация о последнем эпизоде.');

                                    // Получаем номер сезона и эпизода
                                    const seasonNumber = showData.last_episode_to_air.season_number;
                                    const episodeNumber = showData.last_episode_to_air.episode_number;
                                    debugLog('Сезон: ' + seasonNumber + ', Эпизод: ' + episodeNumber);

                                    // Получаем информацию о следующем эпизоде, если он есть
                                    const nextEpisode = showData.next_episode_to_air;
                                    const lastEpisode = nextEpisode && new Date(nextEpisode.air_date) <= Date.now() ? nextEpisode.episode_number : showData.last_episode_to_air.episode_number;
                                    debugLog('Последний эпизод: ' + lastEpisode);

                                    // Находим общее количество эпизодов в текущем сезоне
                                    const totalEpisodes = showData.seasons.find(season => season.season_number === seasonNumber).episode_count;
                                    debugLog('Всего эпизодов в сезоне: ' + totalEpisodes);

                                    // Формируем текст для отображения
                                    let displayText;
                                    if (showData.next_episode_to_air) {
                                        displayText = 'Сезон: ' + seasonNumber + '. Серия ' + lastEpisode + ' из ' + totalEpisodes;
                                    } else {
                                        displayText = 'Сезон ' + seasonNumber + ' завершен';
                                    }
                                    debugLog('Текст для отображения: ' + displayText);

                                    // Отображаем информацию в зависимости от ширины экрана
                                    if (window.innerWidth > 585) {
                                        debugLog('Ширина экрана больше 585px. Отображение в большом формате.');
                                        $('.full-start__poster, .full-start-new__poster').append(
                                            '<div class="card--new_seria">' + Lampa.Lang.translate(displayText) + '</div>'
                                        );
                                    } else {
                                        debugLog('Ширина экрана меньше или равна 585px. Отображение в компактном формате.');
                                        $('.full-start-new__details').append(
                                            '<div class="full-start__tag card--new_seria">' +
                                            '<img src="./img/icons/menu/movie.svg" />' +
                                            '<div>' + Lampa.Lang.translate(displayText) + '</div>' +
                                            '</div>'
                                        );
                                    }
                                } else {
                                    debugLog('Данные о сериале не соответствуют ожидаемым (не TV или нет информации о последнем эпизоде).');
                                }
                            }
                        } else {
                            debugLog('Активность не связана с просмотром сериала.');
                        }
                    } catch (error) {
                        debugError('Ошибка при обработке события активности: ' + error.message);
                    }
                });
            } else {
                debugLog('Настройка season_and_seria отключена.');
            }
        } catch (error) {
            debugError('Ошибка при проверке настроек: ' + error.message);
        }
    }

    // Запуск функции после готовности приложения
    try {
        if (window.appready) {
            debugLog('Приложение уже готово. Запуск displaySeasonAndEpisode.');
            displaySeasonAndEpisode();
        } else {
            debugLog('Ожидание готовности приложения...');
            Lampa.Storage.follow('app', function(event) {
                if (event.type === 'ready') {
                    debugLog('Приложение готово. Запуск displaySeasonAndEpisode.');
                    displaySeasonAndEpisode();
                }
            });
        }
    } catch (error) {
        debugError('Ошибка при запуске функции displaySeasonAndEpisode: ' + error.message);
    }
})();
