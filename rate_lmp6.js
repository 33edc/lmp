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

        // Формируем type_id (например, movie_123 или tv_456)
        var type_id = card.method + '_' + card.id;
        log('Сформированный type_id: ' + type_id);

        var network = new Lampa.Reguest();
        var params = {
            id: card.id,
            cache_time: 60 * 60 * 24 * 1000 // Кеш на 1 день
        };

        // Создаем элемент, если его нет
        var render = Lampa.Activity.active().activity.render();
        var ratingElement = $('.rate--cub', render);
        if (ratingElement.length === 0) {
            log('Элемент .rate--cub не найден. Создаем новый.');
            ratingElement = $(`
                <div class="full-start__rate rate--cub">
                    <div class="rating-value"></div>
                    <div class="source--name">LMP</div>
                </div>
            `);
            $('.full-start__head', render).after(ratingElement);
        }

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
            var apiUrl = 'https://cub.red/api/reactions/get/' + type_id; // Используем type_id
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
                var rateElement = $('.rate--cub', render);
                if (rateElement.length) {
                    rateElement.find('.rating-value').text(rating);
                }
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
                rating_cub(e.data.movie);
            }
        });
    }

    if (!window.rating_plugin_cub) startPlugin();
})();
