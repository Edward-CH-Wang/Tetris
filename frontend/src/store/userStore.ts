import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signInWithGoogle, signOutUser, onAuthStateChanged, signInWithEmail, registerWithEmailAndPassword } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  firestoreUserService, 
  firestoreDataSyncService, 
  checkFirestoreConnection,
  FirestoreUser 
} from '../lib/firestore';
import { trackUserLogin, trackUserLogout, trackUserRegistration, trackGameEnd } from '../lib/analytics';
import { toMsSafe, fixTimestamps } from '../utils/timestamps';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isGuest: boolean;
  createdAt: Date;
}

export interface GameRecord {
  id: string;
  userId: string;
  gameType: 'single' | 'multiplayer';
  score: number;
  level: number;
  lines: number;
  duration: number; // 遊戲時長（秒）
  result: 'win' | 'lose' | 'completed'; // 多人對戰結果或單人完成
  opponentId?: string; // 對手ID（多人模式）
  createdAt: Date;
  playedAt: Date; // 遊戲進行時間
}

export interface UserStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  highestScore: number;
  averageScore: number;
  totalPlayTime: number; // 總遊戲時間（秒）
  winRate: number;
  currentStreak: number; // 當前連勝
  bestStreak: number; // 最佳連勝
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export interface UserState {
  // 當前用戶
  currentUser: User | null;
  // 是否已登入
  isAuthenticated: boolean;
  // 遊戲記錄
  gameRecords: GameRecord[];
  // 用戶統計
  userStats: UserStats;
  // 成就系統
  achievements: Achievement[];
  // 好友列表
  friends: User[];
  // 載入狀態
  isLoading: boolean;
  // 錯誤狀態
  error: string | null;
  // Firestore 相關狀態
  isFirestoreConnected: boolean;
  isCloudSyncEnabled: boolean;
  lastSyncTime: Date | null;
  
  // 認證相關方法
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  
  // 用戶資料管理方法
  updateProfile: (data: { name?: string; avatar?: string; email?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  // 錯誤處理方法
  clearError: () => void;
  
  // 遊戲記錄方法
  addGameRecord: (record: Omit<GameRecord, 'id' | 'userId' | 'createdAt' | 'playedAt'>) => void;
  getGameRecords: (limit?: number) => GameRecord[];
  
  // 統計數據方法
  updateUserStats: () => void;
  getUserStats: () => UserStats;
  
  // 成就系統方法
  checkAchievements: () => void;
  unlockAchievement: (achievementId: string) => void;
  
  // 好友系統方法
  addFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => void;
  getFriends: () => User[];
  
  // Firestore 雲端同步方法
  initializeFirestore: () => Promise<boolean>;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  enableCloudSync: () => void;
  disableCloudSync: () => void;
}

export interface UserActions {
  // 認證相關
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  setUser: (user: User) => void;
  
  // 用戶資料管理
  updateProfile: (data: { name?: string; avatar?: string; email?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  // 錯誤處理
  clearError: () => void;
  
  // 遊戲記錄
  addGameRecord: (record: Omit<GameRecord, 'id' | 'userId' | 'createdAt' | 'playedAt'>) => void;
  getGameRecords: (limit?: number) => GameRecord[];
  
  // 統計數據
  updateUserStats: () => void;
  getUserStats: () => UserStats;
  
  // 成就系統
  checkAchievements: () => void;
  unlockAchievement: (achievementId: string) => void;
  
  // 好友系統
  addFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => void;
  getFriends: () => User[];
  
  // Firestore 雲端同步
  initializeFirestore: () => Promise<boolean>;
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  enableCloudSync: () => void;
  disableCloudSync: () => void;
}

type UserStore = UserState & UserActions;

// 預設成就列表
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_game',
    name: '初次體驗',
    description: '完成第一場遊戲',
    icon: '🎮',
    condition: 'complete_first_game'
  },
  {
    id: 'score_1000',
    name: '千分達成',
    description: '單場遊戲達到1000分',
    icon: '🏆',
    condition: 'score_1000'
  },
  {
    id: 'score_5000',
    name: '五千分大師',
    description: '單場遊戲達到5000分',
    icon: '🥇',
    condition: 'score_5000'
  },
  {
    id: 'win_streak_5',
    name: '連勝高手',
    description: '連續獲勝5場',
    icon: '🔥',
    condition: 'win_streak_5'
  },
  {
    id: 'total_games_10',
    name: '遊戲愛好者',
    description: '總共遊玩10場遊戲',
    icon: '🎯',
    condition: 'total_games_10',
    maxProgress: 10
  },
  {
    id: 'total_games_50',
    name: '遊戲專家',
    description: '總共遊玩50場遊戲',
    icon: '⭐',
    condition: 'total_games_50',
    maxProgress: 50
  },
  {
    id: 'level_10',
    name: '等級大師',
    description: '單場遊戲達到等級10',
    icon: '📈',
    condition: 'level_10'
  },
  {
    id: 'multiplayer_win',
    name: '對戰勝利',
    description: '贏得第一場多人對戰',
    icon: '⚔️',
    condition: 'multiplayer_win'
  }
];

// 生成訪客用戶
const generateGuestUser = (): User => {
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    id: guestId,
    email: '',
    name: `訪客_${guestId.slice(-6)}`,
    isGuest: true,
    createdAt: new Date()
  };
};

// 初始統計數據
const getInitialStats = (): UserStats => ({
  totalGames: 0,
  totalWins: 0,
  totalLosses: 0,
  highestScore: 0,
  averageScore: 0,
  totalPlayTime: 0,
  winRate: 0,
  currentStreak: 0,
  bestStreak: 0
});

export const useUserStore = create<UserState>()(persist(
  (set, get) => ({
    // 初始狀態
    currentUser: null,
    isAuthenticated: false,
    gameRecords: [],
    userStats: getInitialStats(),
    achievements: DEFAULT_ACHIEVEMENTS.map(achievement => ({ ...achievement })),
    friends: [],
    isLoading: false,
    error: null,
    // Firestore 相關狀態
    isFirestoreConnected: false,
    isCloudSyncEnabled: false,
    lastSyncTime: null,

    // Email/Password 登入
    loginWithEmail: async (email: string, password: string) => {
      set({ isLoading: true });
      
      try {
        const firebaseUser = await signInWithEmail(email, password);
        
        // 將 Firebase 用戶轉換為應用用戶格式
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '用戶',
          avatar: firebaseUser.photoURL || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20gamer%20avatar%20cartoon%20style&image_size=square',
          isGuest: false,
          createdAt: new Date()
        };
        
        set({
          currentUser: user,
          isAuthenticated: true,
          isLoading: false
        });
        
        console.log('📧 Email 登入成功:', user);
        
        // 追蹤登入事件
        trackUserLogin('email');
        
        // 初始化 Firestore 連接
        await get().initializeFirestore();
        
        // 載入雲端數據
        const { isCloudSyncEnabled } = get();
        if (isCloudSyncEnabled) {
          console.log('🔄 開始載入雲端數據...');
          await get().loadFromCloud();
          console.log('✅ 雲端數據載入完成');
        } else {
          console.warn('⚠️ 雲端同步未啟用，跳過數據載入');
        }
      } catch (error: any) {
        set({ isLoading: false });
        console.error('❌ Email 登入失敗:', error);
        throw new Error(error instanceof Error ? error.message : 'Email 登入失敗');
      }
    },

    // Google登入
    loginWithGoogle: async () => {
      set({ isLoading: true });
      
      try {
        const firebaseUser = await signInWithGoogle();
        
        // 將 Firebase 用戶轉換為應用用戶格式
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '用戶',
          avatar: firebaseUser.photoURL || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20gamer%20avatar%20cartoon%20style&image_size=square',
          isGuest: false,
          createdAt: new Date()
        };
        
        set({
          currentUser: user,
          isAuthenticated: true,
          isLoading: false
        });
        
        console.log('🔥 Google 登入成功:', user);
        
        // 追蹤登入事件
        trackUserLogin('google');
        
        // 初始化 Firestore 連接
        await get().initializeFirestore();
        
        // 載入雲端數據
        const { isCloudSyncEnabled } = get();
        if (isCloudSyncEnabled) {
          console.log('🔄 開始載入雲端數據...');
          await get().loadFromCloud();
          console.log('✅ 雲端數據載入完成');
        } else {
          console.warn('⚠️ 雲端同步未啟用，跳過數據載入');
        }
      } catch (error: any) {
        set({ isLoading: false });
        console.error('❌ Google 登入失敗:', error);
        throw new Error(error instanceof Error ? error.message : 'Google 登入失敗');
      }
    },

    // 用戶註冊
    register: async (email: string, password: string, name: string) => {
      set({ isLoading: true });
      
      try {
        const firebaseUser = await registerWithEmailAndPassword(email, password, name);
        
        // 將 Firebase 用戶轉換為應用用戶格式
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || name,
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20gamer%20avatar%20cartoon%20style&image_size=square',
          isGuest: false,
          createdAt: new Date()
        };
        
        set({
          currentUser: user,
          isAuthenticated: true,
          isLoading: false
        });
        
        console.log('👤 註冊成功:', user);
        
        // 追蹤註冊事件
        trackUserRegistration('email');
        
        // 初始化 Firestore 連接
        await get().initializeFirestore();
        
        // 新用戶不需要載入雲端數據，但需要創建用戶資料
        const { isCloudSyncEnabled } = get();
        if (isCloudSyncEnabled) {
          console.log('🔄 創建用戶雲端資料...');
          await get().syncToCloud();
          console.log('✅ 用戶雲端資料創建完成');
        }
      } catch (error: any) {
        set({ isLoading: false });
        console.error('❌ 註冊失敗:', error);
        throw new Error(error instanceof Error ? error.message : '註冊失敗');
      }
    },

    // 訪客登入
    loginAsGuest: () => {
      const guestUser = generateGuestUser();
      set({
        currentUser: guestUser,
        isAuthenticated: true
      });
    },

    // 登出
    logout: async () => {
      try {
        const { currentUser, isCloudSyncEnabled } = get();
        
        // 追蹤登出事件（在清除用戶資料前）
        if (currentUser && !currentUser.isGuest) {
          trackUserLogout();
        }
        
        // 如果是 Firebase 用戶且啟用雲端同步，先同步數據到雲端
        if (currentUser && !currentUser.isGuest && isCloudSyncEnabled) {
          try {
            await get().syncToCloud();
            console.log('登出前數據同步完成');
          } catch (syncError) {
            console.error('登出前同步失敗:', syncError);
            // 繼續登出流程，即使同步失敗
          }
        }
        
        // 如果是 Firebase 用戶，從 Firebase 登出
        if (currentUser && !currentUser.isGuest) {
          try {
            await signOutUser();
          } catch (firebaseError) {
            console.error('Firebase 登出失敗:', firebaseError);
            // 即使 Firebase 登出失敗，也繼續本地清除
          }
        }
        
        // 重置所有狀態到初始值（但保留雲端數據）
        set({
          currentUser: null,
          isAuthenticated: false,
          gameRecords: [],
          userStats: getInitialStats(),
          achievements: DEFAULT_ACHIEVEMENTS.map(achievement => ({ ...achievement })),
          friends: [],
          isLoading: false,
          // 重置 Firestore 狀態
          isFirestoreConnected: false,
          isCloudSyncEnabled: false,
          lastSyncTime: null
        });
        
        // 設置登出標記，防止persist恢復狀態（雙重保險）
         localStorage.setItem('blockfall-logout-flag', 'true');
    sessionStorage.setItem('blockfall-logout-flag', 'true');
        
        // 清除持久化存儲
        localStorage.removeItem('blockfall-user-store');
        
        // 強制清除所有相關的localStorage項目
        Object.keys(localStorage).forEach(key => {
          if (key.includes('blockfall') || key.includes('user')) {
            localStorage.removeItem(key);
          }
        });
        
        // 針對TRAE SOLO內建瀏覽器的額外清除措施
        try {
          // 清除sessionStorage
          Object.keys(sessionStorage).forEach(key => {
            if (key.includes('blockfall') || key.includes('user')) {
              sessionStorage.removeItem(key);
            }
          });
          
          // 強制清除所有可能的緩存
          if (typeof window !== 'undefined' && window.caches) {
            window.caches.keys().then(names => {
              names.forEach(name => {
                if (name.includes('blockfall') || name.includes('user')) {
                  window.caches.delete(name);
                }
              });
            }).catch(() => {});
          }
        } catch (e) {
          console.warn('清除額外緩存時出錯:', e);
        }
        
        // 使用多種方式確保頁面重新載入
        setTimeout(() => {
          try {
            // 方法1: 使用location.replace
            window.location.replace('/');
          } catch (e) {
            try {
              // 方法2: 使用location.href
              window.location.href = '/';
            } catch (e2) {
              try {
                // 方法3: 強制重新載入
                window.location.reload();
              } catch (e3) {
                console.error('所有跳轉方法都失敗:', e3);
              }
            }
          }
        }, 50);
        
      } catch (error) {
        console.error('登出過程中發生錯誤:', error);
        // 即使出錯也要嘗試跳轉
        try {
          window.location.href = '/';
        } catch (e) {
          window.location.reload();
        }
      }
    },

    // 添加遊戲記錄
    addGameRecord: (recordData) => {
      console.log('🎮 [DEBUG] 開始添加遊戲記錄:', recordData);
      
      const { currentUser, gameRecords } = get();
      if (!currentUser) {
        console.warn('⚠️ [DEBUG] 無法添加遊戲記錄：用戶未登入');
        return;
      }

      console.log('👤 [DEBUG] 當前用戶:', {
        id: currentUser.id,
        name: currentUser.name,
        isGuest: currentUser.isGuest
      });
      console.log('📊 [DEBUG] 當前遊戲記錄數量:', gameRecords.length);

      const now = new Date();
      const newRecord: GameRecord = {
        id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser.id,
        createdAt: now,
        playedAt: now,
        ...recordData
      };

      console.log('📝 [DEBUG] 新遊戲記錄:', newRecord);

      // 檢查是否已存在相同的記錄（基於時間戳和分數去重）
      const isDuplicate = gameRecords.some(record => 
        Math.abs(toMsSafe(record.playedAt) - toMsSafe(newRecord.playedAt)) < 1000 && // 1秒內
        record.score === newRecord.score &&
        record.level === newRecord.level &&
        record.lines === newRecord.lines
      );

      if (isDuplicate) {
        console.warn('⚠️ [DEBUG] 檢測到重複記錄，跳過添加');
        return;
      }

      const updatedRecords = [newRecord, ...gameRecords]
        .sort((a, b) => toMsSafe(b.playedAt) - toMsSafe(a.playedAt)) // 按時間排序
        .slice(0, 100); // 保留最近100條記錄
      
      console.log('📋 [DEBUG] 更新後記錄數量:', updatedRecords.length);
      
      set({ gameRecords: updatedRecords });
      
      // 追蹤遊戲結束事件
      trackGameEnd(
        newRecord.gameType,
        newRecord.score,
        newRecord.level,
        newRecord.lines,
        newRecord.duration * 1000 // 轉換為毫秒
      );
      
      // 驗證數據是否正確保存
      const { gameRecords: savedRecords } = get();
      console.log('✅ [DEBUG] 記錄已保存，當前總數:', savedRecords.length);
      console.log('🔍 [DEBUG] 最新記錄:', savedRecords[0]);
      
      // 更新統計數據
      console.log('📈 [DEBUG] 開始更新統計數據...');
      get().updateUserStats();
      
      // 檢查成就
      console.log('🏆 [DEBUG] 開始檢查成就...');
      get().checkAchievements();
      
      // 如果啟用雲端同步，自動同步到雲端
      const { isCloudSyncEnabled } = get();
      console.log('☁️ [DEBUG] 雲端同步狀態:', {
        enabled: isCloudSyncEnabled,
        isGuest: currentUser.isGuest
      });
      
      if (isCloudSyncEnabled && !currentUser.isGuest) {
        console.log('🔄 [DEBUG] 開始自動同步到雲端...');
        get().syncToCloud().then(() => {
          console.log('✅ [DEBUG] 自動同步到雲端成功');
        }).catch(error => {
          console.error('❌ [DEBUG] 自動同步到雲端失敗:', error);
        });
      } else {
        console.log('⏭️ [DEBUG] 跳過雲端同步');
      }
    },

    // 獲取遊戲記錄
    getGameRecords: (limit = 10) => {
      const { gameRecords } = get();
      return gameRecords.slice(0, limit);
    },

    // 更新用戶統計
    updateUserStats: () => {
      const { gameRecords, currentUser } = get();
      
      console.log('📊 [DEBUG] 開始更新用戶統計...', {
        hasUser: !!currentUser,
        recordsCount: gameRecords.length
      });
      
      if (!currentUser) {
        console.log('⚠️ [DEBUG] 無用戶，跳過統計更新');
        return;
      }

      const userRecords = gameRecords.filter(record => record.userId === currentUser.id);
      
      console.log('📊 [DEBUG] 用戶記錄篩選:', {
        totalRecords: gameRecords.length,
        userRecords: userRecords.length,
        userId: currentUser.id
      });
      
      if (userRecords.length === 0) {
        const emptyStats: UserStats = {
          totalGames: 0,
          totalWins: 0,
          totalLosses: 0,
          highestScore: 0,
          averageScore: 0,
          totalPlayTime: 0,
          winRate: 0,
          currentStreak: 0,
          bestStreak: 0
        };
        
        console.log('📊 [DEBUG] 設置空統計數據:', emptyStats);
        set({ userStats: emptyStats });
        return;
      }
      
      // 確保所有記錄都有有效的數值
      const validRecords = userRecords.filter(record => 
        record && 
        typeof record.score === 'number' && 
        typeof record.lines === 'number' && 
        typeof record.level === 'number' && 
        typeof record.duration === 'number' &&
        !isNaN(record.score) &&
        !isNaN(record.lines) &&
        !isNaN(record.level) &&
        !isNaN(record.duration)
      );
      
      console.log('📊 [DEBUG] 有效記錄篩選:', {
        total: userRecords.length,
        valid: validRecords.length,
        invalid: userRecords.length - validRecords.length
      });
      
      const totalGames = validRecords.length;
      const totalWins = validRecords.filter(record => record.result === 'win').length;
      const totalLosses = validRecords.filter(record => record.result === 'lose').length;
      const highestScore = totalGames > 0 ? Math.max(...validRecords.map(record => record.score || 0)) : 0;
      const averageScore = totalGames > 0 ? Math.round(validRecords.reduce((sum, record) => sum + (record.score || 0), 0) / totalGames) : 0;
      const totalPlayTime = validRecords.reduce((sum, record) => sum + (record.duration || 0), 0);
      const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
      
      // 計算連勝（按時間排序）
      const sortedRecords = [...validRecords].sort((a, b) => toMsSafe(b.playedAt) - toMsSafe(a.playedAt));
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      
      // 計算最佳連勝
      for (const record of sortedRecords) {
        if (record.result === 'win') {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
      
      // 計算當前連勝（從最新記錄開始）
      for (const record of sortedRecords) {
        if (record.result === 'win') {
          currentStreak++;
        } else {
          break;
        }
      }

      const newStats: UserStats = {
        totalGames,
        totalWins,
        totalLosses,
        highestScore,
        averageScore,
        totalPlayTime,
        winRate,
        currentStreak,
        bestStreak
      };
      
      console.log('📊 [DEBUG] 計算完成的統計數據:', newStats);

      set({ userStats: newStats });
      
      // 驗證設置是否成功
      const { userStats: updatedStats } = get();
      console.log('✅ [DEBUG] 統計數據更新完成:', updatedStats);
    },

    // 獲取用戶統計
    getUserStats: () => {
      return get().userStats;
    },

    // 檢查成就
    checkAchievements: () => {
      const { achievements, userStats, gameRecords, currentUser } = get();
      
      console.log('🏆 [DEBUG] 開始檢查成就...', {
        hasUser: !!currentUser,
        achievementsCount: achievements.length,
        recordsCount: gameRecords.length
      });
      
      if (!currentUser) {
        console.log('⚠️ [DEBUG] 無用戶，跳過成就檢查');
        return;
      }

      const userRecords = gameRecords.filter(record => record.userId === currentUser.id);
      console.log('🎮 [DEBUG] 用戶遊戲記錄:', {
        totalRecords: gameRecords.length,
        userRecords: userRecords.length,
        userId: currentUser.id
      });
      
      const updatedAchievements = achievements.map(achievement => {
        if (achievement.unlockedAt) {
          console.log(`✅ [DEBUG] 成就已解鎖: ${achievement.name}`);
          return achievement; // 已解鎖，保持原狀
        }
        
        let shouldUnlock = false;
        let progress = 0;
        let newAchievement = { ...achievement };
        
        console.log(`🔍 [DEBUG] 檢查成就: ${achievement.name} (${achievement.condition})`);
        
        switch (achievement.condition) {
          case 'complete_first_game':
            progress = userRecords.length;
            shouldUnlock = userRecords.length >= 1;
            console.log(`📊 [DEBUG] 首次遊戲: ${progress}/1`);
            break;
          case 'score_1000':
            progress = userStats.highestScore;
            shouldUnlock = userStats.highestScore >= 1000;
            console.log(`📊 [DEBUG] 分數1000: ${progress}/1000`);
            break;
          case 'score_5000':
            progress = userStats.highestScore;
            shouldUnlock = userStats.highestScore >= 5000;
            console.log(`📊 [DEBUG] 分數5000: ${progress}/5000`);
            break;
          case 'win_streak_5':
            progress = userStats.bestStreak;
            shouldUnlock = userStats.bestStreak >= 5;
            console.log(`📊 [DEBUG] 連勝5場: ${progress}/5`);
            break;
          case 'total_games_10':
            progress = userStats.totalGames;
            shouldUnlock = userStats.totalGames >= 10;
            console.log(`📊 [DEBUG] 總遊戲10場: ${progress}/10`);
            break;
          case 'total_games_50':
            progress = userStats.totalGames;
            shouldUnlock = userStats.totalGames >= 50;
            console.log(`📊 [DEBUG] 總遊戲50場: ${progress}/50`);
            break;
          case 'level_10':
            const maxLevel = userRecords.length > 0 ? Math.max(...userRecords.map(record => record.level || 0)) : 0;
            progress = maxLevel;
            shouldUnlock = maxLevel >= 10;
            console.log(`📊 [DEBUG] 等級10: ${progress}/10`);
            break;
          case 'multiplayer_win':
            const multiplayerWins = userRecords.filter(record => record.gameType === 'multiplayer' && record.result === 'win').length;
            progress = multiplayerWins;
            shouldUnlock = multiplayerWins > 0;
            console.log(`📊 [DEBUG] 多人遊戲勝利: ${progress}/1`);
            break;
          default:
            console.log(`⚠️ [DEBUG] 未知成就條件: ${achievement.condition}`);
            break;
        }
        
        // 更新進度
        if (achievement.maxProgress && achievement.maxProgress > 0) {
          newAchievement.progress = Math.min(progress, achievement.maxProgress);
        } else {
          newAchievement.progress = progress;
        }
        
        // 檢查是否應該解鎖
        if (shouldUnlock && !achievement.unlockedAt) {
          newAchievement.unlockedAt = new Date();
          console.log(`🎉 [DEBUG] 成就解鎖: ${achievement.name}`);
          // 這裡可以顯示成就解鎖通知
        }
        
        console.log(`📈 [DEBUG] 成就更新: ${achievement.name} - 進度: ${newAchievement.progress}, 已解鎖: ${!!newAchievement.unlockedAt}`);
        
        return newAchievement;
      });
      
      console.log('🏆 [DEBUG] 成就檢查完成:', {
        total: updatedAchievements.length,
        unlocked: updatedAchievements.filter(a => a.unlockedAt).length,
        newlyUnlocked: updatedAchievements.filter(a => a.unlockedAt && !achievements.find(orig => orig.id === a.id)?.unlockedAt).length
      });
      
      set({ achievements: updatedAchievements });
      
      // 驗證設置是否成功
      const { achievements: finalAchievements } = get();
      console.log('✅ [DEBUG] 成就狀態更新完成:', {
        total: finalAchievements.length,
        unlocked: finalAchievements.filter(a => a.unlockedAt).length
      });
    },

    // 解鎖成就
    unlockAchievement: (achievementId: string) => {
      const { achievements } = get();
      const updatedAchievements = achievements.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, unlockedAt: new Date() }
          : achievement
      );
      set({ achievements: updatedAchievements });
    },

    // 添加好友
    addFriend: async (friendId: string) => {
      // 這裡應該調用API添加好友
      console.log('添加好友:', friendId);
    },

    // 移除好友
    removeFriend: (friendId: string) => {
      const { friends } = get();
      const updatedFriends = friends.filter(friend => friend.id !== friendId);
      set({ friends: updatedFriends });
    },

    // 獲取好友列表
    getFriends: () => {
      return get().friends;
    },

    // 更新用戶資料
    updateProfile: async (data: { name?: string; avatar?: string; email?: string; currentPassword?: string; newPassword?: string }) => {
      const { currentUser } = get();
      if (!currentUser) {
        set({ error: '用戶未登入' });
        return;
      }

      set({ isLoading: true, error: null });
      
      try {
        // 更新本地用戶資料（只更新name和avatar）
        const updatedUser = {
          ...currentUser,
          ...(data.name && { name: data.name }),
          ...(data.avatar && { avatar: data.avatar }),
          ...(data.email && { email: data.email })
        };
        
        set({
          currentUser: updatedUser,
          isLoading: false
        });
        
        // 如果是Firebase用戶，這裡可以添加Firebase更新邏輯
        // if (!currentUser.isGuest) {
        //   if (data.email || data.currentPassword || data.newPassword) {
        //     await updateFirebaseProfile(data);
        //   }
        // }
        
      } catch (error: any) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : '更新資料失敗' 
        });
        throw error;
      }
    },

    // 刪除帳戶
    deleteAccount: async () => {
      const { currentUser } = get();
      if (!currentUser) {
        set({ error: '用戶未登入' });
        return;
      }

      set({ isLoading: true, error: null });
      
      try {
        // 如果是Firebase用戶，這裡可以添加Firebase刪除邏輯
        // await deleteFirebaseAccount();
        
        // 清除所有用戶數據
        set({
          currentUser: null,
          isAuthenticated: false,
          gameRecords: [],
          userStats: getInitialStats(),
          achievements: DEFAULT_ACHIEVEMENTS.map(achievement => ({ ...achievement })),
          friends: [],
          isLoading: false,
          error: null
        });
        
        // 清除本地存儲
        localStorage.removeItem('blockfall-user-store');
        
      } catch (error: any) {
        set({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : '刪除帳戶失敗' 
        });
        throw error;
      }
    },

    // 清除錯誤
    clearError: () => {
      set({ error: null });
    },

    // 設置用戶（用於Firebase認證狀態同步）
    setUser: async (user: User) => {
      console.log('👤 [DEBUG] 設置用戶:', user);
      console.log('🔍 [DEBUG] 用戶詳細信息:', {
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: user.isGuest,
        createdAt: user.createdAt
      });
      
      // 檢查當前狀態
      const currentState = get();
      console.log('📊 [DEBUG] 設置用戶前的狀態:', {
        hasCurrentUser: !!currentState.currentUser,
        isAuthenticated: currentState.isAuthenticated,
        gameRecordsCount: currentState.gameRecords.length,
        isFirestoreConnected: currentState.isFirestoreConnected,
        isCloudSyncEnabled: currentState.isCloudSyncEnabled
      });
      
      set({
        currentUser: user,
        isAuthenticated: true,
        isLoading: false
      });
      
      console.log('✅ [DEBUG] 用戶狀態已更新');
      
      // 對於非訪客用戶，先初始化 Firestore，然後載入雲端數據
      if (!user.isGuest) {
        try {
          console.log('🔧 [DEBUG] 非訪客用戶，開始初始化 Firestore 連接...');
          const isConnected = await get().initializeFirestore();
          
          console.log('🔗 [DEBUG] Firestore 連接結果:', isConnected);
          
          if (isConnected) {
            console.log('🔄 [DEBUG] Firestore 連接成功，開始載入雲端數據...');
            await get().loadFromCloud();
            
            // 檢查載入後的狀態
            const afterLoadState = get();
            console.log('📈 [DEBUG] 雲端數據載入後的狀態:', {
              gameRecordsCount: afterLoadState.gameRecords.length,
              userStats: afterLoadState.userStats,
              achievementsCount: afterLoadState.achievements.length,
              lastSyncTime: afterLoadState.lastSyncTime
            });
            
            console.log('✅ [DEBUG] 用戶數據載入完成');
          } else {
            console.warn('⚠️ [DEBUG] Firestore 連接失敗，無法載入雲端數據');
          }
        } catch (error) {
          console.error('❌ [DEBUG] 同步用戶數據失敗:', error);
        console.error('🔍 [DEBUG] 錯誤詳情:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        }
      } else {
        console.log('⏭️ [DEBUG] 訪客用戶，跳過雲端數據載入');
      }
    },

    // 初始化 Firestore 連接
    initializeFirestore: async () => {
      try {
        console.log('🔧 正在初始化 Firestore 連接...');
        const isConnected = await checkFirestoreConnection();
        
        set({ 
          isFirestoreConnected: isConnected,
          isCloudSyncEnabled: isConnected 
        });
        
        if (isConnected) {
          console.log('✅ Firestore 連接成功，雲端同步已啟用');
        } else {
          console.warn('⚠️ Firestore 連接失敗，雲端同步已禁用');
          console.warn('請檢查 Firebase 配置是否正確設置');
          console.warn('確保 .env 文件中的 Firebase 配置不是示例值');
        }
        
        return isConnected;
      } catch (error) {
        console.error('❌ Firestore 初始化錯誤:', error);
        console.error('這可能是因為 Firebase 配置不正確或網路問題');
        console.error('請檢查：');
        console.error('1. Firebase 項目是否正確設置');
        console.error('2. Firestore Database 是否已啟用');
        console.error('3. 網路連接是否正常');
        
        set({ 
          isFirestoreConnected: false,
          isCloudSyncEnabled: false 
        });
        
        return false;
      }
    },

    // 同步數據到雲端
    syncToCloud: async () => {
      const { currentUser, gameRecords, userStats, achievements, isCloudSyncEnabled } = get();
      
      console.log('☁️ [DEBUG] 開始同步到雲端...');
      console.log('🔍 [DEBUG] 同步前檢查:', {
        hasUser: !!currentUser,
        userId: currentUser?.id,
        isGuest: currentUser?.isGuest,
        syncEnabled: isCloudSyncEnabled,
        recordsCount: gameRecords.length,
        achievementsCount: achievements.length
      });
      
      if (!currentUser || currentUser.isGuest || !isCloudSyncEnabled) {
        console.log('⏭️ [DEBUG] 跳過雲端同步：', {
          hasUser: !!currentUser,
          isGuest: currentUser?.isGuest,
          syncEnabled: isCloudSyncEnabled
        });
        return;
      }

      try {
        console.log('📤 [DEBUG] 正在同步用戶數據到雲端...', currentUser.id);
        
        // 先載入雲端現有數據進行合併
        const cloudData = await firestoreDataSyncService.loadUserDataFromCloud(currentUser.id);
        
        let finalGameRecords = gameRecords;
        let finalAchievements = achievements;
        
        if (cloudData) {
          // 合併遊戲記錄，避免重複
          const allRecords = [...gameRecords, ...cloudData.gameRecords];
          finalGameRecords = allRecords.filter((record, index, arr) => {
            return arr.findIndex(r => 
              r.id === record.id || 
              (Math.abs(toMsSafe(r.playedAt) - toMsSafe(record.playedAt)) < 1000 &&
               r.score === record.score &&
               r.level === record.level &&
               r.lines === record.lines)
            ) === index;
          }).sort((a, b) => toMsSafe(b.playedAt) - toMsSafe(a.playedAt)).slice(0, 100);
          
          // 合併成就，保留最佳進度
          finalAchievements = DEFAULT_ACHIEVEMENTS.map(defaultAchievement => {
            const localAchievement = achievements.find(a => a.id === defaultAchievement.id);
            const cloudAchievement = cloudData.achievements.find(a => a.id === defaultAchievement.id);
            
            if (localAchievement && cloudAchievement) {
              if (localAchievement.unlockedAt && !cloudAchievement.unlockedAt) {
                return localAchievement;
              } else if (!localAchievement.unlockedAt && cloudAchievement.unlockedAt) {
                return cloudAchievement;
              } else if (localAchievement.unlockedAt && cloudAchievement.unlockedAt) {
                return localAchievement.unlockedAt <= cloudAchievement.unlockedAt ? localAchievement : cloudAchievement;
              } else {
                const localProgress = localAchievement.progress || 0;
                const cloudProgress = cloudAchievement.progress || 0;
                return localProgress >= cloudProgress ? localAchievement : cloudAchievement;
              }
            } else if (localAchievement) {
              return localAchievement;
            } else if (cloudAchievement) {
              return cloudAchievement;
            } else {
              return { ...defaultAchievement };
            }
          });
          
          console.log('🔄 [DEBUG] 數據合併完成:', {
            originalRecords: gameRecords.length,
            cloudRecords: cloudData.gameRecords.length,
            finalRecords: finalGameRecords.length,
            originalAchievements: achievements.filter(a => a.unlockedAt).length,
            cloudAchievements: cloudData.achievements.filter(a => a.unlockedAt).length,
            finalAchievements: finalAchievements.filter(a => a.unlockedAt).length
          });
        }
        
        console.log('📊 [DEBUG] 同步數據詳情:', {
          gameRecords: finalGameRecords.length,
          userStats,
          achievements: finalAchievements.length,
          unlockedAchievements: finalAchievements.filter(a => a.unlockedAt).length
        });
        
        // 創建或更新用戶資料
        const firestoreUser: FirestoreUser = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          avatar: currentUser.avatar || '',
          isGuest: currentUser.isGuest,
          createdAt: currentUser.createdAt,
          lastLoginAt: new Date()
        };
        
        await firestoreUserService.createOrUpdateUser(firestoreUser);
        console.log('👤 [DEBUG] 用戶資料同步完成');
        
        // 同步合併後的遊戲數據
        await firestoreDataSyncService.syncUserDataToCloud(currentUser.id, {
          gameRecords: finalGameRecords,
          userStats,
          achievements: finalAchievements
        });
        console.log('🎮 [DEBUG] 遊戲數據同步完成');
        
        // 更新本地狀態為合併後的數據
        set({ 
          gameRecords: finalGameRecords,
          achievements: finalAchievements,
          lastSyncTime: new Date() 
        });
        
        console.log('✅ [DEBUG] 數據已成功同步到雲端');
      } catch (error) {
        console.error('❌ [DEBUG] 同步到雲端失敗:', error);
        console.error('🔍 [DEBUG] 錯誤詳情:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    },

    // 從雲端載入數據
    loadFromCloud: async () => {
      const { currentUser, isCloudSyncEnabled, gameRecords: localRecords, achievements: localAchievements } = get();
      
      console.log('🔄 [DEBUG] 開始從雲端載入數據...');
      console.log('🔍 [DEBUG] 載入前檢查:', {
        hasUser: !!currentUser,
        userId: currentUser?.id,
        isGuest: currentUser?.isGuest,
        syncEnabled: isCloudSyncEnabled,
        localRecordsCount: localRecords.length,
        localAchievementsCount: localAchievements.length
      });
      
      if (!currentUser || currentUser.isGuest || !isCloudSyncEnabled) {
        console.log('⏭️ [DEBUG] 跳過雲端載入：', {
          hasUser: !!currentUser,
          isGuest: currentUser?.isGuest,
          syncEnabled: isCloudSyncEnabled
        });
        return;
      }

      try {
        console.log('🔍 [DEBUG] 正在從雲端載入用戶數據...', currentUser.id);
        const cloudData = await firestoreDataSyncService.loadUserDataFromCloud(currentUser.id);
        
        console.log('📡 [DEBUG] 雲端數據載入結果:', cloudData);
        
        if (cloudData) {
          console.log('📊 [DEBUG] 雲端數據載入成功:', {
            gameRecords: cloudData.gameRecords.length,
            userStats: cloudData.userStats,
            achievements: cloudData.achievements.length
          });
          
          // 合併遊戲記錄，去除重複
          const allRecords = [...localRecords, ...cloudData.gameRecords];
          const uniqueRecords = allRecords.filter((record, index, arr) => {
            return arr.findIndex(r => 
              r.id === record.id || 
              (Math.abs(toMsSafe(r.playedAt) - toMsSafe(record.playedAt)) < 1000 &&
               r.score === record.score &&
               r.level === record.level &&
               r.lines === record.lines)
            ) === index;
          }).sort((a, b) => toMsSafe(b.playedAt) - toMsSafe(a.playedAt)).slice(0, 100);
          
          console.log('📝 [DEBUG] 合併後遊戲記錄:', {
            local: localRecords.length,
            cloud: cloudData.gameRecords.length,
            merged: uniqueRecords.length
          });
          
          // 智能合併成就，保留進度較高的版本
          const mergedAchievements = DEFAULT_ACHIEVEMENTS.map(defaultAchievement => {
            const localAchievement = localAchievements.find(a => a.id === defaultAchievement.id);
            const cloudAchievement = cloudData.achievements.find(a => a.id === defaultAchievement.id);
            
            // 如果雲端和本地都有，選擇進度更高或已解鎖的版本
            if (localAchievement && cloudAchievement) {
              if (localAchievement.unlockedAt && !cloudAchievement.unlockedAt) {
                return localAchievement;
              } else if (!localAchievement.unlockedAt && cloudAchievement.unlockedAt) {
                return cloudAchievement;
              } else if (localAchievement.unlockedAt && cloudAchievement.unlockedAt) {
                // 都已解鎖，選擇解鎖時間較早的
                return localAchievement.unlockedAt <= cloudAchievement.unlockedAt ? localAchievement : cloudAchievement;
              } else {
                // 都未解鎖，選擇進度較高的
                const localProgress = localAchievement.progress || 0;
                const cloudProgress = cloudAchievement.progress || 0;
                return localProgress >= cloudProgress ? localAchievement : cloudAchievement;
              }
            } else if (localAchievement) {
              return localAchievement;
            } else if (cloudAchievement) {
              return cloudAchievement;
            } else {
              return { ...defaultAchievement };
            }
          });
          
          console.log('🏆 [DEBUG] 成就合併結果:', {
            local: localAchievements.filter(a => a.unlockedAt).length,
            cloud: cloudData.achievements.filter(a => a.unlockedAt).length,
            merged: mergedAchievements.filter(a => a.unlockedAt).length
          });
          
          set({
            gameRecords: uniqueRecords,
            userStats: cloudData.userStats,
            achievements: mergedAchievements,
            lastSyncTime: new Date()
          });
          
          // 重新計算統計數據以確保一致性
          get().updateUserStats();
          
          // 驗證數據是否正確設置
          const afterSetState = get();
          console.log('✅ [DEBUG] 數據設置後驗證:', {
            gameRecordsCount: afterSetState.gameRecords.length,
            userStats: afterSetState.userStats,
            achievementsCount: afterSetState.achievements.length,
            unlockedAchievements: afterSetState.achievements.filter(a => a.unlockedAt).length,
            lastSyncTime: afterSetState.lastSyncTime
          });
          
          console.log('✅ [DEBUG] 數據已成功載入到本地狀態');
        } else {
          console.log('📭 [DEBUG] 雲端沒有找到用戶數據，使用預設值');
          console.log('🔧 [DEBUG] 當前本地記錄數量:', localRecords.length);
        }
      } catch (error) {
        console.error('❌ [DEBUG] 從雲端載入數據失敗:', error);
        console.error('🔍 [DEBUG] 錯誤詳情:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    },

    // 啟用雲端同步
    enableCloudSync: () => {
      set({ isCloudSyncEnabled: true });
      const { currentUser } = get();
      if (currentUser && !currentUser.isGuest) {
        get().loadFromCloud().catch(console.error);
      }
    },

    // 停用雲端同步
    disableCloudSync: () => {
      set({ isCloudSyncEnabled: false });
    }
  }),
  {
    name: 'blockfall-user-store',
    partialize: (state) => ({
      currentUser: state.currentUser,
      isAuthenticated: state.isAuthenticated,
      gameRecords: state.gameRecords,
      userStats: state.userStats,
      achievements: state.achievements,
      friends: state.friends,
      isFirestoreConnected: state.isFirestoreConnected,
      isCloudSyncEnabled: state.isCloudSyncEnabled,
      lastSyncTime: state.lastSyncTime
    }),
    onRehydrateStorage: () => {
      console.log('🔄 [DEBUG] onRehydrateStorage 開始執行...');
      
      // 檢查是否有登出標記
      const logoutFlag = localStorage.getItem('blockfall-logout-flag');
    const sessionLogoutFlag = sessionStorage.getItem('blockfall-logout-flag');
      
      console.log('🔍 [DEBUG] 檢查登出標記:', {
        logoutFlag,
        sessionLogoutFlag
      });
      
      if (logoutFlag === 'true' || sessionLogoutFlag === 'true') {
        console.log('🚪 [DEBUG] 發現登出標記，準備重置狀態...');
        
        // 清除登出標記
        localStorage.removeItem('blockfall-logout-flag');
        sessionStorage.removeItem('blockfall-logout-flag');
        
        console.log('🧹 [DEBUG] 登出標記已清除');
        
        // 返回一個函數來重置狀態
        return (state, error) => {
          console.log('🔄 [DEBUG] 執行狀態重置...', {
            hasState: !!state,
            hasError: !!error,
            error: error instanceof Error ? error.message : String(error)
          });
          
          try {
            // 強制重置為初始狀態，無論是否有錯誤
            const initialState = {
              currentUser: null,
              isAuthenticated: false,
              gameRecords: [],
              userStats: getInitialStats(),
              achievements: DEFAULT_ACHIEVEMENTS.map(achievement => ({ ...achievement })),
              friends: [],
              isLoading: false,
              isFirestoreConnected: false,
              isCloudSyncEnabled: false,
              lastSyncTime: null
            };
            
            console.log('🔧 [DEBUG] 設置初始狀態:', initialState);
            
            useUserStore.setState(initialState);
            
            console.log('✅ [DEBUG] 狀態重置完成');
            
          } catch (resetError) {
            console.error('❌ [DEBUG] 重置狀態時出錯:', resetError);
          }
        };
      } else {
        console.log('✅ [DEBUG] 沒有登出標記，正常載入狀態');
        
        // 返回一個函數來記錄正常的狀態恢復
        return (state, error) => {
          console.log('📊 [DEBUG] 狀態恢復完成:', {
            hasState: !!state,
            hasError: !!error,
            gameRecordsCount: state?.gameRecords?.length || 0,
            isAuthenticated: state?.isAuthenticated || false,
            currentUser: state?.currentUser ? {
              id: state.currentUser.id,
              name: state.currentUser.name,
              isGuest: state.currentUser.isGuest
            } : null
          });
          
          if (error) {
            console.error('⚠️ [DEBUG] 狀態恢復時有錯誤:', error);
          }
        };
      }
    }
  }
));