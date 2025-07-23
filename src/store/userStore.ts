import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signInWithGoogle, signOutUser, onAuthStateChanged, signInWithEmail, registerWithEmailAndPassword } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

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
  
  // 認證相關方法
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  setUser: (user: User) => void;
  
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
}

export interface UserActions {
  // 認證相關
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  setUser: (user: User) => void;
  
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
      } catch (error: any) {
        set({ isLoading: false });
        console.error('Email 登入失敗:', error);
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
      } catch (error: any) {
        set({ isLoading: false });
        console.error('Google 登入失敗:', error);
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
      } catch (error: any) {
        set({ isLoading: false });
        console.error('註冊失敗:', error);
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
        // 如果是 Firebase 用戶，先從 Firebase 登出
        const { currentUser } = get();
        if (currentUser && !currentUser.isGuest) {
          try {
            await signOutUser();
          } catch (firebaseError) {
            console.error('Firebase 登出失敗:', firebaseError);
            // 即使 Firebase 登出失敗，也繼續本地清除
          }
        }
        
        // 重置所有狀態到初始值
        set({
          currentUser: null,
          isAuthenticated: false,
          gameRecords: [],
          userStats: getInitialStats(),
          achievements: DEFAULT_ACHIEVEMENTS.map(achievement => ({ ...achievement })),
          friends: [],
          isLoading: false
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
      const { currentUser, gameRecords } = get();
      if (!currentUser) return;

      const now = new Date();
      const newRecord: GameRecord = {
        id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser.id,
        createdAt: now,
        playedAt: now,
        ...recordData
      };

      const updatedRecords = [newRecord, ...gameRecords].slice(0, 100); // 保留最近100條記錄
      
      set({ gameRecords: updatedRecords });
      
      // 更新統計數據
      get().updateUserStats();
      
      // 檢查成就
      get().checkAchievements();
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

    // 設置用戶（用於Firebase認證狀態同步）
    setUser: (user: User) => {
      set({
        currentUser: user,
        isAuthenticated: true,
        isLoading: false
      });
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
      friends: state.friends
    }),
    onRehydrateStorage: () => {
      // 檢查是否有登出標記
      const logoutFlag = localStorage.getItem('tetris-logout-flag');
      const sessionLogoutFlag = sessionStorage.getItem('tetris-logout-flag');
      
      if (logoutFlag === 'true' || sessionLogoutFlag === 'true') {
        // 清除所有登出標記和用戶數據
        localStorage.removeItem('tetris-logout-flag');
        sessionStorage.removeItem('tetris-logout-flag');
        localStorage.removeItem('tetris-user-store');
        
        // 額外清除措施，針對TRAE SOLO內建瀏覽器
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.includes('tetris') || key.includes('user')) {
              localStorage.removeItem(key);
            }
          });
          
          Object.keys(sessionStorage).forEach(key => {
            if (key.includes('tetris') || key.includes('user')) {
              sessionStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.warn('清除存儲時出錯:', e);
        }
        
        // 返回一個函數來重置狀態
        return (state, error) => {
          try {
            // 強制重置為初始狀態，無論是否有錯誤
            const initialState = {
              currentUser: null,
              isAuthenticated: false,
              gameRecords: [],
              userStats: getInitialStats(),
              achievements: DEFAULT_ACHIEVEMENTS.map(achievement => ({ ...achievement })),
              friends: [],
              isLoading: false
            };
            
            useUserStore.setState(initialState);
            
            // 針對TRAE SOLO的額外重置措施
            setTimeout(() => {
              useUserStore.setState(initialState);
            }, 100);
            
          } catch (resetError) {
            console.error('重置狀態時出錯:', resetError);
            // 最後的保險措施
            try {
              window.location.reload();
            } catch (reloadError) {
              console.error('重新載入頁面失敗:', reloadError);
            }
          }
        };
      }
    }
  }
));