(function() {
    'use strict';

    // Режимы работы
    const debug_mode = 1; // 1 - включить логирование
    const show_demo = 1;  // 1 - демо-режим с тестовыми данными

    // Инициализация платформы
    Lampa.Platform.tv();
    debug_mode && console.log('[DEBUG] Инициализация TV платформы');

    function initializePlugin() {
        try {
            debug_mode && console.log('[DEBUG] Проверка версии Lampa');
            if (Lampa.Manifest.get().version !== 'bylampa') {
                Lampa.Noty.show('Ошибка доступа');
                return;
            }

            debug_mode && console.log('[DEBUG] Добавление параметра в настройки');
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
                        debug_mode && console.log('[DEBUG] Рендер настроек');
                        $('div[data-name="season_and_seria"]').insertAfter('.full-start__tags');
                    }, 0);
                }
            });

            if (Lampa.Storage.get('season_and_seria') !== false) {
                debug_mode && console.log('[DEBUG] Активация слушателя событий');
                Lampa.Listener.on('full', function(data) {
                    try {
                        debug_mode && console.log('[DEBUG] Обработка события full', data);

                        if (Lampa.Activity.active().activity == 'full') {
                            if (data.type === 'show') {
                                let content = data.params.content;
                                
                                // Демо-режим
                                let demoData = {};
                                if (show_demo) {
                                    debug_mode && console.log('[DEBUG] Активирован демо-режим');
                                    demoData = {
                                        currentSeason: 4,
                                        currentEpisode: 2,
                                        totalSeasonEpisodes: 77,
                                        hasNextEpisode: true
                                    };
                                }

                                // Основная логика
                                if (show_demo || (content.origin === 'tmdb' && content.type === 'show')) {
                                    let statusText;
                                    
                                    if (show_demo || (content.next_episode_to_air && !show_demo)) {
                                        statusText = `Сезон: ${show_demo ? demoData.currentSeason : content.last_episode_to_air.season_number}. ` +
                                                     `Серия ${show_demo ? demoData.currentEpisode : content.last_episode_to_air.episode_number} ` +
                                                     `из ${show_demo ? demoData.totalSeasonEpisodes : content.seasons.find(s => s.season_number === content.last_episode_to_air.season_number).episode_count}`;
                                    } else {
                                        statusText = `${show_demo ? demoData.currentSeason : content.last_episode_to_air.season_number} сезон завершен`;
                                    }

                                    debug_mode && console.log('[DEBUG] Формирование баннера:', statusText);

                                    const posterElement = $('.full-start__poster,.full-start-new__poster', 
                                        Lampa.Activity.active().activity.render());
                                    
                                    if (!posterElement.find('.card--new_seria').length) {
                                        if (window.innerWidth > 585) {
                                            debug_mode && console.log('[DEBUG] Десктопный вариант отображения');
                                            $('.full-start__details', 
                                                Lampa.Activity.active().activity.render())
                                                .append(`
                                                    <div class="card--new_seria" 
                                                        style="right: -0.6em!important;
                                                        position: absolute;
                                                        background: #df1616;
                                                        color: #fff;
                                                        bottom:.6em!important;
                                                        padding: 0.4em 0.4em;
                                                        font-size: 1.2em;
                                                        border-radius: 0.3em;">
                                                        ${Lampa.Lang.translate(statusText)}
                                                    </div>
                                                `);
                                        } else {
                                            debug_mode && console.log('[DEBUG] Мобильный вариант отображения');
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
                    } catch (e) {
                        console.error('[ERROR] Ошибка в обработчике событий:', e);
                        debug_mode && console.log('[DEBUG] Stack trace:', e.stack);
                    }
                });
            }
        } catch (e) {
            console.error('[ERROR] Инициализация плагина:', e);
            debug_mode && console.log('[DEBUG] Stack trace:', e.stack);
        }
    }

    // Запуск плагина
    if (window.appready) {
        debug_mode && console.log('[DEBUG] Немедленный запуск');
        initializePlugin();
    } else {
        debug_mode && console.log('[DEBUG] Ожидание готовности приложения');
        Lampa.App.ready('core', function(app) {
            if (app.status === 'complite') {
                debug_mode && console.log('[DEBUG] Приложение готово');
                initializePlugin();
            }
        });
    }
})();
