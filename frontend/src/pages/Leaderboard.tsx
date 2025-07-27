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

// 模擬排行榜數據
const mockLeaderboardData = {
  singlePlayer: {
    score: [
      { id: '1', name: 'TetrisMaster', avatar: null, score: 1250000, level: 15, lines: 150, rank: 1 },
      { id: '2', name: 'BlockBuster', avatar: null, score: 980000, level: 12, lines: 120, rank: 2 },
      { id: '3', name: 'LineClearing', avatar: null, score: 850000, level: 11, lines: 110, rank: 3 },
      { id: '4', name: 'SpeedRunner', avatar: null, score: 720000, level: 10, lines: 95, rank: 4 },
      { id: '5', name: 'PuzzlePro', avatar: null, score: 650000, level: 9, lines: 85, rank: 5 }
    ],
    level: [
      { id: '1', name: 'LevelKing', avatar: null, score: 800000, level: 20, lines: 200, rank: 1 },
      { id: '2', name: 'HighClimber', avatar: null, score: 750000, level: 18, lines: 180, rank: 2 },
      { id: '3', name: 'TowerBuilder', avatar: null, score: 700000, level: 16, lines: 160, rank: 3 },
      { id: '4', name: 'SkyReacher', avatar: null, score: 650000, level: 15, lines: 150, rank: 4 },
      { id: '5', name: 'CloudWalker', avatar: null, score: 600000, level: 14, lines: 140, rank: 5 }
    ],
    lines: [
      { id: '1', name: 'LineMaster', avatar: null, score: 900000, level: 12, lines: 250, rank: 1 },
      { id: '2', name: 'ClearingChamp', avatar: null, score: 850000, level: 11, lines: 230, rank: 2 },
      { id: '3', name: 'RowDestroyer', avatar: null, score: 800000, level: 10, lines: 210, rank: 3 },
      { id: '4', name: 'BlockEraser', avatar: null, score: 750000, level: 9, lines: 190, rank: 4 },
      { id: '5', name: 'GridCleaner', avatar: null, score: 700000, level: 8, lines: 170, rank: 5 }
    ]
  },
  multiplayer: {
    wins: [
      { id: '1', name: 'PvPKing', avatar: null, wins: 95, losses: 5, winRate: 95, rank: 1 },
      { id: '2', name: 'BattleChamp', avatar: null, wins: 88, losses: 12, winRate: 88, rank: 2 },
      { id: '3', name: 'DuelMaster', avatar: null, wins: 82, losses: 18, winRate: 82, rank: 3 },
      { id: '4', name: 'FightPro', avatar: null, wins: 75, losses: 25, winRate: 75, rank: 4 },
      { id: '5', name: 'WarriorAce', avatar: null, wins: 70, losses: 30, winRate: 70, rank: 5 }
    ],
    winRate: [
      { id: '1', name: 'WinStreaker', avatar: null, wins: 48, losses: 2, winRate: 96, rank: 1 },
      { id: '2', name: 'VictoryLord', avatar: null, wins: 90, losses: 10, winRate: 90, rank: 2 },
      { id: '3', name: 'TriumphKing', avatar: null, wins: 85, losses: 15, winRate: 85, rank: 3 },
      { id: '4', name: 'ConquerHero', avatar: null, wins: 80, losses: 20, winRate: 80, rank: 4 },
      { id: '5', name: 'ChampionAce', avatar: null, wins: 75, losses: 25, winRate: 75, rank: 5 }
    ]
  }
};

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string | null;
  score?: number;
  level?: number;
  lines?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  rank: number;
}

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'singlePlayer' | 'multiplayer'>('singlePlayer');
  const [activeType, setActiveType] = useState<string>('score');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentUser, isAuthenticated } = useUserStore();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // 模擬 API 調用
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const getCurrentData = (): LeaderboardEntry[] => {
    const data = mockLeaderboardData[activeCategory][activeType as keyof typeof mockLeaderboardData.singlePlayer] || [];
    
    if (searchTerm) {
      return data.filter(entry => 
        entry.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return data;
  };

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

  const getUserRank = () => {
    if (!isAuthenticated || !currentUser) return null;
    
    const data = getCurrentData();
    const userEntry = data.find(entry => entry.id === currentUser.id);
    
    if (userEntry) {
      return userEntry.rank;
    }
    
    // 如果用戶不在前 5 名，模擬一個排名
    return Math.floor(Math.random() * 50) + 6;
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
          單人模式
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
          多人對戰
        </button>
      </div>
    );
  };

  const renderTypeTabs = () => {
    const types = activeCategory === 'singlePlayer' 
      ? [
          { key: 'score', label: '最高分數', icon: Trophy },
          { key: 'level', label: '最高等級', icon: TrendingUp },
          { key: 'lines', label: '消除行數', icon: Target }
        ]
      : [
          { key: 'wins', label: '勝利次數', icon: Trophy },
          { key: 'winRate', label: '勝率排行', icon: Star }
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
    const isCurrentUser = isAuthenticated && currentUser && entry.id === currentUser.id;
    
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
                <h4 className="font-semibold text-white">{entry.name}</h4>
                {isCurrentUser && (
                  <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded-full">
                    你
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
                  <p className="text-sm text-gray-400">分數</p>
                  <p className="font-semibold text-white">{formatNumber(entry.score || 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">等級</p>
                  <p className="font-semibold text-white">{entry.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">行數</p>
                  <p className="font-semibold text-white">{entry.lines}</p>
                </div>
              </>
            ) : (
              <>
                <div className="text-right">
                  <p className="text-sm text-gray-400">勝利</p>
                  <p className="font-semibold text-white">{entry.wins}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">失敗</p>
                  <p className="font-semibold text-white">{entry.losses}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">勝率</p>
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
              <p className="text-sm text-blue-300">您的排名</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold text-white">#{userRank}</p>
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
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">排行榜</h1>
          </div>
          
          {/* 用戶信息和刷新按鈕 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              刷新
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
          {renderUserRankCard() && (
            <div className="mb-6">
              {renderUserRankCard()}
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
                placeholder="搜索玩家..."
                className="pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors w-64"
              />
            </div>
          </div>

          {/* 排行榜內容 */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">載入中...</p>
              </div>
            ) : currentData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400 text-lg mb-2">
                  {searchTerm ? '沒有找到匹配的玩家' : '暫無排行榜數據'}
                </p>
                <p className="text-gray-500">
                  {searchTerm ? '嘗試其他搜索詞' : '開始遊戲來建立排行榜吧！'}
                </p>
              </div>
            ) : (
              currentData.map((entry, index) => renderLeaderboardEntry(entry, index))
            )}
          </div>

          {/* 底部說明 */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              排行榜每小時更新一次 • 顯示前 100 名玩家
            </p>
            {!isAuthenticated && (
              <p className="text-blue-400 text-sm mt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="hover:text-blue-300 underline"
                >
                  登入帳號
                </button>
                {' '}查看您的排名和完整統計
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;