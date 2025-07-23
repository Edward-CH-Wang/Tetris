import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { useUserStore } from '../store/userStore';
import { useGameStore } from '../store/gameStore';
import GameBoard from '../components/GameBoard';
import GameInfo from '../components/GameInfo';
import { 
  ArrowLeft, 
  Home, 
  Users, 
  Search, 
  Plus, 
  Play, 
  Pause, 
  Crown,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const Multiplayer: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'quickMatch' | 'rooms'>('quickMatch');
  const [roomName, setRoomName] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  
  const {
    socket,
    isConnected,
    connectionStatus,
    gameState,
    availableRooms,
    isSearching,
    searchStartTime,
    error,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    getRoomList,
    startQuickMatch,
    cancelQuickMatch,
    setReady,
    startGame,
    resetMultiplayerState
  } = useMultiplayerStore();
  
  const { currentUser, isAuthenticated, addGameRecord } = useUserStore();
  const { gameStatus, score, level, lines } = useGameStore();

  // 計算搜索時間
  const [searchDuration, setSearchDuration] = useState(0);
  
  useEffect(() => {
    if (isSearching && searchStartTime) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - searchStartTime.getTime()) / 1000);
        setSearchDuration(duration);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isSearching, searchStartTime]);

  // 自動連接
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('請先登入以使用多人對戰功能');
      navigate('/');
      return;
    }
    
    if (!isConnected && connectionStatus === 'disconnected') {
      connect();
    }
    
    return () => {
      if (gameState.room) {
        leaveRoom();
      }
    };
  }, [isAuthenticated, isConnected, connectionStatus, connect, navigate, gameState.room, leaveRoom]);

  // 監聽連接錯誤
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // 監聽遊戲結束
  useEffect(() => {
    if (gameStatus === 'gameOver' && gameState.room && currentUser) {
      const isWinner = gameState.winner?.id === currentUser.id;
      const estimatedDuration = Math.floor(score / 100) * 30;
      
      addGameRecord({
        gameType: 'multiplayer',
        score,
        level,
        lines,
        duration: estimatedDuration,
        result: isWinner ? 'win' : 'lose',
        opponentId: gameState.opponent?.id
      });
      
      toast.success(
        isWinner ? '恭喜獲勝！' : '遊戲結束',
        {
          description: `最終分數：${score.toLocaleString()}`
        }
      );
    }
  }, [gameStatus, gameState.room, gameState.winner, gameState.opponent, currentUser, score, level, lines, addGameRecord]);

  const handleGoBack = () => {
    if (gameState.room) {
      leaveRoom();
    }
    navigate(-1);
  };

  const handleGoHome = () => {
    if (gameState.room) {
      leaveRoom();
    }
    navigate('/');
  };

  const handleQuickMatch = () => {
    if (isSearching) {
      cancelQuickMatch();
    } else {
      startQuickMatch();
    }
  };

  const handleCreateRoom = () => {
    if (roomName.trim()) {
      createRoom(roomName.trim());
      setRoomName('');
      setShowCreateRoom(false);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    resetMultiplayerState();
  };

  const handleToggleReady = () => {
    if (gameState.currentPlayer) {
      setReady(!gameState.currentPlayer.isReady);
    }
  };

  const handleStartGame = () => {
    startGame();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 渲染連接狀態
  const renderConnectionStatus = () => {
    return (
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">已連接</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">
              {connectionStatus === 'connecting' ? '連接中...' : '未連接'}
            </span>
          </>
        )}
      </div>
    );
  };

  // 渲染快速匹配
  const renderQuickMatch = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">快速匹配</h3>
          <p className="text-gray-300">系統將自動為您匹配合適的對手</p>
        </div>
        
        {isSearching ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">搜索對手中...</h4>
            <div className="flex items-center justify-center gap-2 text-gray-300 mb-4">
              <Clock className="w-4 h-4" />
              <span>已搜索 {formatTime(searchDuration)}</span>
            </div>
            <button
              onClick={handleQuickMatch}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              取消搜索
            </button>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={handleQuickMatch}
              disabled={!isConnected}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-lg transition-colors flex items-center gap-3 mx-auto"
            >
              <Search className="w-5 h-5" />
              開始匹配
            </button>
          </div>
        )}
      </div>
    );
  };

  // 渲染房間列表
  const renderRoomList = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">房間列表</h3>
          <button
            onClick={() => setShowCreateRoom(true)}
            disabled={!isConnected}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            創建房間
          </button>
        </div>
        
        {/* 創建房間對話框 */}
        {showCreateRoom && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">創建新房間</h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="輸入房間名稱"
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                maxLength={20}
              />
              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
              >
                創建
              </button>
              <button
                onClick={() => {
                  setShowCreateRoom(false);
                  setRoomName('');
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}
        
        {/* 房間列表 */}
        <div className="space-y-3">
          {availableRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>目前沒有可用的房間</p>
              <p className="text-sm">創建一個新房間開始遊戲吧！</p>
            </div>
          ) : (
            availableRooms.map((room) => (
              <div
                key={room.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700 flex justify-between items-center"
              >
                <div>
                  <h5 className="font-semibold text-white">{room.name}</h5>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span>玩家：{room.players.length}/{room.maxPlayers}</span>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs',
                      room.gameStatus === 'waiting' ? 'bg-green-600 text-green-100' :
                      room.gameStatus === 'playing' ? 'bg-blue-600 text-blue-100' :
                      'bg-gray-600 text-gray-100'
                    )}>
                      {{
                        waiting: '等待中',
                        starting: '準備開始',
                        playing: '遊戲中',
                        finished: '已結束'
                      }[room.gameStatus]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.players.length >= room.maxPlayers || room.gameStatus !== 'waiting'}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  加入
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // 渲染房間內容
  const renderRoomContent = () => {
    if (!gameState.room) return null;
    
    const { room, currentPlayer, opponent } = gameState;
    const isHost = currentPlayer?.isHost;
    const canStart = room.players.every(p => p.isReady) && room.players.length >= 2;
    
    return (
      <div className="space-y-6">
        {/* 房間信息 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-white">{room.name}</h3>
            <button
              onClick={handleLeaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              離開房間
            </button>
          </div>
          
          {/* 玩家列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room.players.map((player) => (
              <div
                key={player.id}
                className={cn(
                  'bg-gray-700 rounded-lg p-4 border',
                  player.id === currentPlayer?.id ? 'border-blue-500' : 'border-gray-600'
                )}
              >
                <div className="flex items-center gap-3">
                  {player.user.avatar ? (
                    <img 
                      src={player.user.avatar} 
                      alt={player.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {player.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{player.user.name}</span>
                      {player.isHost && <Crown className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        player.isReady ? 'bg-green-600 text-green-100' : 'bg-gray-600 text-gray-100'
                      )}>
                        {player.isReady ? '準備就緒' : '未準備'}
                      </span>
                      {player.id === currentPlayer?.id && (
                        <span className="text-xs text-blue-400">(你)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 控制按鈕 */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleToggleReady}
              className={cn(
                'px-6 py-2 rounded-lg transition-colors font-medium',
                currentPlayer?.isReady 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              )}
            >
              {currentPlayer?.isReady ? '取消準備' : '準備就緒'}
            </button>
            
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                開始遊戲
              </button>
            )}
          </div>
          
          {!canStart && (
            <p className="text-yellow-400 text-sm mt-2">
              {room.players.length < 2 ? '等待其他玩家加入...' : '等待所有玩家準備就緒...'}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* 頂部導航 */}
        <nav className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </button>
            
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              首頁
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">多人對戰</h1>
          </div>
          
          {/* 連接狀態和用戶信息 */}
          <div className="flex items-center gap-4">
            {renderConnectionStatus()}
            
            {isAuthenticated && currentUser && (
              <div className="flex items-center gap-3">
                {currentUser.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full border-2 border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-white text-sm">{currentUser.name}</span>
              </div>
            )}
          </div>
        </nav>

        {/* 主要內容 */}
        <div className="max-w-7xl mx-auto">
          {gameState.room && gameState.room.gameStatus === 'playing' ? (
            // 遊戲進行中 - 顯示雙人遊戲界面
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* 遊戲信息 */}
              <div className="lg:col-span-1">
                <GameInfo className="sticky top-6" />
              </div>
              
              {/* 雙人遊戲板 */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 自己的遊戲板 */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                    <h4 className="text-center text-white font-semibold mb-2">你</h4>
                    <GameBoard isMultiplayer={true} />
                  </div>
                  
                  {/* 對手的遊戲板 */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                    <h4 className="text-center text-white font-semibold mb-2">
                      {gameState.opponent?.user.name || '對手'}
                    </h4>
                    <GameBoard isMultiplayer={true} isOpponent={true} />
                  </div>
                </div>
              </div>
              
              {/* 對戰信息 */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  {/* 對手信息 */}
                  {gameState.opponent && (
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                      <h4 className="text-lg font-semibold text-white mb-3">對手信息</h4>
                      <div className="flex items-center gap-3">
                        {gameState.opponent.user.avatar ? (
                          <img 
                            src={gameState.opponent.user.avatar} 
                            alt={gameState.opponent.user.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold">
                            {gameState.opponent.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-white font-medium">{gameState.opponent.user.name}</div>
                          <div className="text-sm text-gray-400">分數：{gameState.opponent.score || 0}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : gameState.room ? (
            // 在房間中但未開始遊戲
            renderRoomContent()
          ) : (
            // 未在房間中 - 顯示匹配和房間選項
            <div>
              {/* 標籤切換 */}
              <div className="flex justify-center mb-8">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-gray-700">
                  <button
                    onClick={() => setActiveTab('quickMatch')}
                    className={cn(
                      'px-6 py-2 rounded-md transition-colors font-medium',
                      activeTab === 'quickMatch'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white'
                    )}
                  >
                    快速匹配
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('rooms');
                      getRoomList();
                    }}
                    className={cn(
                      'px-6 py-2 rounded-md transition-colors font-medium',
                      activeTab === 'rooms'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white'
                    )}
                  >
                    房間列表
                  </button>
                </div>
              </div>
              
              {/* 內容區域 */}
              <div className="max-w-4xl mx-auto">
                {activeTab === 'quickMatch' ? renderQuickMatch() : renderRoomList()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Multiplayer;