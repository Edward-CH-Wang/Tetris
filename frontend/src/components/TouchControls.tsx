import React from 'react';
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

  // 處理觸控事件，防止雙重觸發
  const handleTouchEvent = (e: React.TouchEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  // 處理點擊事件，只在非觸控設備上觸發
  const handleClickEvent = (e: React.MouseEvent, action: () => void) => {
    // 檢查是否為觸控設備生成的點擊事件
    if (e.detail === 0) {
      // detail為0表示這是由觸控事件生成的點擊，忽略它
      return;
    }
    action();
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
            onTouchStart={(e) => handleTouchEvent(e, () => handleMove('left'))}
            onClick={(e) => handleClickEvent(e, () => handleMove('left'))}
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
            onTouchStart={(e) => handleTouchEvent(e, handleRotate)}
            onClick={(e) => handleClickEvent(e, handleRotate)}
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
            onTouchStart={(e) => handleTouchEvent(e, () => handleMove('right'))}
            onClick={(e) => handleClickEvent(e, () => handleMove('right'))}
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
            onTouchStart={(e) => handleTouchEvent(e, () => handleMove('down'))}
            onClick={(e) => handleClickEvent(e, () => handleMove('down'))}
            disabled={gameStatus === 'gameOver'}
            className={cn(
              buttonBaseClass,
              secondaryButtonClass,
              'h-12',
              {
                'opacity-50 cursor-not-allowed': gameStatus === 'gameOver'
              }
            )}
          >
            <ChevronDown className="w-5 h-5" />
            <span className="ml-1 text-sm">{t('game.softDrop')}</span>
          </button>

          <button
            onTouchStart={(e) => handleTouchEvent(e, handleHardDrop)}
            onClick={(e) => handleClickEvent(e, handleHardDrop)}
            disabled={gameStatus === 'gameOver'}
            className={cn(
              buttonBaseClass,
              dangerButtonClass,
              'h-12',
              {
                'opacity-50 cursor-not-allowed': gameStatus === 'gameOver'
              }
            )}
          >
            <ArrowDown className="w-5 h-5" />
            <span className="ml-1 text-sm">{t('game.hardDrop')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default TouchControls;