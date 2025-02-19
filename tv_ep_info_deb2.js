(function() {
  'use strict';
  
  const PLUGIN_NAME = 'SeasonInfoExtended';
  const CACHE_TTL = 3600000; // 1 час
  
  let isInitialized = false;
  let currentSeasonId = null;
  
  function initPlugin() {
    if(isInitialized) return;
    
    Lampa.Plugins.add({
      name: PLUGIN_NAME,
      author: 'Your Name',
      version: '1.0.2',
      description: 'Расширенная информация о сезонах и эпизодах'
    });
    
    Lampa.Listener.follow('app_ready', initObservers);
    isInitialized = true;
    
    console.log(`[${PLUGIN_NAME}] Плагин успешно инициализирован`);
  }
  
  function initObservers() {
    const playerContainer = document.querySelector('.player-container');
    
    if(!playerContainer) {
      console.error(`[${PLUGIN_NAME}] Контейнер плеера не найден`);
      return;
    }
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if(mutation.type === 'childList') {
          handleContentUpdate();
        }
      });
    });
    
    observer.observe(playerContainer, {
      childList: true,
      subtree: true
    });
    
    Lampa.Listener.follow('player_state_update', (state) => {
      if(state.mediaType === 'series') {
        currentSeasonId = state.seasonId;
        loadSeasonData(state.seasonId);
      }
    });
  }
  
  async function loadSeasonData(seasonId) {
    try {
      const cacheKey = `season_${seasonId}_data`;
      const cached = Lampa.Storage.get(cacheKey);
      
      if(cached && Date.now() - cached.timestamp < CACHE_TTL) {
        updateUI(cached.data);
        return;
      }
      
      const data = await Lampa.API.get(`/tmdb/season/${seasonId}`, {
        params: {
          append_to_response: 'episodes'
        }
      });
      
      const processedData = processAPIData(data);
      
      Lampa.Storage.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });
      
      updateUI(processedData);
    } catch (error) {
      console.error(`[${PLUGIN_NAME}] Ошибка загрузки данных:`, error);
      Lampa.Noty.show('Не удалось загрузить информацию о сезоне', {
        type: 'error',
        timeout: 5000
      });
    }
  }
  
  function processAPIData(rawData) {
    return {
      seasonNumber: rawData.season_number,
      episodes: rawData.episodes.map(ep => ({
        number: ep.episode_number,
        title: ep.name,
        airDate: ep.air_date,
        duration: ep.runtime,
        description: ep.overview
      }))
    };
  }
  
  function updateUI(seasonInfo) {
    const infoContainer = document.createElement('div');
    infoContainer.className = 'season-info-container';
    
    // Генерация HTML-структуры
    const htmlContent = `
      <div class="season-header">
        <h2>Сезон ${seasonInfo.seasonNumber}</h2>
      </div>
      <div class="episodes-list">
        ${seasonInfo.episodes.map(ep => `
          <div class="episode-card">
            <div class="episode-number">Эпизод ${ep.number}</div>
            <div class="episode-title">${ep.title}</div>
            ${ep.airDate ? `<div class="air-date">Дата выхода: ${ep.airDate}</div>` : ''}
            ${ep.duration ? `<div class="duration">Продолжительность: ${ep.duration} мин</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
    
    infoContainer.innerHTML = htmlContent;
    
    // Вставка в DOM
    const existingContainer = document.querySelector('.season-info-container');
    if(existingContainer) {
      existingContainer.replaceWith(infoContainer);
    } else {
      const parentContainer = document.querySelector('.player-info-section');
      if(parentContainer) {
        parentContainer.appendChild(infoContainer);
      }
    }
  }
  
  // Инициализация плагина при загрузке
  if(typeof Lampa !== 'undefined') {
    initPlugin();
  } else {
    Lampa.Listener.follow('app', (event) => {
      if(event.type === 'ready') {
        initPlugin();
