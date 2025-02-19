(function () {
    'use strict';

    // Проверка состояния сезона/серии
    if (Lampa.SettingsApi.get('season_and_seria')) {
        Lampa.Listener.on('season_change', function (event) {
            if (event.type === 'season_update') {
                var data = Lampa.Activity.active().data;

                if (data.last_episode_to_air && data.seasons) {
                    var seasonNumber = data.last_episode_to_air.season_number;
                    var episodeNumber = data.last_episode_to_air.episode_number;

                    var message = 'Сезон: ' + seasonNumber + '. Серия: ' + episodeNumber;

                    if (!$('.card--new_seria', Lampa.Activity.active().render()).length) {
                        if (window.innerWidth > 600) {
                            $('.full-start__poster').append('<div class="card--new_seria">' + message + '</div>');
                        } else {
                            $('.full-start-new__details').append('<div class="card--new_seria">' + message + '</div>');
                        }
                    }
                }
            }
        });
    }

    // Запуск при загрузке приложения
    if (window.appready) {
        initialize();
    } else {
        Lampa.Manifest.follow('appready', function (event) {
            if (event.type === 'appready') {
                initialize();
            }
        });
    }

    function initialize() {
        console.log('Отображение состояния сериала (сезон/серия)');
    }
})();
