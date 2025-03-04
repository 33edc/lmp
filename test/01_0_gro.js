window.onload = function() {
    // Удаление префикса [LAMPA] из имен источников
    document.querySelectorAll('.source-name').forEach(function(element) {
        var text = element.innerHTML;
        if (text.startsWith('[LAMPA] ')) {
            element.innerHTML = text.substr(8);
        }
    });
    
    // Установка рейтинга на 8.8 для карточек фильмов
    document.querySelectorAll('.movie-card .rating').forEach(function(element) {
        element.innerHTML = '8.8';
    });
};
