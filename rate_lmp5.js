(function() {
    'use strict';
    Lampa.Platform.tv();

    // Режим отладки: 1 - включен, 0 - выключен
    const DEBUG_MODE = 1;

    function log(message) {
        if (DEBUG_MODE) console.log('[CUB Rating Debug]', message);
    }

    function rating_cub(card) {
        log('Запуск rating_cub для карточки: ' + card.id);

        var network = new Lampa.Reguest();
        var params = {
            id: card.id,
            cache_time: 60 * 60 * 24 * 1000 // Кеш на 1 день
        };

        getRating();

        function getRating() {
            log('Проверка кеша для карточки: ' + params.id);
            var movieRating = _getCache(params.id);
            if (movieRating) {
                log('Данные найдены в кеше: ' + JSON.stringify(movieRating));
                return _showRating(movieRating[params.id]);
            } else {
                log('Данные не найдены в кеше. Запрашиваем с API.');
                fetchRating();
            }
        }

        function fetchRating() {
            var apiUrl = 'https://cub.red/api/reactions/get/tv_' + card.id;
            log('Запрос к API: ' + apiUrl);

            network.clear();
            network.timeout(15000);
            network.silent(apiUrl, function(json) {
                log('Ответ от API: ' + JSON.stringify(json));
                if (json && json.result) {
                    var likes = 0, dislikes = 0;
                    json.result.forEach(function(item) {
                        if (['fire', 'shit'].includes(item.type)) likes += parseInt(item.counter);
                        if (['bore', 'think', 'nice'].includes(item.type)) dislikes += parseInt(item.counter);
                    });

                    var total = likes + dislikes;
                    var rating = total > 0 ? (likes / total * 10).toFixed(1) : 0;
                    log('Рассчитанный рейтинг: ' + rating);

                    var movieRating = _setCache(params.id, {
                        rating: rating,
                        timestamp: new Date().getTime()
                    });
                    _showRating(movieRating);
                } else {
                    log('Ошибка: Нет данных в ответе от API.');
                    showError('Нет данных');
                }
            }, function(a, c) {
                log('Ошибка запроса: ' + network.errorDecode(a, c));
                showError(network.errorDecode(a, c));
            });
        }

        function _getCache(movie) {
            var timestamp = new Date().getTime();
            var cache = Lampa.Storage.cache('cub_rating', 500, {});
            if (cache[movie]) {
                if ((timestamp - cache[movie].timestamp) > params.cache_time) {
                    log('Кеш истёк для карточки: ' + movie);
                    delete cache[movie];
                    Lampa.Storage.set('cub_rating', cache);
                    return false;
                }
            } else return false;
            return cache;
        }

        function _setCache(movie, data) {
            var timestamp = new Date().getTime();
            var cache = Lampa.Storage.cache('cub_rating', 500, {});
            if (!cache[movie]) {
                log('Добавление данных в кеш для карточки: ' + movie);
                cache[movie] = data;
                Lampa.Storage.set('cub_rating', cache);
            } else {
                if ((timestamp - cache[movie].timestamp) > params.cache_time) {
                    log('Обновление данных в кеше для карточки: ' + movie);
                    data.timestamp = timestamp;
                    cache[movie] = data;
                    Lampa.Storage.set('cub_rating', cache);
                } else data = cache[movie];
            }
            return data;
        }

        function _showRating(data) {
            if (data) {
                var rating = !isNaN(data.rating) && data.rating !== null ? parseFloat(data.rating).toFixed(1) : '0.0';
                log('Отображение рейтинга: ' + rating);
                var render = Lampa.Activity.active().activity.render();

                // Ищем элемент .rate--cub
                var rateElement = $('.rate--cub', render);
                if (rateElement.length === 0) {
                    log('Элемент .rate--cub не найден. Создаем новый.');
                    rateElement = $(`
                        <div class="rate--cub">
                            <div>${rating}</div>
                        </div>
                    `);
                    $('.info__rate', render).after(rateElement);
                } else {
                    log('Элемент .rate--cub найден. Обновляем рейтинг.');
                    rateElement.removeClass('hide').find('> div').eq(0).text(rating);
                }

                $('.wait_rating', render).remove();
            } else {
                log('Ошибка: Данные для отображения рейтинга отсутствуют.');
            }
        }

        function showError(error) {
            log('Ошибка: ' + error);
            Lampa.Noty.show('Рейтинг CUB: ' + error);
        }
    }

    function startPlugin() {
        window.rating_plugin_cub = true;
        log('Плагин рейтинга CUB запущен.');
        Lampa.Listener.follow('full', function(e) {
            if (e.type == 'complite') {
                log('Событие "complite" для карточки: ' + e.data.movie.id);
                var render = e.object.activity.render();
                if (!$('.rate--cub', render).length && !$('.wait_rating', render).length) {
                    log('Добавление индикатора загрузки.');
                    $('.info__rate', render).after('<div style="width:2em;margin-top:1em;margin-right:1em" class="wait_rating"><div class="broadcast__scan"><div></div></div><div>');
                    rating_cub(e.data.movie);
                }
            }
        });
    }

    if (!window.rating_plugin_cub) startPlugin();
})();
