import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { User } from './userStore';
import { GameState } from './gameStore';

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  gameStatus: 'waiting' | 'starting' | 'playing' | 'finished';
  createdAt: Date;
}

export interface Player {
  id: string;
  user: User;
  isReady: boolean;
  gameState?: Partial<GameState>;
  isHost: boolean;
  score: number;
  status: 'connected' | 'disconnected' | 'playing' | 'finished';
}

export interface MultiplayerGameState {
  room: Room | null;
  currentPlayer: Player | null;
  opponent: Player | null;
  gameStartTime: Date | null;
  gameEndTime: Date | null;
  winner: Player | null;
  spectators: User[];
}

export interface MultiplayerState {
  // Socket連接
  socket: Socket | null;
  isConnected: boolean;
  
  // 房間和遊戲狀態
  gameState: MultiplayerGameState;
  
  // 房間列表
  availableRooms: Room[];
  
  // 匹配狀態
  isSearching: boolean;
  searchStartTime: Date | null;
  
  // 連接狀態
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
}

export interface MultiplayerActions {
  // Socket連接管理
  connect: () => void;
  disconnect: () => void;
  
  // 房間管理
  createRoom: (roomName: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  getRoomList: () => void;
  
  // 遊戲控制
  setReady: (isReady: boolean) => void;
  startGame: () => void;
  sendGameUpdate: (gameState: Partial<GameState>) => void;
  
  // 快速匹配
  startQuickMatch: () => void;
  cancelQuickMatch: () => void;
  
  // 攻擊系統
  sendAttack: (linesCleared: number) => void;
  
  // 聊天系統
  sendMessage: (message: string) => void;
  
  // 重置狀態
  resetMultiplayerState: () => void;
}

type MultiplayerStore = MultiplayerState & MultiplayerActions;

const initialGameState: MultiplayerGameState = {
  room: null,
  currentPlayer: null,
  opponent: null,
  gameStartTime: null,
  gameEndTime: null,
  winner: null,
  spectators: []
};

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  // 初始狀態
  socket: null,
  isConnected: false,
  gameState: initialGameState,
  availableRooms: [],
  isSearching: false,
  searchStartTime: null,
  connectionStatus: 'disconnected',
  error: null,

  // 連接到Socket服務器
  connect: () => {
    const { socket } = get();
    if (socket?.connected) return;

    set({ connectionStatus: 'connecting' });
    
    // 在實際部署時，這裡應該是你的Socket.io服務器地址
    const newSocket = io('ws://localhost:3001', {
      transports: ['websocket'],
      timeout: 5000
    });

    // 連接事件
    newSocket.on('connect', () => {
      console.log('Socket連接成功');
      set({ 
        socket: newSocket, 
        isConnected: true, 
        connectionStatus: 'connected',
        error: null 
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket連接斷開');
      set({ 
        isConnected: false, 
        connectionStatus: 'disconnected' 
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket連接錯誤:', error);
      set({ 
        connectionStatus: 'error',
        error: '無法連接到遊戲服務器'
      });
    });

    // 房間事件
    newSocket.on('room_created', (room: Room) => {
      console.log('房間創建成功:', room);
      set(state => ({
        gameState: {
          ...state.gameState,
          room
        }
      }));
    });

    newSocket.on('room_joined', (room: Room, player: Player) => {
      console.log('加入房間成功:', room, player);
      set(state => ({
        gameState: {
          ...state.gameState,
          room,
          currentPlayer: player,
          opponent: room.players.find(p => p.id !== player.id) || null
        }
      }));
    });

    newSocket.on('room_left', () => {
      console.log('離開房間');
      set(state => ({
        gameState: {
          ...state.gameState,
          room: null,
          currentPlayer: null,
          opponent: null
        }
      }));
    });

    newSocket.on('player_joined', (player: Player) => {
      console.log('玩家加入:', player);
      set(state => {
        if (!state.gameState.room) return state;
        
        const updatedRoom = {
          ...state.gameState.room,
          players: [...state.gameState.room.players, player]
        };
        
        return {
          gameState: {
            ...state.gameState,
            room: updatedRoom,
            opponent: player
          }
        };
      });
    });

    newSocket.on('player_left', (playerId: string) => {
      console.log('玩家離開:', playerId);
      set(state => {
        if (!state.gameState.room) return state;
        
        const updatedRoom = {
          ...state.gameState.room,
          players: state.gameState.room.players.filter(p => p.id !== playerId)
        };
        
        return {
          gameState: {
            ...state.gameState,
            room: updatedRoom,
            opponent: null
          }
        };
      });
    });

    // 遊戲事件
    newSocket.on('game_started', (gameData: any) => {
      console.log('遊戲開始:', gameData);
      set(state => ({
        gameState: {
          ...state.gameState,
          gameStartTime: new Date()
        }
      }));
    });

    newSocket.on('game_update', (playerId: string, gameState: Partial<GameState>) => {
      console.log('遊戲狀態更新:', playerId, gameState);
      set(state => {
        if (state.gameState.opponent?.id === playerId) {
          return {
            gameState: {
              ...state.gameState,
              opponent: {
                ...state.gameState.opponent,
                gameState
              }
            }
          };
        }
        return state;
      });
    });

    newSocket.on('game_ended', (winner: Player) => {
      console.log('遊戲結束:', winner);
      set(state => ({
        gameState: {
          ...state.gameState,
          gameEndTime: new Date(),
          winner
        }
      }));
    });

    newSocket.on('attack_received', (attackData: any) => {
      console.log('收到攻擊:', attackData);
      // 這裡可以觸發攻擊效果，比如添加垃圾行
    });

    // 房間列表事件
    newSocket.on('room_list', (rooms: Room[]) => {
      set({ availableRooms: rooms });
    });

    // 快速匹配事件
    newSocket.on('match_found', (room: Room, player: Player) => {
      console.log('找到匹配:', room, player);
      set(state => ({
        isSearching: false,
        searchStartTime: null,
        gameState: {
          ...state.gameState,
          room,
          currentPlayer: player
        }
      }));
    });

    newSocket.on('match_cancelled', () => {
      console.log('匹配取消');
      set({ 
        isSearching: false, 
        searchStartTime: null 
      });
    });

    set({ socket: newSocket });
  },

  // 斷開連接
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ 
        socket: null, 
        isConnected: false, 
        connectionStatus: 'disconnected',
        gameState: initialGameState
      });
    }
  },

  // 創建房間
  createRoom: (roomName: string) => {
    const { socket } = get();
    if (!socket?.connected) return;
    
    socket.emit('create_room', { name: roomName });
  },

  // 加入房間
  joinRoom: (roomId: string) => {
    const { socket } = get();
    if (!socket?.connected) return;
    
    socket.emit('join_room', { roomId });
  },

  // 離開房間
  leaveRoom: () => {
    const { socket } = get();
    if (!socket?.connected) return;
    
    socket.emit('leave_room');
  },

  // 獲取房間列表
  getRoomList: () => {
    const { socket } = get();
    if (!socket?.connected) return;
    
    socket.emit('get_room_list');
  },

  // 設置準備狀態
  setReady: (isReady: boolean) => {
    const { socket } = get();
    if (!socket?.connected) return;
    
    socket.emit('set_ready', { isReady });
  },

  // 開始遊戲
  startGame: () => {
    const { socket } = get();
    if (!socket?.connected) return;
    
    socket.emit('start_game');
  },

  // 發送遊戲狀態更新
  sendGameUpdate: (gameState: Partial<GameState>) => {
    const { socket } = get();
    if (!socket?.connected) return;
    
    socket.emit('game_update', gameState);
  },

  // 開始快速匹配
  startQuickMatch: () => {
    const { socket } = get();
    if (!socket?.connected) return;
    
    socket.emit('quick_match');
    set({ 
      isSearching: true, 
      searchStartTime: new Date() 
    });
  },

  // 取消快速匹配
  cancelQuickMatch: () => {
    const { socket } = get();
    if (!socket?.connected) return;
    
    socket.emit('cancel_match');
    set({ 
      isSearching: false, 
      searchStartTime: null 
    });
  },

  // 發送攻擊
  sendAttack: (linesCleared: number) => {
    const { socket } = get();
    if (!socket?.connected || linesCleared < 2) return;
    
    // 根據消除行數計算攻擊強度
    const attackLines = linesCleared === 2 ? 1 : linesCleared === 3 ? 2 : 4;
    
    socket.emit('send_attack', { lines: attackLines });
  },

  // 發送聊天消息
  sendMessage: (message: string) => {
    const { socket } = get();
    if (!socket?.connected) return;
    
    socket.emit('chat_message', { message });
  },

  // 重置多人遊戲狀態
  resetMultiplayerState: () => {
    set({
      gameState: initialGameState,
      availableRooms: [],
      isSearching: false,
      searchStartTime: null,
      error: null
    });
  }
}));