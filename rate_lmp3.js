(function() {
    'use strict';
    Lampa.Platform.tv();

    function rating_cub(card) {
        var network = new Lampa.Reguest();
        var params = {
            id: card.id,
            cache_time: 60 * 60 * 24 * 1000 // Кеш на 1 день
        };

        getRating();

        function getRating() {
            var movieRating = _getCache(params.id);
            if (movieRating) {
                return _showRating(movieRating[params.id]);
            } else {
                fetchRating();
            }
        }

        function fetchRating() {
            var apiUrl = 'https://cub.red/api/reactions/get/' + card.id;
            network.clear();
            network.timeout(15000);
            network.silent(apiUrl, function(json) {
                if (json && json.result) {
                    var likes = 0, dislikes = 0;
                    json.result.forEach(function(item) {
                        if (['fire', 'shit'].includes(item.type)) likes += parseInt(item.counter);
                        if (['bore', 'think', 'nice'].includes(item.type)) dislikes += parseInt(item.counter);
                    });

                    var total = likes + dislikes;
                    var rating = total > 0 ? (likes / total * 10).toFixed(1) : 0;

                    var movieRating = _setCache(params.id, {
                        rating: rating,
                        timestamp: new Date().getTime()
                    });
                    _showRating(movieRating);
                } else {
                    showError('Нет данных');
                }
            }, function(a, c) {
                showError(network.errorDecode(a, c));
            });
        }

        function _getCache(movie) {
            var timestamp = new Date().getTime();
            var cache = Lampa.Storage.cache('cub_rating', 500, {}); // Лимит 500 ключей
            if (cache[movie]) {
                if ((timestamp - cache[movie].timestamp) > params.cache_time) {
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
                cache[movie] = data;
                Lampa.Storage.set('cub_rating', cache);
            } else {
                if ((timestamp - cache[movie].timestamp) > params.cache_time) {
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
                var render = Lampa.Activity.active().activity.render();
                $('.wait_rating', render).remove();
                $('.rate--cub', render).removeClass('hide').find('> div').eq(0).text(rating);
            }
        }

        function showError(error) {
            Lampa.Noty.show('Рейтинг CUB: ' + error);
        }
    }

    function startPlugin() {
        window.rating_plugin_cub = true;
        Lampa.Listener.follow('full', function(e) {
            if (e.type == 'complite') {
                var render = e.object.activity.render();
                if ($('.rate--cub', render).hasClass('hide') && !$('.wait_rating', render).length) {
                    $('.info__rate', render).after('<div style="width:2em;margin-top:1em;margin-right:1em" class="wait_rating"><div class="broadcast__scan"><div></div></div><div>');
                    rating_cub(e.data.movie);
                }
            }
        });
    }

    if (!window.rating_plugin_cub) startPlugin();
})();
