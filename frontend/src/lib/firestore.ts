import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { GameRecord, UserStats, Achievement } from '../store/userStore';
import { fixTimestamps, toMsSafe } from '../utils/timestamps';

// Firestore 集合名稱
const COLLECTIONS = {
  USERS: 'users',
  GAME_RECORDS: 'gameRecords',
  USER_STATS: 'userStats',
  ACHIEVEMENTS: 'achievements'
};

// 用戶數據接口
export interface FirestoreUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  isGuest: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

// 用戶數據操作
export const firestoreUserService = {
  // 創建或更新用戶資料
  async createOrUpdateUser(user: FirestoreUser): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.id);
      await setDoc(userRef, {
        ...user,
        lastLoginAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('創建/更新用戶失敗:', error);
      throw error;
    }
  },

  // 獲取用戶資料
  async getUser(userId: string): Promise<FirestoreUser | null> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = fixTimestamps(userSnap.data());
        return {
          ...data,
          createdAt: data.createdAt || new Date(),
          lastLoginAt: data.lastLoginAt || new Date()
        } as FirestoreUser;
      }
      return null;
    } catch (error) {
      console.error('獲取用戶資料失敗:', error);
      return null;
    }
  }
};

// 遊戲記錄操作
export const firestoreGameRecordService = {
  // 添加遊戲記錄
  async addGameRecord(userId: string, record: Omit<GameRecord, 'id' | 'userId'>): Promise<string> {
    try {
      const recordsRef = collection(db, COLLECTIONS.GAME_RECORDS);
      const docRef = await addDoc(recordsRef, {
        ...record,
        userId,
        createdAt: new Date(),
        playedAt: record.playedAt || new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('添加遊戲記錄失敗:', error);
      throw error;
    }
  },

  // 獲取用戶遊戲記錄
  async getUserGameRecords(userId: string, limitCount: number = 100): Promise<GameRecord[]> {
    try {
      console.log('🔍 [DEBUG] 開始查詢用戶遊戲記錄:', { userId, limitCount });
      
      const recordsRef = collection(db, COLLECTIONS.GAME_RECORDS);
      
      // 使用簡單查詢避免複合索引需求
      const q = query(
        recordsRef,
        where('userId', '==', userId),
        limit(limitCount * 2) // 獲取更多記錄以便客戶端排序
      );
      
      const querySnapshot = await getDocs(q);
      const records: GameRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = fixTimestamps(doc.data());
        records.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt || new Date(),
          playedAt: data.playedAt || new Date()
        } as GameRecord);
      });
      
      // 在客戶端進行排序和限制
      const sortedRecords = records
        .sort((a, b) => toMsSafe(b.playedAt) - toMsSafe(a.playedAt))
        .slice(0, limitCount);
      
      console.log('✅ [DEBUG] 遊戲記錄查詢成功:', { 
        totalFound: records.length, 
        returned: sortedRecords.length 
      });
      
      return sortedRecords;
    } catch (error) {
      console.error('❌ [DEBUG] 獲取遊戲記錄失敗:', error);
      
      // 提供降級方案：如果查詢失敗，嘗試不使用任何排序
      try {
        console.log('🔄 [DEBUG] 嘗試降級查詢...');
        const recordsRef = collection(db, COLLECTIONS.GAME_RECORDS);
        const simpleQuery = query(
          recordsRef,
          where('userId', '==', userId)
        );
        
        const querySnapshot = await getDocs(simpleQuery);
        const records: GameRecord[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = fixTimestamps(doc.data());
          records.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt || new Date(),
            playedAt: data.playedAt || new Date()
          } as GameRecord);
        });
        
        // 客戶端排序
        const sortedRecords = records
          .sort((a, b) => toMsSafe(b.playedAt) - toMsSafe(a.playedAt))
          .slice(0, limitCount);
        
        console.log('✅ [DEBUG] 降級查詢成功:', { 
          totalFound: records.length, 
          returned: sortedRecords.length 
        });
        
        return sortedRecords;
      } catch (fallbackError) {
        console.error('❌ [DEBUG] 降級查詢也失敗:', fallbackError);
        return [];
      }
    }
  },

  // 刪除用戶所有遊戲記錄
  async deleteUserGameRecords(userId: string): Promise<void> {
    try {
      const recordsRef = collection(db, COLLECTIONS.GAME_RECORDS);
      const q = query(recordsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('刪除遊戲記錄失敗:', error);
      throw error;
    }
  }
};

// 用戶統計操作
export const firestoreUserStatsService = {
  // 更新用戶統計
  async updateUserStats(userId: string, stats: UserStats): Promise<void> {
    try {
      const statsRef = doc(db, COLLECTIONS.USER_STATS, userId);
      await setDoc(statsRef, {
        ...stats,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('更新用戶統計失敗:', error);
      throw error;
    }
  },

  // 獲取用戶統計
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const statsRef = doc(db, COLLECTIONS.USER_STATS, userId);
      const statsSnap = await getDoc(statsRef);
      
      if (statsSnap.exists()) {
        const data = fixTimestamps(statsSnap.data());
        return {
          totalGames: data.totalGames || 0,
          totalWins: data.totalWins || 0,
          totalLosses: data.totalLosses || 0,
          highestScore: data.highestScore || 0,
          averageScore: data.averageScore || 0,
          totalPlayTime: data.totalPlayTime || 0,
          winRate: data.winRate || 0,
          currentStreak: data.currentStreak || 0,
          bestStreak: data.bestStreak || 0
        };
      }
      return null;
    } catch (error) {
      console.error('獲取用戶統計失敗:', error);
      return null;
    }
  }
};

// 成就操作
export const firestoreAchievementService = {
  // 更新用戶成就
  async updateUserAchievements(userId: string, achievements: Achievement[]): Promise<void> {
    try {
      const achievementsRef = doc(db, COLLECTIONS.ACHIEVEMENTS, userId);
      await setDoc(achievementsRef, {
        achievements,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('更新用戶成就失敗:', error);
      throw error;
    }
  },

  // 獲取用戶成就
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const achievementsRef = doc(db, COLLECTIONS.ACHIEVEMENTS, userId);
      const achievementsSnap = await getDoc(achievementsRef);
      
      if (achievementsSnap.exists()) {
        const data = fixTimestamps(achievementsSnap.data());
        return data.achievements?.map((achievement: any) => ({
          ...achievement,
          unlockedAt: achievement.unlockedAt || null
        })) || [];
      }
      return [];
    } catch (error) {
      console.error('獲取用戶成就失敗:', error);
      return [];
    }
  }
};

// 綜合數據同步服務
export const firestoreDataSyncService = {
  // 同步所有用戶數據到雲端
  async syncUserDataToCloud(userId: string, userData: {
    gameRecords: GameRecord[];
    userStats: UserStats;
    achievements: Achievement[];
  }): Promise<void> {
    try {
      // 同步統計數據
      await firestoreUserStatsService.updateUserStats(userId, userData.userStats);
      
      // 同步成就數據
      await firestoreAchievementService.updateUserAchievements(userId, userData.achievements);
      
      // 同步遊戲記錄（只同步最新的記錄，避免重複）
      const existingRecords = await firestoreGameRecordService.getUserGameRecords(userId, 10);
      const existingIds = new Set(existingRecords.map(r => r.id));
      
      for (const record of userData.gameRecords.slice(0, 10)) {
        if (!existingIds.has(record.id)) {
          await firestoreGameRecordService.addGameRecord(userId, {
            gameType: record.gameType,
            score: record.score,
            level: record.level,
            lines: record.lines,
            duration: record.duration,
            result: record.result,
            createdAt: record.createdAt,
            playedAt: record.playedAt
          });
        }
      }
    } catch (error) {
      console.error('同步用戶數據到雲端失敗:', error);
      throw error;
    }
  },

  // 從雲端載入所有用戶數據
  async loadUserDataFromCloud(userId: string): Promise<{
    gameRecords: GameRecord[];
    userStats: UserStats;
    achievements: Achievement[];
  } | null> {
    try {
      const [gameRecords, userStats, achievements] = await Promise.all([
        firestoreGameRecordService.getUserGameRecords(userId),
        firestoreUserStatsService.getUserStats(userId),
        firestoreAchievementService.getUserAchievements(userId)
      ]);

      return {
        gameRecords: gameRecords || [],
        userStats: userStats || {
          totalGames: 0,
          totalWins: 0,
          totalLosses: 0,
          highestScore: 0,
          averageScore: 0,
          totalPlayTime: 0,
          winRate: 0,
          currentStreak: 0,
          bestStreak: 0
        },
        achievements: achievements || []
      };
    } catch (error) {
      console.error('從雲端載入用戶數據失敗:', error);
      return null;
    }
  }
};

// 檢查 Firestore 連接狀態
export const checkFirestoreConnection = async (): Promise<boolean> => {
  try {
    // 嘗試讀取一個測試文檔
    const testRef = doc(db, 'test', 'connection');
    await getDoc(testRef);
    return true;
  } catch (error) {
    console.error('Firestore 連接失敗:', error);
    return false;
  }
};