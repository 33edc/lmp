(function() {
    'use strict';

    // Инициализация платформы Lampa для TV
    Lampa.Platform.tv();

    // Основная функция для отображения информации о сериале
    function displaySeasonAndEpisode() {
        // Проверяем, включена ли настройка отображения информации о сезонах и сериях
        if (Lampa.SettingsApi.get('season_and_seria') !== false) {
            // Слушаем события активности
            Lampa.Listener.on('activity', function(event) {
                // Проверяем, что активность связана с просмотром сериала
                if (Lampa.Activity.active().activity.type === 'activity') {
                    // Если событие - отображение информации о сериале
                    if (event.type === 'show') {
                        // Получаем данные о сериале
                        var showData = Lampa.Activity.active().activity.show;

                        // Проверяем, что это TV-шоу и есть информация о последнем эпизоде
                        if (showData.type === 'tv' && showData.last_episode_to_air && showData.last_episode_to_air.season_number) {
                            // Получаем номер сезона и эпизода
                            var seasonNumber = showData.last_episode_to_air.season_number;
                            var episodeNumber = showData.last_episode_to_air.episode_number;

                            // Получаем информацию о следующем эпизоде, если он есть
                            var nextEpisode = showData.next_episode_to_air;
                            var lastEpisode = nextEpisode && new Date(nextEpisode.air_date) <= Date.now() ? nextEpisode.episode_number : showData.last_episode_to_air.episode_number;

                            // Находим общее количество эпизодов в текущем сезоне
                            var totalEpisodes = showData.seasons.find(season => season.season_number === seasonNumber).episode_count;

                            // Формируем текст для отображения
                            var displayText;
                            if (showData.next_episode_to_air) {
                                displayText = 'Сезон: ' + seasonNumber + '. Серия ' + lastEpisode + ' из ' + totalEpisodes;
                            } else {
                                displayText = 'Сезон ' + seasonNumber + ' завершен';
                            }

                            // Отображаем информацию в зависимости от ширины экрана
                            if (window.innerWidth > 585) {
                                $('.full-start__poster, .full-start-new__poster').append(
                                    '<div class="card--new_seria">' + Lampa.Lang.translate(displayText) + '</div>'
                                );
                            } else {
                                $('.full-start-new__details').append(
                                    '<div class="full-start__tag card--new_seria">' +
                                    '<img src="./img/icons/menu/movie.svg" />' +
                                    '<div>' + Lampa.Lang.translate(displayText) + '</div>' +
                                    '</div>'
                                );
                            }
                        }
                    }
                }
            });
        }
    }

    // Запуск функции после готовности приложения
    if (window.appready) {
        displaySeasonAndEpisode();
    } else {
        Lampa.Storage.follow('app', function(event) {
            if (event.type === 'ready') {
                displaySeasonAndEpisode();
            }
        });
    }
})();
