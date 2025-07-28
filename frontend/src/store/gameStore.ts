import { create } from 'zustand';
import { leaderboardService } from '../lib/leaderboard';

// 俄羅斯方塊形狀定義
export const TETRIS_SHAPES = {
  I: [
    [1, 1, 1, 1]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1]
  ]
};

export type TetrominoType = keyof typeof TETRIS_SHAPES;

export interface Tetromino {
  shape: number[][];
  type: TetrominoType;
  x: number;
  y: number;
  color: string;
}

export interface GameState {
  // 遊戲板狀態 (20x10)
  board: number[][];
  // 當前方塊
  currentPiece: Tetromino | null;
  // 下一個方塊
  nextPiece: Tetromino | null;
  // 預覽方塊隊列
  nextPieces: Tetromino[];
  // 分數
  score: number;
  // 等級
  level: number;
  // 消除的行數
  lines: number;
  // 遊戲狀態
  gameStatus: 'idle' | 'playing' | 'paused' | 'gameOver';
  // 下降速度 (毫秒)
  dropSpeed: number;
}

export interface GameActions {
  // 初始化遊戲
  initGame: () => void;
  // 開始遊戲
  startGame: () => void;
  // 暫停遊戲
  pauseGame: () => void;
  // 恢復遊戲
  resumeGame: () => void;
  // 結束遊戲
  gameOver: () => void;
  // 移動方塊
  movePiece: (direction: 'left' | 'right' | 'down') => void;
  // 旋轉方塊
  rotatePiece: () => void;
  // 硬降
  hardDrop: () => void;
  // 更新分數
  updateScore: (linesCleared: number) => void;
  // 生成新方塊
  generateNewPiece: () => void;
  // 檢查碰撞
  checkCollision: (piece: Tetromino, board: number[][]) => boolean;
  // 放置方塊
  placePiece: () => void;
  // 清除滿行
  clearLines: () => number;
}

type GameStore = GameState & GameActions;

// 方塊顏色映射
const PIECE_COLORS = {
  I: '#00f5ff',
  O: '#ffff00',
  T: '#800080',
  S: '#00ff00',
  Z: '#ff0000',
  J: '#0000ff',
  L: '#ffa500'
};

// 創建空的遊戲板
const createEmptyBoard = (): number[][] => {
  return Array(20).fill(null).map(() => Array(10).fill(0));
};

// 生成隨機方塊
const generateRandomPiece = (): Tetromino => {
  const types = Object.keys(TETRIS_SHAPES) as TetrominoType[];
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  return {
    shape: TETRIS_SHAPES[randomType],
    type: randomType,
    x: Math.floor(10 / 2) - Math.floor(TETRIS_SHAPES[randomType][0].length / 2),
    y: 0,
    color: PIECE_COLORS[randomType]
  };
};

// 旋轉矩陣
const rotateMatrix = (matrix: number[][]): number[][] => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      rotated[j][rows - 1 - i] = matrix[i][j];
    }
  }
  
  return rotated;
};

// 生成多個預覽方塊
const generateNextPieces = (count: number): Tetromino[] => {
  return Array(count).fill(null).map(() => generateRandomPiece());
};

export const useGameStore = create<GameStore>((set, get) => ({
  // 初始狀態
  board: createEmptyBoard(),
  currentPiece: null,
  nextPiece: null,
  nextPieces: [],
  score: 0,
  level: 1,
  lines: 0,
  gameStatus: 'idle',
  dropSpeed: 1000,

  // 初始化遊戲
  initGame: () => {
    // 從localStorage讀取設定，獲取預覽方塊數量
    const savedSettings = localStorage.getItem('tetris-settings');
    let nextPieceCount = 3; // 默認3個
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        nextPieceCount = settings.nextPieceCount || 3;
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    
    const firstPiece = generateRandomPiece();
    const nextPieces = generateNextPieces(nextPieceCount);
    
    set({
      board: createEmptyBoard(),
      currentPiece: firstPiece,
      nextPiece: nextPieces[0] || null,
      nextPieces: nextPieces,
      score: 0,
      level: 1,
      lines: 0,
      gameStatus: 'idle',
      dropSpeed: 1000
    });
  },

  // 開始遊戲
  startGame: () => {
    set({ gameStatus: 'playing' });
  },

  // 暫停遊戲
  pauseGame: () => {
    set({ gameStatus: 'paused' });
  },

  // 恢復遊戲
  resumeGame: () => {
    set({ gameStatus: 'playing' });
  },

  // 結束遊戲
  gameOver: async () => {
    const { score, level, lines } = get();
    set({ gameStatus: 'gameOver' });
    
    // 嘗試更新排行榜（如果用戶已登入）
    try {
      // 這裡需要從 userStore 獲取用戶信息
      const userStore = (window as any).userStore;
      if (userStore && userStore.getState && userStore.getState().isAuthenticated) {
        const { currentUser } = userStore.getState();
        if (currentUser) {
          await leaderboardService.updateUserBestScore(
            currentUser.id,
            currentUser.name,
            currentUser.avatar,
            {
              score,
              level,
              lines,
              gameType: 'single'
            }
          );
        }
      }
    } catch (error) {
      console.error('更新排行榜失敗:', error);
    }
  },

  // 檢查碰撞
  checkCollision: (piece: Tetromino, board: number[][]) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x;
          const newY = piece.y + y;
          
          // 檢查邊界
          if (newX < 0 || newX >= 10 || newY >= 20) {
            return true;
          }
          
          // 檢查是否與已放置的方塊碰撞
          if (newY >= 0 && board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  },

  // 移動方塊
  movePiece: (direction: 'left' | 'right' | 'down') => {
    const { currentPiece, board, checkCollision } = get();
    if (!currentPiece) return;

    let newX = currentPiece.x;
    let newY = currentPiece.y;

    switch (direction) {
      case 'left':
        newX -= 1;
        break;
      case 'right':
        newX += 1;
        break;
      case 'down':
        newY += 1;
        break;
    }

    const newPiece = { ...currentPiece, x: newX, y: newY };
    
    if (!checkCollision(newPiece, board)) {
      set({ currentPiece: newPiece });
    } else if (direction === 'down') {
      // 如果向下移動碰撞，則放置方塊
      get().placePiece();
    }
  },

  // 旋轉方塊
  rotatePiece: () => {
    const { currentPiece, board, checkCollision } = get();
    if (!currentPiece) return;

    const rotatedShape = rotateMatrix(currentPiece.shape);
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };
    
    if (!checkCollision(rotatedPiece, board)) {
      set({ currentPiece: rotatedPiece });
    }
  },

  // 硬降
  hardDrop: () => {
    const { currentPiece, board, checkCollision } = get();
    if (!currentPiece) return;

    let newY = currentPiece.y;
    let testPiece = { ...currentPiece };
    
    while (!checkCollision({ ...testPiece, y: newY + 1 }, board)) {
      newY++;
    }
    
    set({ currentPiece: { ...currentPiece, y: newY } });
    get().placePiece();
  },

  // 放置方塊
  placePiece: () => {
    const { currentPiece, nextPieces, board } = get();
    if (!currentPiece) return;

    // 將當前方塊添加到遊戲板
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = 1;
          }
        }
      }
    }

    // 檢查遊戲結束
    if (currentPiece.y <= 0) {
      get().gameOver();
      return;
    }

    // 先更新board，然後清除滿行
    set({ board: newBoard });
    const linesCleared = get().clearLines();
    get().updateScore(linesCleared);

    // 更新預覽方塊隊列
    const newNextPieces = [...nextPieces.slice(1), generateRandomPiece()];
    
    set({
      currentPiece: nextPieces[0] || null,
      nextPiece: newNextPieces[0] || null,
      nextPieces: newNextPieces
    });
  },

  // 清除滿行
  clearLines: () => {
    const { board } = get();
    const newBoard = board.filter(row => row.some(cell => cell === 0));
    const linesCleared = 20 - newBoard.length;
    
    // 在頂部添加新的空行
    while (newBoard.length < 20) {
      newBoard.unshift(Array(10).fill(0));
    }
    
    set({ board: newBoard });
    return linesCleared;
  },

  // 更新分數
  updateScore: (linesCleared: number) => {
    const { score, level, lines } = get();
    
    if (linesCleared > 0) {
      const points = [0, 40, 100, 300, 1200][linesCleared] * level;
      const newLines = lines + linesCleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      const newDropSpeed = Math.max(50, 1000 - (newLevel - 1) * 50);
      
      set({
        score: score + points,
        lines: newLines,
        level: newLevel,
        dropSpeed: newDropSpeed
      });
    }
  },

  // 生成新方塊
  generateNewPiece: () => {
    const newPiece = generateRandomPiece();
    set({ nextPiece: newPiece });
  }
}));