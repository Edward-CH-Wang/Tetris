import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  RotateCw, 
  ArrowDown
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TouchControlsProps {
  className?: string;
}

const TouchControls: React.FC<TouchControlsProps> = ({ className }) => {
  const { t } = useTranslation();
  const {
    gameStatus,
    movePiece,
    rotatePiece,
    hardDrop
  } = useGameStore();

  // 使用ref來追蹤最後一次觸發的時間，防止重複觸發
  const lastTriggerTime = useRef<number>(0);
  const DEBOUNCE_TIME = 100; // 100ms防抖時間

  const handleMove = (direction: 'left' | 'right' | 'down') => {
    if (gameStatus !== 'playing') return;
    movePiece(direction);
  };

  const handleRotate = () => {
    if (gameStatus !== 'playing') return;
    rotatePiece();
  };

  const handleHardDrop = () => {
    if (gameStatus !== 'playing') return;
    hardDrop();
  };

  // 統一的事件處理器，使用時間戳防抖
  const handleButtonAction = (action: () => void) => {
    const now = Date.now();
    if (now - lastTriggerTime.current < DEBOUNCE_TIME) {
      return; // 在防抖時間內，忽略重複觸發
    }
    lastTriggerTime.current = now;
    action();
  };

  // 觸控事件處理器
  const handleTouchStart = (e: React.TouchEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    handleButtonAction(action);
  };

  // 滑鼠事件處理器（僅用於桌面設備）
  const handleMouseDown = (e: React.MouseEvent, action: () => void) => {
    // 只處理滑鼠左鍵點擊
    if (e.button !== 0) return;
    e.preventDefault();
    handleButtonAction(action);
  };



  const buttonBaseClass = "flex items-center justify-center rounded-lg font-medium transition-all duration-150 active:scale-95 select-none";
  const primaryButtonClass = "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg";
  const secondaryButtonClass = "bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white shadow-lg";
  const dangerButtonClass = "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg";


  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* 主要控制區域 */}
      <div className="space-y-4">
        {/* 第一行：左移、旋轉、右移 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onTouchStart={(e) => handleTouchStart(e, () => handleMove('left'))}
            onMouseDown={(e) => handleMouseDown(e, () => handleMove('left'))}
            disabled={gameStatus === 'gameOver'}
            className={cn(
              buttonBaseClass,
              primaryButtonClass,
              'h-14 text-lg',
              {
                'opacity-50 cursor-not-allowed': gameStatus === 'gameOver'
              }
            )}
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="ml-1 text-sm">{t('game.left')}</span>
          </button>

          <button
            onTouchStart={(e) => handleTouchStart(e, handleRotate)}
            onMouseDown={(e) => handleMouseDown(e, handleRotate)}
            disabled={gameStatus === 'gameOver'}
            className={cn(
              buttonBaseClass,
              secondaryButtonClass,
              'h-14 text-lg',
              {
                'opacity-50 cursor-not-allowed': gameStatus === 'gameOver'
              }
            )}
          >
            <RotateCw className="w-6 h-6" />
            <span className="ml-1 text-sm">{t('game.rotate')}</span>
          </button>

          <button
            onTouchStart={(e) => handleTouchStart(e, () => handleMove('right'))}
            onMouseDown={(e) => handleMouseDown(e, () => handleMove('right'))}
            disabled={gameStatus === 'gameOver'}
            className={cn(
              buttonBaseClass,
              primaryButtonClass,
              'h-14 text-lg',
              {
                'opacity-50 cursor-not-allowed': gameStatus === 'gameOver'
              }
            )}
          >
            <ChevronRight className="w-6 h-6" />
            <span className="ml-1 text-sm">{t('game.right')}</span>
          </button>
        </div>

        {/* 第二行：軟降、硬降 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onTouchStart={(e) => handleTouchStart(e, () => handleMove('down'))}
            onMouseDown={(e) => handleMouseDown(e, () => handleMove('down'))}
            disabled={gameStatus === 'gameOver'}
            className={cn(
              buttonBaseClass,
              secondaryButtonClass,
              'h-14 text-lg',
              {
                'opacity-50 cursor-not-allowed': gameStatus === 'gameOver'
              }
            )}
          >
            <ChevronDown className="w-6 h-6" />
            <span className="ml-1 text-sm">{t('game.softDrop')}</span>
          </button>

          <button
            onTouchStart={(e) => handleTouchStart(e, handleHardDrop)}
            onMouseDown={(e) => handleMouseDown(e, handleHardDrop)}
            disabled={gameStatus === 'gameOver'}
            className={cn(
              buttonBaseClass,
              'bg-red-600 hover:bg-red-700 text-white border-red-600',
              'h-14 text-lg',
              {
                'opacity-50 cursor-not-allowed': gameStatus === 'gameOver'
              }
            )}
          >
            <ArrowDown className="w-6 h-6" />
            <span className="ml-1 text-sm">{t('game.hardDrop')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default TouchControls;