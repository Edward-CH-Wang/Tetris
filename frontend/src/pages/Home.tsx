import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { Play, Users, Trophy, Settings, LogIn, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loginWithGoogle, loginAsGuest } = useUserStore();

  const handleSinglePlayer = () => {
    navigate('/single-player');
  };

  const handleMultiplayer = () => {
    navigate('/multiplayer');
  };

  const handleStats = () => {
    navigate('/stats');
  };

  const handleLeaderboard = () => {
    navigate('/leaderboard');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      {/* 動態背景效果 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* 頂部導航 */}
        <nav className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <div className="text-white font-bold text-lg">T</div>
            </div>
            <h1 className="text-2xl font-bold text-white">俄羅斯方塊</h1>
          </div>
          
          {/* 用戶信息或登入按鈕 */}
          <div className="flex items-center gap-4">
            {isAuthenticated && currentUser ? (
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
                  <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">訪客</span>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={loginAsGuest}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  訪客模式
                </button>
                <button
                  onClick={loginWithGoogle}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  Google 登入
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* 主要內容 */}
        <div className="max-w-6xl mx-auto">
          {/* 遊戲標題和介紹 */}
          <div className="text-center mb-16">
            <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              俄羅斯方塊線上對戰
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              經典的俄羅斯方塊遊戲，支援單人模式和多人線上對戰。
              與全球玩家即時對戰，挑戰你的極限！
            </p>
            
            {/* 特色功能 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">單人模式</h3>
                <p className="text-gray-300 text-sm">經典俄羅斯方塊體驗，挑戰高分記錄</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">多人對戰</h3>
                <p className="text-gray-300 text-sm">與其他玩家即時對戰，體驗競技樂趣</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">排行榜</h3>
                <p className="text-gray-300 text-sm">查看全球排名，追蹤個人戰績</p>
              </div>
            </div>
          </div>

          {/* 遊戲模式選擇 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* 單人遊戲 */}
            <div className="group">
              <button
                onClick={handleSinglePlayer}
                className="w-full bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-blue-500/30"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                    <Play className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">單人遊戲</h3>
                  <p className="text-blue-100 text-center">經典俄羅斯方塊體驗，挑戰你的最高分數</p>
                </div>
              </button>
            </div>

            {/* 多人對戰 */}
            <div className="group">
              <button
                onClick={handleMultiplayer}
                className="w-full bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-purple-500/30"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">多人對戰</h3>
                  <p className="text-purple-100 text-center">與全球玩家即時對戰，體驗競技樂趣</p>
                </div>
              </button>
            </div>
          </div>

          {/* 其他功能 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={handleStats}
              disabled={!isAuthenticated || currentUser?.isGuest}
              className={cn(
                'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg p-6 transition-all duration-300 border border-white/20',
                (!isAuthenticated || currentUser?.isGuest) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex flex-col items-center">
                <Trophy className="w-8 h-8 mb-3 text-yellow-400" />
                <h4 className="font-semibold mb-1">個人戰績</h4>
                <p className="text-sm text-gray-300 text-center">查看詳細的遊戲統計和歷史記錄</p>
                {(!isAuthenticated || currentUser?.isGuest) && (
                  <p className="text-xs text-yellow-400 mt-2">需要登入帳號</p>
                )}
              </div>
            </button>

            <button
              onClick={handleLeaderboard}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg p-6 transition-all duration-300 border border-white/20"
            >
              <div className="flex flex-col items-center">
                <Trophy className="w-8 h-8 mb-3 text-orange-400" />
                <h4 className="font-semibold mb-1">排行榜</h4>
                <p className="text-sm text-gray-300 text-center">查看全球玩家排名和成就</p>
              </div>
            </button>

            <button
              onClick={handleSettings}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg p-6 transition-all duration-300 border border-white/20"
            >
              <div className="flex flex-col items-center">
                <Settings className="w-8 h-8 mb-3 text-gray-400" />
                <h4 className="font-semibold mb-1">設定</h4>
                <p className="text-sm text-gray-300 text-center">調整遊戲設定和個人偏好</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;