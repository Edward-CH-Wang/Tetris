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
            onTouchStart={(e) => {
              e.preventDefault();
              handleMove('left');
            }}
            onClick={() => handleMove('left')}
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
            onTouchStart={(e) => {
              e.preventDefault();
              handleRotate();
            }}
            onClick={handleRotate}
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
            onTouchStart={(e) => {
              e.preventDefault();
              handleMove('right');
            }}
            onClick={() => handleMove('right')}
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
            onTouchStart={(e) => {
              e.preventDefault();
              handleMove('down');
            }}
            onClick={() => handleMove('down')}
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
            onTouchStart={(e) => {
              e.preventDefault();
              handleHardDrop();
            }}
            onClick={handleHardDrop}
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