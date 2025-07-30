// Google Analytics 4 事件追蹤工具

// 聲明 gtag 函數類型
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

// 檢查 GA4 是否已載入
const isGALoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// 基礎事件追蹤函數
const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (!isGALoaded()) {
    console.warn('Google Analytics not loaded');
    return;
  }

  try {
    window.gtag('event', eventName, parameters);
    console.log('📊 GA4 Event:', eventName, parameters);
  } catch (error) {
    console.error('GA4 tracking error:', error);
  }
};

// 頁面瀏覽追蹤
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (!isGALoaded()) return;

  window.gtag('config', 'G-EYDMD5P6ZG', {
    page_path: pagePath,
    page_title: pageTitle || document.title
  });
};

// 遊戲相關事件
export const trackGameStart = (gameType: 'single' | 'multiplayer') => {
  trackEvent('game_start', {
    game_type: gameType,
    event_category: 'game',
    event_label: `${gameType}_player`
  });
};

export const trackGameEnd = (gameType: 'single' | 'multiplayer', score: number, level: number, lines: number, duration: number) => {
  trackEvent('game_end', {
    game_type: gameType,
    score: score,
    level: level,
    lines_cleared: lines,
    game_duration: Math.round(duration / 1000), // 轉換為秒
    event_category: 'game',
    event_label: `${gameType}_player_completed`
  });
};

export const trackGamePause = (gameType: 'single' | 'multiplayer') => {
  trackEvent('game_pause', {
    game_type: gameType,
    event_category: 'game',
    event_label: `${gameType}_player_paused`
  });
};

export const trackGameResume = (gameType: 'single' | 'multiplayer') => {
  trackEvent('game_resume', {
    game_type: gameType,
    event_category: 'game',
    event_label: `${gameType}_player_resumed`
  });
};

// 用戶行為事件
export const trackUserLogin = (method: 'google' | 'email') => {
  trackEvent('login', {
    method: method,
    event_category: 'user',
    event_label: `login_${method}`
  });
};

export const trackUserLogout = () => {
  trackEvent('logout', {
    event_category: 'user',
    event_label: 'user_logout'
  });
};

export const trackUserRegistration = (method: 'google' | 'email') => {
  trackEvent('sign_up', {
    method: method,
    event_category: 'user',
    event_label: `signup_${method}`
  });
};

// 導航事件
export const trackNavigation = (from: string, to: string) => {
  trackEvent('page_navigation', {
    from_page: from,
    to_page: to,
    event_category: 'navigation'
  });
};

// 設定變更事件
export const trackSettingsChange = (setting: string, value: any) => {
  trackEvent('settings_change', {
    setting_name: setting,
    setting_value: String(value),
    event_category: 'settings'
  });
};

// 語言切換事件
export const trackLanguageChange = (fromLang: string, toLang: string) => {
  trackEvent('language_change', {
    from_language: fromLang,
    to_language: toLang,
    event_category: 'localization'
  });
};

// 排行榜查看事件
export const trackLeaderboardView = (gameType: 'single' | 'multiplayer', category: string) => {
  trackEvent('leaderboard_view', {
    game_type: gameType,
    category: category,
    event_category: 'leaderboard'
  });
};

// 統計頁面查看事件
export const trackStatsView = (userId?: string) => {
  trackEvent('stats_view', {
    user_id: userId || 'anonymous',
    event_category: 'stats'
  });
};

// 多人遊戲房間事件
export const trackMultiplayerRoomJoin = (roomId: string) => {
  trackEvent('multiplayer_room_join', {
    room_id: roomId,
    event_category: 'multiplayer'
  });
};

export const trackMultiplayerRoomLeave = (roomId: string) => {
  trackEvent('multiplayer_room_leave', {
    room_id: roomId,
    event_category: 'multiplayer'
  });
};

export const trackMultiplayerGameWin = (roomId: string, opponentCount: number) => {
  trackEvent('multiplayer_win', {
    room_id: roomId,
    opponent_count: opponentCount,
    event_category: 'multiplayer'
  });
};

export const trackMultiplayerGameLose = (roomId: string, opponentCount: number) => {
  trackEvent('multiplayer_lose', {
    room_id: roomId,
    opponent_count: opponentCount,
    event_category: 'multiplayer'
  });
};

// 錯誤追蹤
export const trackError = (errorType: string, errorMessage: string, errorLocation?: string) => {
  trackEvent('exception', {
    description: `${errorType}: ${errorMessage}`,
    fatal: false,
    error_location: errorLocation,
    event_category: 'error'
  });
};

// 性能追蹤
export const trackPerformance = (metricName: string, value: number, unit: string = 'ms') => {
  trackEvent('performance_metric', {
    metric_name: metricName,
    metric_value: value,
    metric_unit: unit,
    event_category: 'performance'
  });
};

// 自定義事件追蹤
export const trackCustomEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  trackEvent(eventName, {
    ...parameters,
    event_category: parameters.event_category || 'custom'
  });
};

// 導出所有追蹤函數
export const analytics = {
  trackPageView,
  trackGameStart,
  trackGameEnd,
  trackGamePause,
  trackGameResume,
  trackUserLogin,
  trackUserLogout,
  trackUserRegistration,
  trackNavigation,
  trackSettingsChange,
  trackLanguageChange,
  trackLeaderboardView,
  trackStatsView,
  trackMultiplayerRoomJoin,
  trackMultiplayerRoomLeave,
  trackMultiplayerGameWin,
  trackMultiplayerGameLose,
  trackError,
  trackPerformance,
  trackCustomEvent
};

export default analytics;