import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import { Play, Pause, RotateCcw, Trophy, Target, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface GameInfoProps {
  className?: string;
}

const GameInfo: React.FC<GameInfoProps> = ({ className }) => {
  const {
    score,
    level,
    lines,
    nextPiece,
    nextPieces,
    gameStatus,
    startGame,
    pauseGame,
    resumeGame,
    initGame
  } = useGameStore();
  
  const { currentUser, userStats } = useUserStore();

  // 渲染單個預覽方塊
  const renderSinglePiece = (piece: any, index: number) => {
    if (!piece) return null;
    
    const { shape } = piece;
    const maxSize = 4; // 最大預覽尺寸
    
    return (
      <div key={index} className="bg-gray-800 rounded-lg p-2 border border-gray-600">
        <h4 className="text-xs font-semibold text-gray-300 mb-1 text-center">
          {index === 0 ? '下一個' : `第${index + 1}個`}
        </h4>
        <div className="flex justify-center">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${maxSize}, 1fr)` }}>
            {Array(maxSize).fill(null).map((_, y) => 
              Array(maxSize).fill(null).map((_, x) => {
                const isActive = y < shape.length && x < shape[y].length && shape[y][x];
                return (
                  <div
                    key={`${y}-${x}`}
                    className={cn(
                      'w-3 h-3 rounded-sm transition-colors',
                      isActive 
                        ? 'bg-blue-500 shadow-sm border border-blue-400' 
                        : 'bg-transparent'
                    )}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染多個預覽方塊
  const renderNextPieces = () => {
    if (!nextPieces || nextPieces.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 text-center">預覽方塊</h3>
        <div className="space-y-2">
          {nextPieces.map((piece, index) => renderSinglePiece(piece, index))}
        </div>
      </div>
    );
  };

  // 渲染統計信息
  const renderStats = () => {
    return (
      <div className="space-y-3">
        {/* 分數 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">分數</span>
          </div>
          <div className="text-2xl font-bold">{score.toLocaleString()}</div>
        </div>
        
        {/* 等級和行數 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-300">等級</span>
            </div>
            <div className="text-xl font-bold text-green-400">{level}</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-300">行數</span>
            </div>
            <div className="text-xl font-bold text-yellow-400">{lines}</div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染用戶信息
  const renderUserInfo = () => {
    if (!currentUser) return null;
    
    return (
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
        <div className="flex items-center gap-3">
          {currentUser.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name}
              className="w-10 h-10 rounded-full border-2 border-gray-600"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {currentUser.name}
            </div>
            <div className="text-xs text-gray-400">
              {currentUser.isGuest ? '訪客模式' : '已登入'}
            </div>
          </div>
        </div>
        
        {!currentUser.isGuest && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">最高分：</span>
                <span className="text-white font-medium">{userStats.highestScore.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400">勝率：</span>
                <span className="text-white font-medium">{userStats.winRate}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染遊戲控制按鈕
  const renderGameControls = () => {
    return (
      <div className="space-y-2">
        {gameStatus === 'idle' && (
          <button
            onClick={startGame}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            開始遊戲
          </button>
        )}
        
        {gameStatus === 'playing' && (
          <button
            onClick={pauseGame}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Pause className="w-5 h-5" />
            暫停遊戲
          </button>
        )}
        
        {gameStatus === 'paused' && (
          <button
            onClick={resumeGame}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            繼續遊戲
          </button>
        )}
        
        {(gameStatus === 'gameOver' || gameStatus === 'idle') && (
          <button
            onClick={initGame}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {gameStatus === 'gameOver' ? '重新開始' : '初始化遊戲'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 用戶信息 */}
      {renderUserInfo()}
      
      {/* 遊戲統計 */}
      {renderStats()}
      
      {/* 預覽方塊 */}
      {renderNextPieces()}
      
      {/* 遊戲控制 */}
      {renderGameControls()}
      
      {/* 遊戲狀態指示 */}
      <div className="text-center">
        <div className={cn(
          'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
          {
            'bg-gray-700 text-gray-300': gameStatus === 'idle',
            'bg-green-700 text-green-200': gameStatus === 'playing',
            'bg-yellow-700 text-yellow-200': gameStatus === 'paused',
            'bg-red-700 text-red-200': gameStatus === 'gameOver'
          }
        )}>
          <div className={cn(
            'w-2 h-2 rounded-full',
            {
              'bg-gray-400': gameStatus === 'idle',
              'bg-green-400 animate-pulse': gameStatus === 'playing',
              'bg-yellow-400': gameStatus === 'paused',
              'bg-red-400': gameStatus === 'gameOver'
            }
          )} />
          {{
            idle: '待機中',
            playing: '遊戲中',
            paused: '已暫停',
            gameOver: '遊戲結束'
          }[gameStatus]}
        </div>
      </div>
    </div>
  );
};

export default GameInfo;