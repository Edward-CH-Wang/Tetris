import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import GameBoard from '../components/GameBoard';
import GameInfo from '../components/GameInfo';
import { ArrowLeft, Home } from 'lucide-react';
import { toast } from 'sonner';
import { usePageTitle, PAGE_SEO_DATA } from '../hooks/usePageTitle';

const SinglePlayer: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { 
    gameStatus, 
    score, 
    level, 
    lines, 
    initGame 
  } = useGameStore();
  
  const { 
    currentUser, 
    isAuthenticated, 
    addGameRecord 
  } = useUserStore();
  
  // SEO優化：設置頁面標題和描述
  usePageTitle(PAGE_SEO_DATA.singlePlayer);

  // 初始化遊戲
  useEffect(() => {
    initGame();
  }, [initGame]);

  // 監聽遊戲結束，保存記錄
  useEffect(() => {
    if (gameStatus === 'gameOver' && currentUser && score > 0) {
      // 計算遊戲時長（這裡簡化為基於分數的估算）
      const estimatedDuration = Math.floor(score / 100) * 30; // 每100分約30秒
      
      // 添加遊戲記錄
      addGameRecord({
        gameType: 'single',
        score,
        level,
        lines,
        duration: estimatedDuration,
        result: 'completed'
      });
      
      // 顯示遊戲結束通知
      toast.success(t('game.gameOver', { score: score.toLocaleString() }), {
        description: t('game.finalStats', { level, lines })
      });
      
      // 如果是訪客，提示登入以保存記錄
      if (currentUser.isGuest) {
        setTimeout(() => {
          toast.info(t('game.loginToSave'));
        }, 2000);
      }
    }
  }, [gameStatus, score, level, lines, currentUser, addGameRecord]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
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
              {t('common.back')}
            </button>
            
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              {t('common.home')}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <div className="text-white font-bold text-sm">T</div>
            </div>
            <h1 className="text-xl font-bold text-white">{t('game.singlePlayer')}</h1>
          </div>
          
          {/* 用戶信息 */}
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
              {currentUser.isGuest && (
                <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">{t('auth.guest')}</span>
              )}
            </div>
          )}
        </nav>

        {/* 主要遊戲區域 */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 遊戲信息面板 */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <GameInfo className="sticky top-6" />
            </div>
            
            {/* 遊戲板 */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="flex justify-center">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                  <GameBoard />
                </div>
              </div>
            </div>
            
            {/* 右側信息 */}
            <div className="lg:col-span-1 order-3">
              <div className="space-y-6">
                {/* 遊戲說明 */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">{t('game.controls')}</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>{t('game.move')}:</span>
                      <span>← →</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('game.rotate')}:</span>
                      <span>↑ {t('game.or')} {t('game.space')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('game.softDrop')}:</span>
                      <span>↓</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('game.hardDrop')}:</span>
                      <span>Enter</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('game.pause')}:</span>
                      <span>ESC {t('game.or')} P</span>
                    </div>
                  </div>
                </div>
                
                {/* 計分規則 */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">{t('game.scoringRules')}</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>{t('game.singleLine')}:</span>
                      <span>40 × {t('game.level')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('game.doubleLine')}:</span>
                      <span>100 × {t('game.level')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('game.tripleLine')}:</span>
                      <span>300 × {t('game.level')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('game.tetris')}:</span>
                      <span>1200 × {t('game.level')}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-xs text-gray-400">
                      {t('game.levelUpInfo')}
                    </p>
                  </div>
                </div>
                
                {/* 遊戲狀態 */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">{t('game.gameStatus')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">{t('game.statusLabel')}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        gameStatus === 'playing' ? 'bg-green-600 text-green-100' :
                        gameStatus === 'paused' ? 'bg-yellow-600 text-yellow-100' :
                        gameStatus === 'gameOver' ? 'bg-red-600 text-red-100' :
                        'bg-gray-600 text-gray-100'
                      }`}>
                        {t(`game.status.${gameStatus}`)}
                      </span>
                    </div>
                    
                    {gameStatus === 'playing' && (
                      <div className="text-center">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(lines % 10) * 10}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {t('game.nextLevelProgress', { lines: 10 - (lines % 10) })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePlayer;