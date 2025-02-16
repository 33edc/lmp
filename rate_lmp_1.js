(function() {
    'use strict';
    Lampa.Platform.tv();

    // Включение режима отладки: true - включен, false - выключен
    const DEBUG_MODE = true;

    function log(message) {
        if (DEBUG_MODE) {
            console.log('[Lampa Rating Debug]', message);
        }
    }

    // Модуль рейтингов
    (function() {
        'use strict';

        function initRating() {
            Lampa.Listener.follow('full', function(event) {
                if (event.type === 'render') {
                    const activity = event.object.activity.clone();
                    let ratingElement = $('.rate--lampa', activity);

                    // Создаем элемент если не найден
                    if (ratingElement.length === 0) {
                        ratingElement = $(`
                            <div class="full-start__rate rate--lampa">
                                <div class="rating-value"></div>
                                <div class="source--name">LAMPA</div>
                            </div>
                        `);
                        $('.full-start__head', activity).after(ratingElement);
                        log('Создан новый элемент рейтинга');
                    } else {
                        log('Элемент рейтинга уже существует');
                    }

                    // Запрос к API
                    const itemId = event.object.method + '_' + event.object.id;
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', `http://cub.red/api/reactions/get/${itemId}`, true);
                    xhr.timeout = 2000;

                    xhr.onload = function() {
                        try {
                            const response = JSON.parse(xhr.responseText).result;
                            log('Получен ответ от API: ' + JSON.stringify(response));
                            let likes = 0, dislikes = 0;

                            response.forEach(item => {
                                if (['fire', 'shit'].includes(item.type)) {
                                    likes += parseInt(item.counter);
                                }
                                if (['bore', 'think', 'nice'].includes(item.type)) {
                                    dislikes += parseInt(item.counter);
                                }
                            });

                            const rating = (likes + dislikes) > 0 
                                ? (likes / (likes + dislikes) * 10).toFixed(1)
                                : 0;

                            ratingElement.find('.rating-value').text(`LMP ${rating}`);
                            log('Рейтинг обновлен: LMP ' + rating);
                        } catch(e) {
                            console.error('Ошибка парсинга ответа: ', e);
                        }
                    };

                    xhr.onerror = () => console.error('Ошибка запроса');
                    xhr.ontimeout = () => console.warn('Время ожидания запроса истекло');
                    xhr.send();
                    log('Запрос к API отправлен: ' + `http://cub.red/api/reactions/get/${itemId}`);
                }
            });
        }

        // Инициализация
        if (window.appready) {
            initRating();
            log('Приложение готово, инициализация рейтинга');
        } else {
            Lampa.Listener.follow('app', e => {
                if (e.type === 'ready') {
                    initRating();
                    log('Приложение готово, инициализация рейтинга (через Listener)');
                }
            });
        }

    })();

    // Второй модуль (резервный API)
    (function() {
        'use strict';

        // ... аналогичный код с другим endpoint:
        // http://cub.YOURDOMAIN.COM/api/reactions/get/
        
    })();

})();
