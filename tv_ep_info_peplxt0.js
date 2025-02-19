(function() {
    'use strict';

    // Инициализация платформы TV
    Lampa.Platform.tv();

    // Основная логика плагина
    function initializePlugin() {
        // Проверка версии Lampa
        if (Lampa.Manifest.get().version !== 'bylampa') {
            Lampa.Noty.show('Ошибка доступа');
            return;
        }

        // Добавление настройки в интерфейс
        Lampa.SettingsApi.addParam({
            component: 'interface',
            param: {
                name: 'season_and_seria',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Отображение состояния сериала (сезон/серия)'
            },
            onRender: function(element) {
                setTimeout(function() {
                    $('div[data-name="season_and_seria"]').insertAfter('.full-start__tags');
                }, 0);
            }
        });

        // Активация функционала если включено в настройках
        if (Lampa.Storage.get('season_and_seria') !== false) {
            Lampa.Listener.on('full', function(data) {
                if (Lampa.Activity.active().activity == 'full') {
                    if (data.type === 'show') {
                        const content = data.params.content;
                        
                        // Проверка что это сериал TMDB с необходимыми данными
                        if (content.origin === 'tmdb' && 
                            content.type === 'show' && 
                            content.last_episode_to_air && 
                            content.last_episode_to_air.season_number) {
                            
                            // Получение данных о сезонах
                            const currentSeason = content.last_episode_to_air.season_number;
                            const totalEpisodes = content.last_episode_to_air.episode_number;
                            const nextEpisode = content.next_episode_to_air;
                            
                            // Расчет текущей серии
                            const currentEpisode = nextEpisode && new Date(nextEpisode.air_date) <= Date.now() 
                                ? nextEpisode.episode_number 
                                : content.last_episode_to_air.episode_number;

                            // Поиск общего количества серий в сезоне
                            const seasonData = content.seasons.find(season => 
                                season.season_number === currentSeason
                            );
                            const totalSeasonEpisodes = seasonData.episode_count;

                            // Формирование текста
                            let statusText;
                            if (content.next_episode_to_air) {
                                const episodeInfo = `Серия ${currentEpisode}`;
                                statusText = `Сезон: ${currentSeason}. ${episodeInfo} из ${totalSeasonEpisodes}`;
                            } else {
                                statusText = `${currentSeason} сезон завершен`;
                            }

                            // Вставка в интерфейс
                            const posterElement = $('.full-start__poster,.full-start-new__poster', 
                                Lampa.Activity.active().activity.render());
                            
                            if (!posterElement.find('.card--new_seria').length) {
                                if (window.innerWidth > 585) {
                                    $('.full-start__details', 
                                        Lampa.Activity.active().activity.render())
                                        .append(`
                                            <div class="card--new_seria" 
                                                style="right: -0.6em!important;position: absolute;
                                                       background: #df1616;color: #fff;bottom:.6em!important;
                                                       padding: 0.4em 0.4em;font-size: 1.2em;border-radius: 0.3em;">
                                                ${Lampa.Lang.translate(statusText)}
                                            </div>
                                        `);
                                } else {
                                    $('.full-start-new__split', 
                                        Lampa.Activity.active().activity.render())
                                        .after(`
                                            <div class="full-start__tag card--new_seria">
                                                <img src="./img/icons/menu/movie.svg" />
                                                <div>${Lampa.Lang.translate(statusText)}</div>
                                            </div>
                                        `);
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Запуск после полной загрузки приложения
    if (window.appready) {
        initializePlugin();
    } else {
        Lampa.App.ready('core', function(app) {
            if (app.status === 'complite') {
                initializePlugin();
            }
        });
    }
})();
