import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  setDoc,
  getDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// 排行榜條目接口
export interface LeaderboardEntry {
  id: string;
  userId: string;
  name: string;
  displayName: string;
  avatar: string | null;
  score: number;
  level: number;
  lines: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  totalGames?: number;
  rank: number;
  gameType: 'single' | 'multiplayer';
  category: 'score' | 'level' | 'lines' | 'wins' | 'winRate';
  createdAt: Date;
  updatedAt: Date;
}

// Firestore 集合名稱
const COLLECTIONS = {
  LEADERBOARD: 'leaderboard',
  USER_BEST_SCORES: 'userBestScores'
};

// 排行榜服務
export const leaderboardService = {
  // 獲取排行榜數據
  async getLeaderboard(
    gameType: 'single' | 'multiplayer',
    limitCount: number = 100,
    category: string = 'score'
  ): Promise<LeaderboardEntry[]> {
    try {
      const leaderboardRef = collection(db, COLLECTIONS.LEADERBOARD);
      const q = query(
        leaderboardRef,
        where('gameType', '==', gameType),
        where('category', '==', category),
        orderBy(category === 'winRate' ? 'winRate' : category, 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const totalGames = (data.wins || 0) + (data.losses || 0);
        const entry: LeaderboardEntry = {
          id: doc.id,
          userId: data.userId || '',
          name: data.name || '',
          displayName: data.name || '',
          avatar: data.avatar || null,
          score: data.score || 0,
          level: data.level || 0,
          lines: data.lines || 0,
          wins: data.wins || 0,
          losses: data.losses || 0,
          winRate: data.winRate || 0,
          totalGames,
          rank: entries.length + 1,
          gameType: data.gameType || gameType,
          category: data.category || category,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
        entries.push(entry);
      });
      
      return entries;
    } catch (error) {
      console.error('獲取排行榜失敗:', error);
      return [];
    }
  },

  // 更新用戶最佳成績
  async updateUserBestScore(
    userId: string,
    userName: string,
    userAvatar: string | null,
    gameData: {
      score: number;
      level: number;
      lines: number;
      gameType: 'single' | 'multiplayer';
      wins?: number;
      losses?: number;
    }
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date();
      
      // 更新用戶最佳成績記錄
      const userBestRef = doc(db, COLLECTIONS.USER_BEST_SCORES, userId);
      const userBestSnap = await getDoc(userBestRef);
      
      let shouldUpdateLeaderboard = false;
      let currentBest = {
        score: 0,
        level: 0,
        lines: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      };
      
      if (userBestSnap.exists()) {
        const data = userBestSnap.data();
        currentBest = {
          score: data.score || 0,
          level: data.level || 0,
          lines: data.lines || 0,
          wins: data.wins || 0,
          losses: data.losses || 0,
          winRate: data.winRate || 0
        };
      }
      
      // 檢查是否需要更新各項記錄
      const newBest = { ...currentBest };
      
      if (gameData.score > currentBest.score) {
        newBest.score = gameData.score;
        shouldUpdateLeaderboard = true;
      }
      
      if (gameData.level > currentBest.level) {
        newBest.level = gameData.level;
        shouldUpdateLeaderboard = true;
      }
      
      if (gameData.lines > currentBest.lines) {
        newBest.lines = gameData.lines;
        shouldUpdateLeaderboard = true;
      }
      
      if (gameData.gameType === 'multiplayer' && gameData.wins !== undefined && gameData.losses !== undefined) {
        const totalGames = gameData.wins + gameData.losses;
        const newWinRate = totalGames > 0 ? (gameData.wins / totalGames) * 100 : 0;
        
        if (gameData.wins > currentBest.wins) {
          newBest.wins = gameData.wins;
          shouldUpdateLeaderboard = true;
        }
        
        if (newWinRate > currentBest.winRate) {
          newBest.winRate = newWinRate;
          newBest.losses = gameData.losses;
          shouldUpdateLeaderboard = true;
        }
      }
      
      // 更新用戶最佳成績
      batch.set(userBestRef, {
        ...newBest,
        userId,
        name: userName,
        avatar: userAvatar,
        gameType: gameData.gameType,
        updatedAt: now
      }, { merge: true });
      
      // 如果有新記錄，更新排行榜
      if (shouldUpdateLeaderboard) {
        const categories = gameData.gameType === 'single' 
          ? ['score', 'level', 'lines']
          : ['wins', 'winRate'];
        
        for (const category of categories) {
          const leaderboardRef = doc(db, COLLECTIONS.LEADERBOARD, `${userId}_${gameData.gameType}_${category}`);
          
          let value = 0;
          switch (category) {
            case 'score':
              value = newBest.score;
              break;
            case 'level':
              value = newBest.level;
              break;
            case 'lines':
              value = newBest.lines;
              break;
            case 'wins':
              value = newBest.wins;
              break;
            case 'winRate':
              value = newBest.winRate;
              break;
          }
          
          batch.set(leaderboardRef, {
            userId,
            name: userName,
            avatar: userAvatar,
            score: newBest.score,
            level: newBest.level,
            lines: newBest.lines,
            wins: newBest.wins,
            losses: newBest.losses,
            winRate: newBest.winRate,
            gameType: gameData.gameType,
            category,
            [category]: value,
            createdAt: userBestSnap.exists() ? userBestSnap.data()?.createdAt || now : now,
            updatedAt: now
          });
        }
      }
      
      await batch.commit();
    } catch (error) {
      console.error('更新用戶最佳成績失敗:', error);
      throw error;
    }
  },

  // 獲取用戶在排行榜中的排名
  async getUserRank(
    userId: string,
    gameType: 'single' | 'multiplayer',
    category: string
  ): Promise<number | null> {
    try {
      const leaderboardRef = collection(db, COLLECTIONS.LEADERBOARD);
      const userDocId = `${userId}_${gameType}_${category}`;
      const userDoc = await getDoc(doc(db, COLLECTIONS.LEADERBOARD, userDocId));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      const userValue = userData[category] || 0;
      
      // 查詢比用戶成績更好的記錄數量
      const q = query(
        leaderboardRef,
        where('gameType', '==', gameType),
        where('category', '==', category),
        where(category, '>', userValue)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size + 1; // 排名從1開始
    } catch (error) {
      console.error('獲取用戶排名失敗:', error);
      return null;
    }
  },

  // 搜索玩家
  async searchPlayers(
    searchTerm: string,
    gameType: 'single' | 'multiplayer',
    category: string,
    limitCount: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      const leaderboardRef = collection(db, COLLECTIONS.LEADERBOARD);
      const q = query(
        leaderboardRef,
        where('gameType', '==', gameType),
        where('category', '==', category),
        orderBy(category === 'winRate' ? 'winRate' : category, 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // 客戶端過濾（Firestore 不支持複雜的文本搜索）
        if (data.name && data.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          const totalGames = (data.wins || 0) + (data.losses || 0);
          const entry: LeaderboardEntry = {
            id: doc.id,
            userId: data.userId || '',
            name: data.name || '',
            displayName: data.name || '',
            avatar: data.avatar || null,
            score: data.score || 0,
            level: data.level || 0,
            lines: data.lines || 0,
            wins: data.wins || 0,
            losses: data.losses || 0,
            winRate: data.winRate || 0,
            totalGames,
            rank: entries.length + 1,
            gameType: data.gameType || gameType,
            category: data.category || category,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
          entries.push(entry);
        }
      });
      
      return entries;
    } catch (error) {
      console.error('搜索玩家失敗:', error);
      return [];
    }
  }
};

// 檢查排行榜連接狀態
export const checkLeaderboardConnection = async (): Promise<boolean> => {
  try {
    const testRef = collection(db, COLLECTIONS.LEADERBOARD);
    const q = query(testRef, limit(1));
    await getDocs(q);
    return true;
  } catch (error) {
    console.error('排行榜連接失敗:', error);
    return false;
  }
};