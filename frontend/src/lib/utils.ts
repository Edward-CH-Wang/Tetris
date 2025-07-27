import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化時間
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// 格式化分數
export function formatScore(score: number): string {
  return score.toLocaleString();
}

// 格式化日期
export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 生成隨機 ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// 深拷貝對象
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any };
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj as T;
  }
  
  return obj;
}

// 防抖函數
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 節流函數
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 檢查是否為移動設備
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// 檢查是否支持觸摸
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// 獲取隨機顏色
export function getRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

// 計算兩個日期之間的差異
export function getDateDifference(date1: Date, date2: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
}

// 本地存儲工具
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue || null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// 音頻工具
export const audio = {
  play: (url: string, volume = 1): void => {
    try {
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(error => {
        console.warn('Audio play failed:', error);
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  },
  
  preload: (urls: string[]): Promise<HTMLAudioElement[]> => {
    return Promise.all(
      urls.map(url => {
        return new Promise<HTMLAudioElement>((resolve, reject) => {
          const audio = new Audio(url);
          audio.addEventListener('canplaythrough', () => resolve(audio));
          audio.addEventListener('error', reject);
          audio.load();
        });
      })
    );
  }
};

// 鍵盤事件工具
export const keyboard = {
  getKeyName: (event: KeyboardEvent): string => {
    const key = event.code || event.key;
    
    const keyMap: { [key: string]: string } = {
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'Space': '空格',
      'Enter': '回車',
      'Escape': 'Esc',
      'Backspace': '退格',
      'Tab': 'Tab',
      'Shift': 'Shift',
      'Control': 'Ctrl',
      'Alt': 'Alt'
    };
    
    return keyMap[key] || key;
  },
  
  isMovementKey: (event: KeyboardEvent): boolean => {
    const movementKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];
    return movementKeys.includes(event.code);
  }
};

// 數學工具
export const math = {
  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  },
  
  lerp: (start: number, end: number, factor: number): number => {
    return start + (end - start) * factor;
  },
  
  randomBetween: (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  },
  
  randomInt: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

// 動畫工具
export const animation = {
  easeInOut: (t: number): number => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  
  easeIn: (t: number): number => {
    return t * t;
  },
  
  easeOut: (t: number): number => {
    return t * (2 - t);
  }
};

// 顏色工具
export const color = {
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  
  rgbToHex: (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },
  
  adjustBrightness: (hex: string, factor: number): string => {
    const rgb = color.hexToRgb(hex);
    if (!rgb) return hex;
    
    const adjust = (value: number) => Math.max(0, Math.min(255, Math.round(value * factor)));
    
    return color.rgbToHex(
      adjust(rgb.r),
      adjust(rgb.g),
      adjust(rgb.b)
    );
  }
};