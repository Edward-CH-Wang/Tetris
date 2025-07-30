import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { 
  ArrowLeft, 
  Home, 
  Trophy, 
  Crown, 
  Medal, 
  Target, 
  Zap, 
  Clock, 
  TrendingUp,
  Star,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { leaderboardService, LeaderboardEntry } from '../lib/leaderboard';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { usePageTitle, PAGE_SEO_DATA } from '../hooks/usePageTitle';



const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<'singlePlayer' | 'multiplayer'>('singlePlayer');
  const [activeType, setActiveType] = useState<string>('score');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // SEO優化：設置頁面標題和描述
  usePageTitle(PAGE_SEO_DATA.leaderboard);
  const [leaderboardData, setLeaderboardData] = useState<{
    singlePlayer: { [key: string]: LeaderboardEntry[] };
    multiplayer: { [key: string]: LeaderboardEntry[] };
  }>({ singlePlayer: {}, multiplayer: {} });
  const [error, setError] = useState<string | null>(null);
  
  const { currentUser, isAuthenticated } = useUserStore();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // 載入排行榜數據
  const loadLeaderboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [singleScoreData, singleLevelData, singleLinesData, multiWinsData, multiWinRateData] = await Promise.all([
        leaderboardService.getLeaderboard('single', 50, 'score'),
        leaderboardService.getLeaderboard('single', 50, 'level'),
        leaderboardService.getLeaderboard('single', 50, 'lines'),
        leaderboardService.getLeaderboard('multiplayer', 50, 'wins'),
        leaderboardService.getLeaderboard('multiplayer', 50, 'winRate')
      ]);
      
      setLeaderboardData({
        singlePlayer: {
          score: singleScoreData,
          level: singleLevelData,
          lines: singleLinesData
        },
        multiplayer: {
          wins: multiWinsData,
          winRate: multiWinRateData
        }
      });
    } catch (err) {
      console.error('載入排行榜失敗:', err);
      setError(t('leaderboard.loadError'));
      toast.error(t('leaderboard.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadLeaderboardData();
    toast.success(t('leaderboard.updated'));
  };

  const getCurrentData = (): LeaderboardEntry[] => {
    const data = leaderboardData[activeCategory][activeType] || [];
    
    if (searchTerm) {
      return data.filter(entry => 
        entry.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return data;
  };

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-gray-400 font-bold">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getUserRank = (): LeaderboardEntry | null => {
     if (!isAuthenticated || !currentUser || currentUser.isGuest) return null;
     
     const data = getCurrentData();
     const userEntry = data.find(entry => entry.userId === currentUser.id);
     
     return userEntry || null;
   };

  const renderCategoryTabs = () => {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-gray-700">
        <button
          onClick={() => {
            setActiveCategory('singlePlayer');
            setActiveType('score');
          }}
          className={cn(
            'px-6 py-2 rounded-md transition-colors font-medium flex items-center gap-2',
            activeCategory === 'singlePlayer'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          )}
        >
          <Target className="w-4 h-4" />
          {t('leaderboard.categories.singlePlayer')}
        </button>
        <button
          onClick={() => {
            setActiveCategory('multiplayer');
            setActiveType('wins');
          }}
          className={cn(
            'px-6 py-2 rounded-md transition-colors font-medium flex items-center gap-2',
            activeCategory === 'multiplayer'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white'
          )}
        >
          <Zap className="w-4 h-4" />
          {t('leaderboard.categories.multiplayer')}
        </button>
      </div>
    );
  };

  const renderTypeTabs = () => {
    const types = activeCategory === 'singlePlayer' 
      ? [
          { key: 'score', label: t('leaderboard.types.score'), icon: Trophy },
          { key: 'level', label: t('leaderboard.types.level'), icon: TrendingUp },
          { key: 'lines', label: t('leaderboard.types.lines'), icon: Target }
        ]
      : [
          { key: 'wins', label: t('leaderboard.types.wins'), icon: Trophy },
          { key: 'winRate', label: t('leaderboard.types.winRate'), icon: Star }
        ];
    
    return (
      <div className="flex flex-wrap gap-2">
        {types.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveType(key)}
            className={cn(
              'px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2',
              activeType === key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    );
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => {
    const isCurrentUser = isAuthenticated && currentUser && entry.userId === currentUser.id;
    
    return (
      <div 
        key={entry.id}
        className={cn(
          'bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border transition-all duration-200',
          isCurrentUser 
            ? 'border-blue-500 bg-blue-900/20' 
            : 'border-gray-700 hover:border-gray-600'
        )}
      >
        <div className="flex items-center gap-4">
          {/* 排名 */}
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            getRankBadge(entry.rank)
          )}>
            {getRankIcon(entry.rank)}
          </div>
          
          {/* 用戶信息 */}
          <div className="flex items-center gap-3 flex-1">
            {entry.avatar ? (
              <img 
                src={entry.avatar} 
                alt={entry.name}
                className="w-10 h-10 rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {entry.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-white">{entry.displayName}</h4>
                {isCurrentUser && (
                  <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded-full">
                    {t('leaderboard.you')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">#{entry.rank}</p>
            </div>
          </div>
          
          {/* 統計數據 */}
          <div className="flex items-center gap-6">
            {activeCategory === 'singlePlayer' ? (
              <>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{t('game.score')}</p>
                  <p className="font-semibold text-white">{formatNumber(entry.score || 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{t('game.level')}</p>
                  <p className="font-semibold text-white">{entry.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{t('game.lines')}</p>
                  <p className="font-semibold text-white">{entry.lines}</p>
                </div>
              </>
            ) : (
              <>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{t('leaderboard.wins')}</p>
                  <p className="font-semibold text-white">{entry.wins}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{t('leaderboard.losses')}</p>
                  <p className="font-semibold text-white">{entry.losses}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{t('leaderboard.winRate')}</p>
                  <p className="font-semibold text-white">{entry.winRate}%</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUserRankCard = () => {
    if (!isAuthenticated || !currentUser) return null;
    
    const userRank = getUserRank();
    if (!userRank) return null;
    
    return (
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentUser.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name}
                className="w-10 h-10 rounded-full border-2 border-blue-400"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <h4 className="font-semibold text-white">{currentUser.name}</h4>
              <p className="text-sm text-blue-300">{t('leaderboard.yourRank')}</p>
            </div>
          </div>
          
          <div className="text-right">
                   <p className="text-2xl font-bold text-white">#{getUserRank()?.rank}</p>
                   <p className="text-sm text-blue-300">
                     {activeCategory === 'singlePlayer' ? '單人模式' : '多人對戰'}
                   </p>
                 </div>
        </div>
      </div>
    );
  };

  const currentData = getCurrentData();

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
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{t('leaderboard.title')}</h1>
          </div>
          
          {/* 用戶信息和刷新按鈕 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              {t('leaderboard.refresh')}
            </button>
            
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

        <div className="max-w-6xl mx-auto">
          {/* 分類標籤 */}
          <div className="flex justify-center mb-6">
            {renderCategoryTabs()}
          </div>

          {/* 用戶排名卡片 */}
          {getUserRank() && (
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentUser?.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full border-2 border-blue-400"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {currentUser?.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold text-white">{getUserRank()?.displayName}</h4>
                    <p className="text-sm text-blue-300">您的排名</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">#{getUserRank()?.rank}</p>
                  <p className="text-sm text-blue-300">
                    {activeCategory === 'singlePlayer' ? t('leaderboard.singlePlayer') : t('leaderboard.multiplayer')}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {isAuthenticated && currentUser?.isGuest && (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30 mb-6">
              <div className="text-center">
                <p className="text-white font-semibold mb-2">{t('leaderboard.loginToViewRank')}</p>
                <p className="text-white/60 text-sm mb-4">{t('leaderboard.registerToCompete')}</p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                >
                  {t('leaderboard.loginNow')}
                </button>
              </div>
            </div>
          )}

          {/* 控制欄 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            {/* 類型標籤 */}
            <div>
              {renderTypeTabs()}
            </div>
            
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('leaderboard.searchPlayers')}
                className="pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors w-64"
              />
            </div>
          </div>

          {/* 排行榜內容 */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">{t('common.loading')}</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={loadLeaderboardData}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t('common.retry')}
                </button>
              </div>
            ) : currentData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400 text-lg mb-2">
                  {searchTerm ? t('leaderboard.noPlayersFound') : t('leaderboard.noData')}
                </p>
                <p className="text-gray-500">
                  {searchTerm ? t('leaderboard.tryOtherSearch') : t('leaderboard.startGameToCreateLeaderboard')}
                </p>
              </div>
            ) : (
              currentData.map((entry, index) => renderLeaderboardEntry(entry, index))
            )}
          </div>

          {/* 底部說明 */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              {t('leaderboard.updateInfo')}
            </p>
            {!isAuthenticated && (
              <p className="text-blue-400 text-sm mt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="hover:text-blue-300 underline"
                >
                  {t('auth.login')}
                </button>
                {' '}{t('leaderboard.viewRankAndStats')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;