(function () {
    'use strict';

    // Добавление настроек в интерфейс
    Lampa.SettingsApi.addParam({
        component: "interface",
        param: {
            name: "debugon",
            type: "toggle",
            default: false
        },
        field: {
            name: "Режим отладки",
            description: "Включить ведение логов"
        }
    });
    Lampa.SettingsApi.addParam({
        component: "interface",
        param: {
            name: "demomode",
            type: "toggle",
            default: false
        },
        field: {
            name: "Демо-режим",
            description: "Отображать статичные рейтинги"
        }
    });
    Lampa.SettingsApi.addParam({
        component: "interface",
        param: {
            name: "show_kp_rating",
            type: "toggle",
            default: true
        },
        field: {
            name: "Отобразить рейтинг КиноПоиск",
            description: "Показывать рейтинг КиноПоиск на карточках"
        }
    });
    Lampa.SettingsApi.addParam({
        component: "interface",
        param: {
            name: "show_imdb_rating",
            type: "toggle",
            default: true
        },
        field: {
            name: "Отобразить рейтинг IMDb",
            description: "Показывать рейтинг IMDb на карточках"
        }
    });

    // Вспомогательные функции
    function getSetting(name, defaultValue) {
        return Lampa.Storage.get(name, defaultValue);
    }

    function debugLog(message) {
        if (debugon) {
            console.log("[KP-IMDB Plugin] " + message);
        }
    }

    function showError(error) {
        debugLog("Ошибка: " + error);
        Lampa.Noty.show('Ошибка рейтинга: ' + error);
    }

    function getCache(movieId) {
        var timestamp = new Date().getTime();
        var cache = Lampa.Storage.cache('kp_rating', 500, {});
        if (cache[movieId]) {
            if ((timestamp - cache[movieId].timestamp) > 86400000) { // Кэш на 1 день
                delete cache[movieId];
                Lampa.Storage.set('kp_rating', cache);
                return false;
            }
        } else return false;
        return cache[movieId];
    }

    function setCache(movieId, data) {
        var timestamp = new Date().getTime();
        var cache = Lampa.Storage.cache('kp_rating', 500, {});
        if (!cache[movieId]) {
            cache[movieId] = data;
            Lampa.Storage.set('kp_rating', cache);
        } else {
            if ((timestamp - cache[movieId].timestamp) > 86400000) {
                data.timestamp = timestamp;
                cache[movieId] = data;
                Lampa.Storage.set('kp_rating', cache);
            } else data = cache[movieId];
        }
        return data;
    }

    function cleanTitle(str) {
        return str.replace(/[\s.,:;’'`!?]+/g, ' ').trim();
    }

    function kpCleanTitle(str) {
        return cleanTitle(str).replace(/^[ \/\\]+/, '').replace(/[ \/\\]+$/, '').replace(/\+( *[+\/\\])+/g, '+').replace(/([+\/\\] *)+\+/g, '+').replace(/( *[\/\\]+ *)+/g, '+');
    }

    function normalizeTitle(str) {
        return cleanTitle(str.toLowerCase().replace(/[\-\u2010-\u2015\u2E3A\u2E3B\uFE58\uFE63\uFF0D]+/g, '-').replace(/ё/g, 'е'));
    }

    function equalTitle(t1, t2) {
        return typeof t1 === 'string' && typeof t2 === 'string' && normalizeTitle(t1) === normalizeTitle(t2);
    }

    function containsTitle(str, title) {
        return typeof str === 'string' && typeof title === 'string' && normalizeTitle(str).indexOf(normalizeTitle(title)) !== -1;
    }

    // Функции для получения данных
    function getMovieDetails(tmdbId, callback) {
        var network = new Lampa.Reguest();
        var url = '/api/tmdb_movie_details';
        var data = { id: tmdbId };
        network.silent(url, function (json) {
            if (json.id) {
                callback && callback(Lampa.TMDB.parseMovie({ data: json }));
            } else {
                callback && callback(false);
            }
        }, function (a, c) {
            showError(network.errorDecode(a, c));
            callback && callback(false);
        }, JSON.stringify(data));
    }

    function searchKinopoisk(title, year, callback) {
        var network = new Lampa.Reguest();
        var url = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURI(kpCleanTitle(title));
        network.silent(url, function (json) {
            if (json.items && json.items.length) {
                var items = json.items;
                callback && callback(items);
            } else {
                callback && callback(false);
            }
        }, function (a, c) {
            showError(network.errorDecode(a, c));
            callback && callback(false);
        }, false, {
            headers: { 'X-API-KEY': '2a4a0808-81a3-40ae-b0d3-e11335ede616' }
        });
    }

    function getKinopoiskRatings(kpId, callback) {
        var network = new Lampa.Reguest();
        var url = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/' + kpId;
        network.silent(url, function (data) {
            callback && callback({ kp: data.ratingKinopoisk, imdb: data.ratingImdb });
        }, function (a, c) {
            showError(network.errorDecode(a, c));
            callback && callback(false);
        }, false, {
            headers: { 'X-API-KEY': '2a4a0808-81a3-40ae-b0d3-e11335ede616' }
        });
    }

    function getImdbRating(imdbId, callback) {
        var network = new Lampa.Reguest();
        var url = 'http://www.omdbapi.com/?i=' + imdbId + '&apikey=f1bb1049'; // Замените на ваш API ключ
        network.silent(url, function (data) {
            if (data && data.imdbRating) {
                callback && callback(data.imdbRating);
            } else {
                callback && callback(false);
            }
        }, function (a, c) {
            showError(network.errorDecode(a, c));
            callback && callback(false);
        });
    }

    function chooseFilm(items, title, originalTitle, searchYear) {
        if (!items || !items.length) return false;
        var chosen = items[0]; // Простой выбор первого элемента для примера
        return chosen;
    }

    // Основная функция замены рейтингов
    function replaceRatings() {
        var urlParams = new URLSearchParams(window.location.search);
        var debugon = urlParams.get('debugon') === '1' || getSetting('debugon', false);
        var demomode = urlParams.get('demomode') === '1' || getSetting('demomode', false);
        var show_kp_rating = getSetting('show_kp_rating', true);
        var show_imdb_rating = getSetting('show_imdb_rating', true);

        debugLog("Начало обработки рейтингов, демо-режим: " + demomode + ", отладка: " + debugon);

        if (demomode) {
            var movieCards = document.querySelectorAll('.movie-card');
            for (var card of movieCards) {
                var ratingElement = card.querySelector('.rating');
                if (ratingElement) {
                    var text = "";
                    if (show_imdb_rating) text += "IMDb: 77";
                    if (show_kp_rating) {
                        if (text) text += ", ";
                        text += "Kinopoisk: 88";
                    }
                    ratingElement.innerHTML = text;
                    debugLog("Демо-режим: установлены статичные рейтинги для карточки");
                }
            }
            return;
        }

        var movieCards = document.querySelectorAll('.movie-card');
        for (var card of movieCards) {
            var tmdbId = card.getAttribute('data-id');
            var ratingElement = card.querySelector('.rating');
            if (!ratingElement) {
                debugLog("Не найден элемент рейтинга для TMDB ID: " + tmdbId);
                continue;
            }

            debugLog("Обработка карточки с TMDB ID: " + tmdbId);

            var cachedData = getCache(tmdbId);
            if (cachedData) {
                var kpRating = cachedData.kp;
                var imdbRating = cachedData.imdb;
                var text = "";
                if (show_imdb_rating && imdbRating) text += "IMDb: " + imdbRating;
                if (show_kp_rating && kpRating) {
                    if (text) text += ", ";
                    text += "Kinopoisk: " + kpRating;
                }
                ratingElement.innerHTML = text;
                debugLog("Использован кэш для рейтингов: IMDb " + imdbRating + ", Kinopoisk " + kpRating);
                continue;
            }

            getMovieDetails(tmdbId, function (movie) {
                if (!movie) {
                    debugLog("Не удалось получить детали фильма для TMDB ID: " + tmdbId);
                    setCache(tmdbId, { kp: 0, imdb: 0 });
                    ratingElement.innerHTML = "Нет рейтингов";
                    return;
                }

                var title = movie.title;
                var originalTitle = movie.original_title;
                var releaseDate = movie.release_date || '0000';
                var searchYear = parseInt(releaseDate.substr(0, 4));
                var imdbId = movie.imdb_id;

                debugLog("Получены детали фильма: заголовок " + title + ", год " + searchYear + ", IMDb ID " + imdbId);

                searchKinopoisk(title, searchYear, function (items) {
                    if (!items) {
                        debugLog("Не удалось найти фильм на КиноПоиск для TMDB ID: " + tmdbId);
                        setCache(tmdbId, { kp: 0, imdb: 0 });
                        ratingElement.innerHTML = "Нет рейтингов";
                        return;
                    }

                    var chosenItem = chooseFilm(items, title, originalTitle, searchYear);
                    if (!chosenItem) {
                        debugLog("Не удалось выбрать подходящий фильм из результатов поиска для TMDB ID: " + tmdbId);
                        setCache(tmdbId, { kp: 0, imdb: 0 });
                        ratingElement.innerHTML = "Не найден подходящий фильм";
                        return;
                    }

                    var kpId = chosenItem.kp_id || chosenItem.kinopoisk_id;

                    getKinopoiskRatings(kpId, function (ratings) {
                        if (!ratings) {
                            debugLog("Не удалось получить рейтинги с КиноПоиск для KP ID: " + kpId);
                            setCache(tmdbId, { kp: 0, imdb: 0 });
                            ratingElement.innerHTML = "Нет рейтингов";
                            return;
                        }

                        var kpRating = ratings.kp;
                        var imdbRatingFromKp = ratings.imdb;

                        getImdbRating(imdbId, function (imdbRating) {
                            if (!imdbRating) {
                                debugLog("Не удалось получить рейтинг IMDb для ID: " + imdbId + ", используется рейтинг из КиноПоиск: " + imdbRatingFromKp);
                                imdbRating = imdbRatingFromKp;
                            }

                            var data = { kp: kpRating, imdb: imdbRating, timestamp: new Date().getTime() };
                            setCache(tmdbId, data);

                            var text = "";
                            if (show_imdb_rating && imdbRating) text += "IMDb: " + imdbRating;
                            if (show_kp_rating && kpRating) {
                                if (text) text += ", ";
                                text += "Kinopoisk: " + kpRating;
                            }
                            ratingElement.innerHTML = text;
                            debugLog("Установлены рейтинги: IMDb " + imdbRating + ", Kinopoisk " + kpRating);
                        });
                    });
                });
            });
        }
    }

    // Инициализация плагина
    window.rating_replace_plugin = true;
    window.onload = function () {
        if (!window.rating_replace_plugin) {
            var urlParams = new URLSearchParams(window.location.search);
            debugon = urlParams.get('debugon') === '1' || getSetting('debugon', false);
            demomode = urlParams.get('demomode') === '1' || getSetting('demomode', false);
            debugLog("Плагин инициализирован, демо-режим: " + demomode + ", отладка: " + debugon);
            replaceRatings();
        }
    };
})();
