import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore';
import { toIsoSafe } from '../utils/timestamps';
import { 
  ArrowLeft, 
  Home, 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Award, 
  Star,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Crown,
  Medal,
  User
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import CloudSyncStatus from '../components/CloudSyncStatus';

const Stats: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'history'>('overview');
  
  const { 
    isAuthenticated, 
    currentUser, 
    gameRecords, 
    userStats, 
    achievements,
    isLoading
  } = useUserStore();

  // 如果未登入，重定向到登入頁面
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // 準備圖表數據
  const prepareChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return toIsoSafe(date).split('T')[0];
    });
    
    const scoreData = last7Days.map(date => {
      const dayRecords = gameRecords.filter(record => 
        toIsoSafe(record.playedAt).split('T')[0] === date
      );
      const avgScore = dayRecords.length > 0 
        ? Math.round(dayRecords.reduce((sum, record) => sum + record.score, 0) / dayRecords.length)
        : 0;
      
      return {
        date: new Date(date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
        score: avgScore,
        games: dayRecords.length
      };
    });
    
    return scoreData;
  };

  const prepareGameTypeData = () => {
    const singlePlayerGames = gameRecords.filter(r => r.gameType === 'single').length;
    const multiplayerGames = gameRecords.filter(r => r.gameType === 'multiplayer').length;
    
    return [
      { name: t('nav.singlePlayer'), value: singlePlayerGames, color: '#3B82F6' },
      { name: t('nav.multiplayer'), value: multiplayerGames, color: '#EF4444' }
    ];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'score': return <Trophy className="w-5 h-5" />;
      case 'games': return <Target className="w-5 h-5" />;
      case 'time': return <Clock className="w-5 h-5" />;
      case 'streak': return <Zap className="w-5 h-5" />;
      case 'special': return <Crown className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'score': return 'from-yellow-500 to-orange-500';
      case 'games': return 'from-blue-500 to-indigo-500';
      case 'time': return 'from-green-500 to-emerald-500';
      case 'streak': return 'from-purple-500 to-pink-500';
      case 'special': return 'from-red-500 to-rose-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  // 渲染概覽頁面
  const renderOverview = () => {
    const chartData = prepareChartData();
    const gameTypeData = prepareGameTypeData();
    
    return (
      <div className="space-y-6">
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('stats.highestScore')}</p>
                <p className="text-2xl font-bold text-white">{userStats.highestScore.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('stats.totalGames')}</p>
                <p className="text-2xl font-bold text-white">{userStats.totalGames}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('stats.totalPlayTime')}</p>
                <p className="text-2xl font-bold text-white">{formatDuration(userStats.totalPlayTime)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('stats.averageScore')}</p>
                <p className="text-2xl font-bold text-white">{Math.round(userStats.averageScore).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 圖表區域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 分數趨勢圖 */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">{t('stats.scoresTrend')}</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* 遊戲類型分布 */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <PieChart className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">{t('stats.gameTypeDistribution')}</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <RechartsPieChart data={gameTypeData} cx="50%" cy="50%" outerRadius={80}>
                    {gameTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RechartsPieChart>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {gameTypeData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-300">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 詳細統計 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              {t('stats.singlePlayerStats')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('stats.gamesPlayed')}</span>
                <span className="text-white font-medium">{gameRecords.filter(r => r.gameType === 'single').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('stats.highestScore')}</span>
                <span className="text-white font-medium">{userStats.highestScore.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('stats.averageScore')}</span>
                <span className="text-white font-medium">{userStats.averageScore.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('stats.highestLevel')}</span>
                <span className="text-white font-medium">{Math.max(...gameRecords.map(r => r.level), 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-red-400" />
              {t('stats.multiplayerStats')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('stats.battlesPlayed')}</span>
                <span className="text-white font-medium">{gameRecords.filter(r => r.gameType === 'multiplayer').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('stats.wins')}</span>
                <span className="text-white font-medium">{userStats.totalWins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('stats.winRate')}</span>
                <span className="text-white font-medium">{userStats.winRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('stats.bestStreak')}</span>
                <span className="text-white font-medium">{userStats.bestStreak}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染成就頁面
  const renderAchievements = () => {
    const unlockedAchievements = achievements.filter(a => a.unlockedAt);
    const lockedAchievements = achievements.filter(a => !a.unlockedAt);
    
    return (
      <div className="space-y-6">
        {/* 成就統計 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              {t('achievements.progress')}
            </h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{unlockedAchievements.length}/{achievements.length}</p>
              <p className="text-sm text-gray-400">{t('achievements.unlocked')}</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(unlockedAchievements.length / achievements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 已解鎖成就 */}
        {unlockedAchievements.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              {t('achievements.unlockedAchievements')} ({unlockedAchievements.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlockedAchievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-bl-full" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-gradient-to-br from-yellow-500 to-orange-500">
                      <span className="text-2xl">{achievement.icon}</span>
                    </div>
                    <h5 className="font-semibold text-white mb-1">{achievement.name}</h5>
                    <p className="text-sm text-gray-300 mb-2">{achievement.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400 font-medium">{t('achievements.unlocked')}</span>
                      <span className="text-gray-400">
                        {achievement.unlockedAt && formatDate(achievement.unlockedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 未解鎖成就 */}
        {lockedAchievements.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Medal className="w-5 h-5 text-gray-400" />
              {t('achievements.lockedAchievements')} ({lockedAchievements.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedAchievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700 opacity-60"
                >
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl opacity-50">{achievement.icon}</span>
                  </div>
                  <h5 className="font-semibold text-gray-300 mb-1">{achievement.name}</h5>
                  <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{t('achievements.locked')}</span>
                    <span className="text-gray-500">{t('achievements.progressLabel')}：{achievement.progress || 0}/{achievement.maxProgress || '?'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染遊戲歷史
  const renderHistory = () => {
    const sortedRecords = [...gameRecords].sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            {t('stats.gameHistory')} ({gameRecords.length})
          </h3>
        </div>
        
        {sortedRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 text-lg mb-2">{t('stats.noGameRecords')}</p>
            <p className="text-gray-500">{t('stats.startPlayingMessage')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRecords.map((record) => (
              <div 
                key={record.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      record.gameType === 'single' 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        : 'bg-gradient-to-br from-red-500 to-pink-600'
                    )}>
                      {record.gameType === 'single' ? (
                        <Target className="w-5 h-5 text-white" />
                      ) : (
                        <Zap className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3">
                        <h5 className="font-semibold text-white">
                          {record.gameType === 'single' ? t('nav.singlePlayer') : t('nav.multiplayer')}
                        </h5>
                        {record.gameType === 'multiplayer' && record.result && (
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            record.result === 'win' 
                              ? 'bg-green-600 text-green-100'
                              : 'bg-red-600 text-red-100'
                          )}>
                            {record.result === 'win' ? t('game.win') : t('game.lose')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{formatDate(record.playedAt)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-gray-400">{t('game.score')}</p>
                        <p className="font-semibold text-white">{record.score.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{t('game.level')}</p>
                        <p className="font-semibold text-white">{record.level}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{t('game.lines')}</p>
                        <p className="font-semibold text-white">{record.lines}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{t('game.time')}</p>
                        <p className="font-semibold text-white">{formatDuration(record.duration)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 顯示載入狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // 如果未認證，顯示未登入狀態
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-white text-lg mb-4">{t('auth.loginRequired')}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('nav.login')}
          </button>
        </div>
      </div>
    );
  }

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
              {t('nav.home')}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{t('nav.stats')}</h1>
          </div>
          
          {/* 用戶信息 */}
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
        </nav>

        {/* 標籤切換 */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'px-6 py-2 rounded-md transition-colors font-medium',
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              )}
            >
              {t('stats.overview')}
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={cn(
                'px-6 py-2 rounded-md transition-colors font-medium',
                activeTab === 'achievements'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              )}
            >
              {t('nav.achievements')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'px-6 py-2 rounded-md transition-colors font-medium',
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              )}
            >
              {t('stats.history')}
            </button>
          </div>
        </div>

        {/* 雲端同步狀態 */}
        <div className="max-w-7xl mx-auto mb-6">
          <CloudSyncStatus />
        </div>

        {/* 主要內容 */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'achievements' && renderAchievements()}
          {activeTab === 'history' && renderHistory()}
        </div>
      </div>
    </div>
  );
};

export default Stats;