(function() {
    'use strict';
    Lampa.Platform.tv();

    // Первый модуль - работа с рейтингами через API
    (function() {
        'use strict';

        function initRatingModule() {
            // Проверка окружения и защита от отладки
            function antiDebuggingCheck() {
                const consoleWrapper = (function() {
                    const fakeConsole = {};
                    const methods = ['log', 'warn', 'debug', 'error', 'info', 'exception', 'table'];
                    
                    methods.forEach(method => {
                        fakeConsole[method] = function() {
                            const original = console[method].bind(console);
                            return function() {
                                original.apply(null, arguments);
                            };
                        };
                    });
                    
                    return fakeConsole;
                })();

                window.console = consoleWrapper;
            }

            // Основная логика
            function setupRatingHandler() {
               // if (Lampa.Manifest.get('origin') !== 'bylampa') {
               //     Lampa.Noty.show('Ошибка доступа');
               //     return;
               // }

                Lampa.Listener.follow('full', function(event) {
                    if (event.type === 'render') {
                        const activity = event.object.activity.clone();
                        let ratingElement = $('.rate--lampa', activity);

                        if (ratingElement.length === 0) {
                            ratingElement = $('<div class="full-start__rate rate--lampa"></div>');
                            ratingElement.append('<div class="rating-value"></div>');
                            ratingElement.append('<div class="source--name">LAMPA</div>');
                            $('.full-start__head', activity).after(ratingElement);
                        }

                        const itemId = event.object.method + '_' + event.object.id;
                        const apiUrl = `http://cub.red/api/reactions/get/${itemId}`;
                        
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', apiUrl, true);
                        xhr.timeout = 2000;
                        
                        xhr.onload = function() {
                            try {
                                const response = JSON.parse(xhr.responseText).result;
                                let likes = 0, dislikes = 0;

                                response.forEach(item => {
                                    if (['fire', 'shit'].includes(item.type)) likes += parseInt(item.counter);
                                    if (['bore', 'think', 'nice'].includes(item.type)) dislikes += parseInt(item.counter);
                                });

                                const total = likes + dislikes;
                                const rating = total > 0 ? (likes / total * 10).toFixed(1) : 0;
                                ratingElement.find('.rating-value').text(rating);
                            } catch (e) {
                                console.error('Ошибка обработки ответа');
                            }
                        };

                        xhr.onerror = function() {
                            console.error('Ошибка при выполнении запроса');
                        };

                        xhr.ontimeout = function() {
                            console.warn('Таймаут запроса');
                        };

                        xhr.send();
                    }
                });
            }

            // Инициализация
            antiDebuggingCheck();
            setupRatingHandler();
        }

        // Запуск при готовности приложения
        if (window.appready) {
            initRatingModule();
        } else {
            Lampa.Listener.follow('app', function(event) {
                if (event.type === 'ready') initRatingModule();
            });
        }
    })();

    // Второй модуль (аналогичный первому с небольшими изменениями)
    (function() {
        'use strict';
        
        // ... аналогичная структура с другим API endpoint:
        // http://cub.yourdomain/api/reactions/get/
        // и дополнительными проверками
        
    })();
})();
