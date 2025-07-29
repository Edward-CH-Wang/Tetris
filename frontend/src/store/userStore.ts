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
        throw new Error(error.message || 'Email 登入失敗');
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
        throw new Error(error.message || 'Google 登入失敗');
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
        throw new Error(error.message || '註冊失敗');
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
         localStorage.setItem('tetris-logout-flag', 'true');
         sessionStorage.setItem('tetris-logout-flag', 'true');
        
        // 清除持久化存儲
        localStorage.removeItem('tetris-user-store');
        
        // 強制清除所有相關的localStorage項目
        Object.keys(localStorage).forEach(key => {
          if (key.includes('tetris') || key.includes('user')) {
            localStorage.removeItem(key);
          }
        });
        
        // 針對TRAE SOLO內建瀏覽器的額外清除措施
        try {
          // 清除sessionStorage
          Object.keys(sessionStorage).forEach(key => {
            if (key.includes('tetris') || key.includes('user')) {
              sessionStorage.removeItem(key);
            }
          });
          
          // 強制清除所有可能的緩存
          if (typeof window !== 'undefined' && window.caches) {
            window.caches.keys().then(names => {
              names.forEach(name => {
                if (name.includes('tetris') || name.includes('user')) {
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

      const updatedRecords = [newRecord, ...gameRecords].slice(0, 100); // 保留最近100條記錄
      
      console.log('📋 [DEBUG] 更新後記錄數量:', updatedRecords.length);
      
      set({ gameRecords: updatedRecords });
      
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
      if (!currentUser || gameRecords.length === 0) return;

      const userRecords = gameRecords.filter(record => record.userId === currentUser.id);
      
      const totalGames = userRecords.length;
      const totalWins = userRecords.filter(record => record.result === 'win').length;
      const totalLosses = userRecords.filter(record => record.result === 'lose').length;
      const highestScore = Math.max(...userRecords.map(record => record.score), 0);
      const averageScore = totalGames > 0 ? Math.round(userRecords.reduce((sum, record) => sum + record.score, 0) / totalGames) : 0;
      const totalPlayTime = userRecords.reduce((sum, record) => sum + record.duration, 0);
      const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
      
      // 計算連勝
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      
      for (const record of userRecords) {
        if (record.result === 'win') {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
      
      // 計算當前連勝（從最新記錄開始）
      for (const record of userRecords) {
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

      set({ userStats: newStats });
    },

    // 獲取用戶統計
    getUserStats: () => {
      return get().userStats;
    },

    // 檢查成就
    checkAchievements: () => {
      const { achievements, userStats, gameRecords, currentUser } = get();
      if (!currentUser) return;

      const userRecords = gameRecords.filter(record => record.userId === currentUser.id);
      const updatedAchievements = [...achievements];
      
      updatedAchievements.forEach(achievement => {
        if (achievement.unlockedAt) return; // 已解鎖
        
        let shouldUnlock = false;
        let progress = 0;
        
        switch (achievement.condition) {
          case 'complete_first_game':
            shouldUnlock = userRecords.length >= 1;
            break;
          case 'score_1000':
            shouldUnlock = userStats.highestScore >= 1000;
            break;
          case 'score_5000':
            shouldUnlock = userStats.highestScore >= 5000;
            break;
          case 'win_streak_5':
            shouldUnlock = userStats.bestStreak >= 5;
            break;
          case 'total_games_10':
            progress = userStats.totalGames;
            shouldUnlock = userStats.totalGames >= 10;
            break;
          case 'total_games_50':
            progress = userStats.totalGames;
            shouldUnlock = userStats.totalGames >= 50;
            break;
          case 'level_10':
            shouldUnlock = userRecords.some(record => record.level >= 10);
            break;
          case 'multiplayer_win':
            shouldUnlock = userRecords.some(record => record.gameType === 'multiplayer' && record.result === 'win');
            break;
        }
        
        if (achievement.maxProgress) {
          achievement.progress = Math.min(progress, achievement.maxProgress);
        }
        
        if (shouldUnlock && !achievement.unlockedAt) {
          achievement.unlockedAt = new Date();
          // 這裡可以顯示成就解鎖通知
          console.log(`🎉 成就解鎖: ${achievement.name}`);
        }
      });
      
      set({ achievements: updatedAchievements });
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
          error: error.message || '更新資料失敗' 
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
        localStorage.removeItem('tetris-user-store');
        
      } catch (error: any) {
        set({ 
          isLoading: false, 
          error: error.message || '刪除帳戶失敗' 
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
          console.error('❌ [DEBUG] 設置用戶時發生錯誤:', error);
          console.error('🔍 [DEBUG] 錯誤詳情:', {
            message: error.message,
            stack: error.stack
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
      
      if (!currentUser || currentUser.isGuest || !isCloudSyncEnabled) {
        console.log('⏭️ 跳過雲端同步：', {
          hasUser: !!currentUser,
          isGuest: currentUser?.isGuest,
          syncEnabled: isCloudSyncEnabled
        });
        return;
      }

      try {
        console.log('☁️ 開始同步數據到雲端...', {
          userId: currentUser.id,
          gameRecords: gameRecords.length,
          userStats,
          achievements: achievements.length
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
        console.log('👤 用戶資料同步完成');
        
        // 同步遊戲數據
        await firestoreDataSyncService.syncUserDataToCloud(currentUser.id, {
          gameRecords,
          userStats,
          achievements
        });
        console.log('🎮 遊戲數據同步完成');
        
        set({ lastSyncTime: new Date() });
        console.log('✅ 數據同步到雲端成功');
      } catch (error) {
        console.error('❌ 同步到雲端失敗:', error);
        throw error;
      }
    },

    // 從雲端載入數據
    loadFromCloud: async () => {
      const { currentUser, isCloudSyncEnabled, gameRecords: localRecords } = get();
      
      console.log('🔄 [DEBUG] 開始從雲端載入數據...');
      console.log('🔍 [DEBUG] 載入前檢查:', {
        hasUser: !!currentUser,
        userId: currentUser?.id,
        isGuest: currentUser?.isGuest,
        syncEnabled: isCloudSyncEnabled,
        localRecordsCount: localRecords.length
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
          
          console.log('📝 [DEBUG] 雲端遊戲記錄詳情:', cloudData.gameRecords.slice(0, 3));
          
          const newAchievements = cloudData.achievements.length > 0 
            ? cloudData.achievements 
            : DEFAULT_ACHIEVEMENTS.map(achievement => ({ ...achievement }));
          
          console.log('🏆 [DEBUG] 處理後的成就數據:', newAchievements.length);
          
          set({
            gameRecords: cloudData.gameRecords,
            userStats: cloudData.userStats,
            achievements: newAchievements,
            lastSyncTime: new Date()
          });
          
          // 驗證數據是否正確設置
          const afterSetState = get();
          console.log('✅ [DEBUG] 數據設置後驗證:', {
            gameRecordsCount: afterSetState.gameRecords.length,
            userStats: afterSetState.userStats,
            achievementsCount: afterSetState.achievements.length,
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
          message: error.message,
          stack: error.stack
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
    name: 'tetris-user-store',
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
      const logoutFlag = localStorage.getItem('tetris-logout-flag');
      const sessionLogoutFlag = sessionStorage.getItem('tetris-logout-flag');
      
      console.log('🔍 [DEBUG] 檢查登出標記:', {
        logoutFlag,
        sessionLogoutFlag
      });
      
      if (logoutFlag === 'true' || sessionLogoutFlag === 'true') {
        console.log('🚪 [DEBUG] 發現登出標記，準備重置狀態...');
        
        // 清除登出標記
        localStorage.removeItem('tetris-logout-flag');
        sessionStorage.removeItem('tetris-logout-flag');
        
        console.log('🧹 [DEBUG] 登出標記已清除');
        
        // 返回一個函數來重置狀態
        return (state, error) => {
          console.log('🔄 [DEBUG] 執行狀態重置...', {
            hasState: !!state,
            hasError: !!error,
            error: error?.message
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