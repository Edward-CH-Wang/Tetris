import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { User, useUserStore } from './userStore';
import { GameState, useGameStore } from './gameStore';

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
    
    // 使用環境變數配置Socket.io服務器地址
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3001';
    const newSocket = io(socketUrl, {
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
      const { user } = useUserStore.getState();
      const currentPlayer = room.players.find(p => p.user.id === user?.id);
      set(state => ({
        gameState: {
          ...state.gameState,
          room,
          currentPlayer: currentPlayer || null,
          opponent: room.players.find(p => p.user.id !== user?.id) || null
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
      console.log('🚨 收到 room_left 事件 - 這會導致頁面跳轉!');
      console.log('調用堆棧:', new Error().stack);
      set(state => {
        console.log('room_left 事件處理前的狀態:', {
          hasRoom: !!state.gameState.room,
          roomId: state.gameState.room?.id,
          currentPlayer: state.gameState.currentPlayer?.user.name
        });
        
        const newState = {
          gameState: {
            ...state.gameState,
            room: null,
            currentPlayer: null,
            opponent: null
          }
        };
        
        console.log('room_left 事件處理後的狀態:', {
          hasRoom: !!newState.gameState.room,
          roomId: newState.gameState.room?.id
        });
        
        return newState;
      });
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
      console.log('收到玩家離開事件:', playerId);
      set(state => {
        console.log('處理玩家離開前的狀態:', {
          hasRoom: !!state.gameState.room,
          roomId: state.gameState.room?.id,
          players: state.gameState.room?.players?.map(p => ({ id: p.id, name: p.user.name }))
        });
        
        if (!state.gameState.room) {
          console.log('警告: 沒有房間狀態，忽略玩家離開事件');
          return state;
        }
        
        const leavingPlayer = state.gameState.room.players.find(p => p.id === playerId);
        console.log('離開的玩家:', leavingPlayer?.user.name);
        
        const updatedRoom = {
          ...state.gameState.room,
          players: state.gameState.room.players.filter(p => p.id !== playerId)
        };
        
        console.log('玩家離開後的房間狀態:', {
          roomId: updatedRoom.id,
          remainingPlayers: updatedRoom.players.map(p => p.user.name)
        });
        
        // 重新設置對手
        const { currentUser } = useUserStore.getState();
        const newOpponent = updatedRoom.players.find(p => p.user.id !== currentUser?.id) || null;
        
        return {
          gameState: {
            ...state.gameState,
            room: updatedRoom,
            opponent: newOpponent
          }
        };
      });
    });

    // 遊戲事件
    newSocket.on('game_started', (gameData: any) => {
      console.log('遊戲開始:', gameData);
      
      // 初始化並啟動遊戲邏輯
      const { initGame, startGame } = useGameStore.getState();
      initGame(); // 先初始化遊戲，生成方塊
      startGame(); // 然後開始遊戲
      
      console.log('遊戲邏輯已啟動');
      
      set(state => ({
        gameState: {
          ...state.gameState,
          gameStartTime: new Date(),
          room: state.gameState.room ? {
            ...state.gameState.room,
            gameStatus: 'playing'
          } : null
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

    // 玩家準備狀態變更事件
    newSocket.on('player_ready_changed', (data: { playerId: string; isReady: boolean }) => {
      console.log('收到玩家準備狀態變更事件:', data);
      set(state => {
        console.log('處理準備狀態變更前的狀態:', {
          hasRoom: !!state.gameState.room,
          roomId: state.gameState.room?.id,
          players: state.gameState.room?.players
        });
        
        if (!state.gameState.room) {
          console.log('警告: 沒有房間狀態，忽略準備狀態變更');
          return state;
        }
        
        const updatedPlayers = state.gameState.room.players.map(player => {
          if (player.id === data.playerId) {
            console.log(`更新玩家 ${player.user.name} 的準備狀態: ${player.isReady} -> ${data.isReady}`);
            return { ...player, isReady: data.isReady };
          }
          return player;
        });
        
        const updatedRoom = {
          ...state.gameState.room,
          players: updatedPlayers
        };
        
        const { currentUser } = useUserStore.getState();
        const currentPlayer = updatedPlayers.find(p => p.user.id === currentUser?.id);
        const opponent = updatedPlayers.find(p => p.user.id !== currentUser?.id);
        
        console.log('準備狀態變更後的新狀態:', {
          roomId: updatedRoom.id,
          currentPlayer: currentPlayer?.user.name,
          currentPlayerReady: currentPlayer?.isReady,
          opponent: opponent?.user.name,
          opponentReady: opponent?.isReady
        });
        
        return {
          gameState: {
            ...state.gameState,
            room: updatedRoom,
            currentPlayer: currentPlayer || state.gameState.currentPlayer,
            opponent: opponent || state.gameState.opponent
          }
        };
      });
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
          currentPlayer: player,
          opponent: room.players.find(p => p.id !== player.id) || null
        }
      }));
    });

    newSocket.on('match_searching', () => {
      console.log('開始搜索匹配');
      set({ 
        isSearching: true, 
        searchStartTime: new Date() 
      });
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
    
    const { currentUser } = useUserStore.getState();
    console.log('創建房間時的用戶信息:', currentUser);
    socket.emit('create_room', { name: roomName, user: currentUser });
  },

  // 加入房間
  joinRoom: (roomId: string) => {
    const { socket } = get();
    if (!socket?.connected) return;
    
    const { currentUser } = useUserStore.getState();
    console.log('加入房間時的用戶信息:', currentUser);
    socket.emit('join_room', { roomId, user: currentUser });
  },

  // 離開房間
  leaveRoom: () => {
    console.log('🚨 leaveRoom 函數被調用!');
    console.log('調用堆棧:', new Error().stack);
    
    const { socket, gameState } = get();
    console.log('leaveRoom 調用時的狀態:', {
      connected: socket?.connected,
      hasRoom: !!gameState.room,
      roomId: gameState.room?.id
    });
    
    if (!socket?.connected) {
      console.log('Socket未連接，無法離開房間');
      return;
    }
    
    console.log('發送 leave_room 事件到服務器');
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
    const { socket, gameState } = get();
    console.log('發送準備狀態變更:', {
      isReady,
      connected: socket?.connected,
      hasRoom: !!gameState.room,
      roomId: gameState.room?.id
    });
    
    if (!socket?.connected) {
      console.log('錯誤: Socket未連接，無法設置準備狀態');
      return;
    }
    
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
    
    const { currentUser } = useUserStore.getState();
    console.log('快速匹配時的用戶信息:', currentUser);
    socket.emit('quick_match', { user: currentUser });
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