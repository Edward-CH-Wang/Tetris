import React, { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

interface GameBoardProps {
  isMultiplayer?: boolean;
  isOpponent?: boolean;
  className?: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  isMultiplayer = false, 
  isOpponent = false,
  className 
}) => {
  const { t } = useTranslation();
  const gameRef = useRef<HTMLDivElement>(null);
  const {
    board,
    currentPiece,
    gameStatus,
    movePiece,
    rotatePiece,
    hardDrop,
    pauseGame,
    resumeGame,
    dropSpeed
  } = useGameStore();
  
  const { sendGameUpdate, gameState } = useMultiplayerStore();
  
  // 對手的遊戲板數據
  const opponentBoard = isOpponent ? gameState.opponent?.gameState?.board : null;
  const opponentPiece = isOpponent ? gameState.opponent?.gameState?.currentPiece : null;
  
  // 使用對手數據或本地數據
  const displayBoard = isOpponent ? (opponentBoard || board) : board;
  const displayPiece = isOpponent ? opponentPiece : currentPiece;

  // 鍵盤控制
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (isOpponent || gameStatus !== 'playing') return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        movePiece('left');
        break;
      case 'ArrowRight':
        event.preventDefault();
        movePiece('right');
        break;
      case 'ArrowDown':
        event.preventDefault();
        movePiece('down');
        break;
      case 'ArrowUp':
      case ' ': // 空白鍵
        event.preventDefault();
        rotatePiece();
        break;
      case 'Enter':
        event.preventDefault();
        hardDrop();
        break;
      case 'Escape':
      case 'p':
      case 'P':
        event.preventDefault();
        if (gameStatus === 'playing') {
          pauseGame();
        } else if (gameStatus === 'paused') {
          resumeGame();
        }
        break;
    }
  }, [gameStatus, movePiece, rotatePiece, hardDrop, pauseGame, resumeGame, isOpponent]);

  // 自動下降
  useEffect(() => {
    if (isOpponent || gameStatus !== 'playing') return;
    
    const interval = setInterval(() => {
      movePiece('down');
    }, dropSpeed);

    return () => clearInterval(interval);
  }, [gameStatus, dropSpeed, movePiece, isOpponent]);

  // 多人遊戲狀態同步
  useEffect(() => {
    if (!isMultiplayer || isOpponent) return;
    
    const gameStateToSend = {
      board,
      currentPiece,
      gameStatus
    };
    
    sendGameUpdate(gameStateToSend);
  }, [board, currentPiece, gameStatus, isMultiplayer, isOpponent, sendGameUpdate]);

  // 添加鍵盤事件監聽
  useEffect(() => {
    if (isOpponent) return;
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress, isOpponent]);

  // 渲染遊戲板格子
  const renderBoard = () => {
    const boardWithPiece = displayBoard.map(row => [...row]);
    
    // 將當前方塊添加到遊戲板上
    if (displayPiece && !isOpponent) {
      for (let y = 0; y < displayPiece.shape.length; y++) {
        for (let x = 0; x < displayPiece.shape[y].length; x++) {
          if (displayPiece.shape[y][x]) {
            const boardY = displayPiece.y + y;
            const boardX = displayPiece.x + x;
            if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
              boardWithPiece[boardY][boardX] = 2; // 2 表示當前方塊
            }
          }
        }
      }
    }

    return boardWithPiece.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={cn(
              'w-6 h-6 border border-gray-700 transition-colors duration-75',
              {
                'bg-gray-900': cell === 0, // 空格子
                'bg-blue-500 shadow-lg': cell === 1, // 已放置的方塊
                'bg-yellow-400 shadow-lg animate-pulse': cell === 2, // 當前方塊
                'opacity-60': isOpponent // 對手遊戲板透明度
              }
            )}
          >
            {cell !== 0 && (
              <div className="w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-sm" />
            )}
          </div>
        ))}
      </div>
    ));
  };

  // 渲染遊戲狀態覆蓋層
  const renderOverlay = () => {
    if (isOpponent) return null;
    
    if (gameStatus === 'paused') {
      return (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <h3 className="text-2xl font-bold mb-2">{t('game.paused')}</h3>
            <p className="text-sm opacity-80">{t('game.pauseInstructions')}</p>
          </div>
        </div>
      );
    }
    
    if (gameStatus === 'gameOver') {
      return (
        <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <h3 className="text-2xl font-bold mb-2">{t('game.gameOver')}</h3>
            <p className="text-sm opacity-80">{t('game.clickToRestart')}</p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={cn('relative', className)}>
      {/* 遊戲標題 */}
      {isOpponent && (
        <div className="text-center mb-2">
          <h4 className="text-lg font-semibold text-gray-300">{t('game.opponent')}</h4>
        </div>
      )}
      
      {/* 遊戲板 */}
      <div 
        ref={gameRef}
        className={cn(
          'relative bg-gray-800 border-2 border-gray-600 rounded-lg p-2',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          {
            'cursor-not-allowed': isOpponent,
            'hover:border-gray-500': !isOpponent
          }
        )}
        tabIndex={isOpponent ? -1 : 0}
      >
        <div className="flex flex-col gap-0">
          {renderBoard()}
        </div>
        
        {renderOverlay()}
      </div>
      
      {/* 控制說明 */}
      {!isOpponent && (
        <div className="mt-4 text-xs text-gray-400 space-y-1">
          <div className="grid grid-cols-2 gap-2">
            <div>← → {t('game.move')}</div>
            <div>↑ {t('game.rotate')}</div>
            <div>↓ {t('game.softDrop')}</div>
            <div>Enter {t('game.hardDrop')}</div>
            <div>ESC {t('game.pause')}</div>
            <div>{t('game.spaceToRotate')}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;