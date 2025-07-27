import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

// 創建HTTP服務器
const httpServer = createServer(app);

// 創建Socket.IO服務器
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://tetris-multiplayer.zeabur.app", "https://*.zeabur.app"] // Zeabur前端域名
      : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    methods: ["GET", "POST"]
  }
});

// 遊戲狀態管理
const rooms = new Map();
const players = new Map();
const matchQueue = [];

// 房間類
class Room {
  constructor(id, name, hostId) {
    this.id = id;
    this.name = name;
    this.hostId = hostId;
    this.players = [];
    this.maxPlayers = 2;
    this.gameStatus = 'waiting';
    this.createdAt = new Date();
  }

  addPlayer(player) {
    if (this.players.length < this.maxPlayers) {
      this.players.push(player);
      return true;
    }
    return false;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    if (this.players.length === 0) {
      rooms.delete(this.id);
    } else if (this.hostId === playerId && this.players.length > 0) {
      this.hostId = this.players[0].id;
    }
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  canStart() {
    return this.players.length === 2 && this.players.every(p => p.isReady);
  }
}

// 玩家類
class Player {
  constructor(id, user, socketId) {
    this.id = id;
    this.user = user;
    this.socketId = socketId;
    this.isReady = false;
    this.gameState = null;
    this.isHost = false;
    this.score = 0;
    this.status = 'connected';
  }
}

// 生成房間ID
function generateRoomId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Socket.IO連接處理
io.on('connection', (socket) => {
  console.log('用戶連接:', socket.id);

  // 創建房間
  socket.on('create_room', (data) => {
    const { name, user } = data;
    const roomId = generateRoomId();
    const room = new Room(roomId, name, socket.id);
    
    const player = new Player(socket.id, user, socket.id);
    player.isHost = true;
    
    room.addPlayer(player);
    rooms.set(roomId, room);
    players.set(socket.id, { player, roomId });
    
    socket.join(roomId);
    
    socket.emit('room_created', {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      players: room.players,
      maxPlayers: room.maxPlayers,
      gameStatus: room.gameStatus,
      createdAt: room.createdAt
    });
    
    console.log(`房間創建: ${roomId} by ${socket.id}`);
  });

  // 加入房間
  socket.on('join_room', (data) => {
    const { roomId, user } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: '房間不存在' });
      return;
    }
    
    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', { message: '房間已滿' });
      return;
    }
    
    const player = new Player(socket.id, user, socket.id);
    room.addPlayer(player);
    players.set(socket.id, { player, roomId });
    
    socket.join(roomId);
    
    // 通知房間內所有玩家
    io.to(roomId).emit('player_joined', player);
    
    socket.emit('room_joined', {
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      players: room.players,
      maxPlayers: room.maxPlayers,
      gameStatus: room.gameStatus,
      createdAt: room.createdAt
    }, player);
    
    console.log(`玩家 ${socket.id} 加入房間 ${roomId}`);
  });

  // 離開房間
  socket.on('leave_room', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const { roomId } = playerData;
    const room = rooms.get(roomId);
    
    if (room) {
      room.removePlayer(socket.id);
      socket.leave(roomId);
      
      // 通知其他玩家
      socket.to(roomId).emit('player_left', socket.id);
      
      socket.emit('room_left');
    }
    
    players.delete(socket.id);
    console.log(`玩家 ${socket.id} 離開房間 ${roomId}`);
  });

  // 獲取房間列表
  socket.on('get_room_list', () => {
    const roomList = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      players: room.players,
      maxPlayers: room.maxPlayers,
      gameStatus: room.gameStatus,
      createdAt: room.createdAt
    }));
    
    socket.emit('room_list', roomList);
  });

  // 設置準備狀態
  socket.on('set_ready', (data) => {
    const { isReady } = data;
    console.log(`收到準備狀態設置請求: 玩家 ${socket.id}, 狀態: ${isReady}`);
    
    const playerData = players.get(socket.id);
    
    if (!playerData) {
      console.log(`錯誤: 玩家 ${socket.id} 不在任何房間中`);
      return;
    }
    
    const { player, roomId } = playerData;
    const room = rooms.get(roomId);
    
    if (!room) {
      console.log(`錯誤: 房間 ${roomId} 不存在`);
      return;
    }
    
    console.log(`更新玩家準備狀態: ${player.user.name} (${socket.id}) 在房間 ${roomId} 中設置為 ${isReady}`);
    player.isReady = isReady;
    
    // 通知房間內所有玩家
    io.to(roomId).emit('player_ready_changed', {
      playerId: socket.id,
      isReady
    });
    
    console.log(`已廣播準備狀態變更到房間 ${roomId}`);
  });

  // 開始遊戲
  socket.on('start_game', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const { roomId } = playerData;
    const room = rooms.get(roomId);
    
    if (!room || room.hostId !== socket.id) {
      socket.emit('error', { message: '只有房主可以開始遊戲' });
      return;
    }
    
    if (!room.canStart()) {
      socket.emit('error', { message: '所有玩家必須準備就緒才能開始遊戲' });
      return;
    }
    
    room.gameStatus = 'playing';
    
    // 通知房間內所有玩家遊戲開始
    io.to(roomId).emit('game_started', {
      roomId,
      startTime: new Date()
    });
    
    console.log(`房間 ${roomId} 遊戲開始`);
  });

  // 遊戲狀態更新
  socket.on('game_update', (gameState) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;
    
    const { player, roomId } = playerData;
    player.gameState = gameState;
    
    // 廣播給房間內其他玩家
    socket.to(roomId).emit('game_update', socket.id, gameState);
  });

  // 發送攻擊
  socket.on('send_attack', (data) => {
    const { lines } = data;
    const playerData = players.get(socket.id);
    
    if (!playerData) return;
    
    const { roomId } = playerData;
    
    // 發送攻擊給對手
    socket.to(roomId).emit('attack_received', {
      lines,
      fromPlayer: socket.id
    });
    
    console.log(`玩家 ${socket.id} 發送攻擊: ${lines} 行`);
  });

  // 遊戲結束
  socket.on('game_finished', (data) => {
    const { score } = data;
    const playerData = players.get(socket.id);
    
    if (!playerData) return;
    
    const { player, roomId } = playerData;
    const room = rooms.get(roomId);
    
    if (room) {
      player.score = score;
      player.status = 'finished';
      
      // 檢查是否所有玩家都完成了
      const finishedPlayers = room.players.filter(p => p.status === 'finished');
      
      if (finishedPlayers.length === room.players.length) {
        // 確定勝利者
        const winner = room.players.reduce((prev, current) => 
          (prev.score > current.score) ? prev : current
        );
        
        room.gameStatus = 'finished';
        
        // 通知所有玩家遊戲結束
        io.to(roomId).emit('game_ended', winner);
        
        console.log(`房間 ${roomId} 遊戲結束，勝利者: ${winner.id}`);
      }
    }
  });

  // 快速匹配
  socket.on('quick_match', (data) => {
    const user = data?.user || { id: socket.id, name: `玩家${socket.id.slice(-4)}`, avatar: null };
    
    // 檢查是否已經在匹配隊列中
    const existingIndex = matchQueue.findIndex(item => item.socketId === socket.id);
    if (existingIndex !== -1) {
      return;
    }
    
    // 尋找匹配對手
    if (matchQueue.length > 0) {
      const opponent = matchQueue.shift();
      
      // 創建匹配房間
      const roomId = generateRoomId();
      const room = new Room(roomId, `快速匹配 ${roomId}`, socket.id);
      
      const player1 = new Player(socket.id, user, socket.id);
      player1.isHost = true;
      const player2 = new Player(opponent.socketId, opponent.user, opponent.socketId);
      
      room.addPlayer(player1);
      room.addPlayer(player2);
      rooms.set(roomId, room);
      
      players.set(socket.id, { player: player1, roomId });
      players.set(opponent.socketId, { player: player2, roomId });
      
      // 加入房間
      socket.join(roomId);
      io.sockets.sockets.get(opponent.socketId)?.join(roomId);
      
      // 通知匹配成功
      socket.emit('match_found', {
        id: room.id,
        name: room.name,
        hostId: room.hostId,
        players: room.players,
        maxPlayers: room.maxPlayers,
        gameStatus: room.gameStatus,
        createdAt: room.createdAt
      }, player1);
      
      io.to(opponent.socketId).emit('match_found', {
        id: room.id,
        name: room.name,
        hostId: room.hostId,
        players: room.players,
        maxPlayers: room.maxPlayers,
        gameStatus: room.gameStatus,
        createdAt: room.createdAt
      }, player2);
      
      console.log(`快速匹配成功: ${socket.id} vs ${opponent.socketId}`);
    } else {
      // 加入匹配隊列
      matchQueue.push({ socketId: socket.id, user, joinTime: new Date() });
      socket.emit('match_searching');
      console.log(`玩家 ${socket.id} 加入匹配隊列`);
    }
  });

  // 取消匹配
  socket.on('cancel_match', () => {
    const index = matchQueue.findIndex(item => item.socketId === socket.id);
    if (index !== -1) {
      matchQueue.splice(index, 1);
      socket.emit('match_cancelled');
      console.log(`玩家 ${socket.id} 取消匹配`);
    }
  });

  // 聊天消息
  socket.on('chat_message', (data) => {
    const { message } = data;
    const playerData = players.get(socket.id);
    
    if (!playerData) return;
    
    const { player, roomId } = playerData;
    
    // 廣播聊天消息給房間內所有玩家
    io.to(roomId).emit('chat_message', {
      playerId: socket.id,
      playerName: player.user.name,
      message,
      timestamp: new Date()
    });
  });

  // 離開房間
  socket.on('leave_room', () => {
    console.log(`收到離開房間請求: 玩家 ${socket.id}`);
    
    const playerData = players.get(socket.id);
    if (!playerData) {
      console.log(`警告: 玩家 ${socket.id} 不在任何房間中，無法離開`);
      return;
    }
    
    const { roomId } = playerData;
    const room = rooms.get(roomId);
    
    console.log(`玩家 ${socket.id} 正在離開房間 ${roomId}`);
    
    if (room) {
      console.log(`房間 ${roomId} 離開前玩家列表:`, room.players.map(p => ({ id: p.id, name: p.user.name })));
      
      room.removePlayer(socket.id);
      
      console.log(`房間 ${roomId} 離開後玩家列表:`, room.players.map(p => ({ id: p.id, name: p.user.name })));
      
      // 通知房間內其他玩家
      socket.to(roomId).emit('player_left', socket.id);
      
      // 離開Socket.IO房間
      socket.leave(roomId);
      
      // 通知離開者
      socket.emit('room_left');
      
      console.log(`玩家 ${socket.id} 成功離開房間 ${roomId}`);
    } else {
      console.log(`警告: 房間 ${roomId} 不存在`);
    }
    
    // 從玩家映射中移除
    players.delete(socket.id);
    console.log(`已從玩家映射中移除 ${socket.id}`);
  });

  // 斷開連接
  socket.on('disconnect', () => {
    console.log('用戶斷開連接:', socket.id);
    
    // 從匹配隊列中移除
    const matchIndex = matchQueue.findIndex(item => item.socketId === socket.id);
    if (matchIndex !== -1) {
      matchQueue.splice(matchIndex, 1);
    }
    
    // 從房間中移除
    const playerData = players.get(socket.id);
    if (playerData) {
      const { roomId } = playerData;
      const room = rooms.get(roomId);
      
      if (room) {
        room.removePlayer(socket.id);
        socket.to(roomId).emit('player_left', socket.id);
      }
      
      players.delete(socket.id);
    }
  });
});

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    players: players.size,
    matchQueue: matchQueue.length
  });
});

// 獲取服務器統計
app.get('/stats', (req, res) => {
  res.json({
    rooms: Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      playerCount: room.players.length,
      gameStatus: room.gameStatus
    })),
    totalRooms: rooms.size,
    totalPlayers: players.size,
    queueLength: matchQueue.length
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO服務器運行在端口 ${PORT}`);
  console.log(`📊 健康檢查: http://localhost:${PORT}/health`);
  console.log(`📈 統計信息: http://localhost:${PORT}/stats`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信號，正在關閉服務器...');
  httpServer.close(() => {
    console.log('服務器已關閉');
    process.exit(0);
  });
});