import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { 
  ArrowLeft, 
  Home, 
  Settings as SettingsIcon, 
  User, 
  Volume2, 
  VolumeX, 
  Gamepad2, 
  Palette, 
  Shield, 
  Bell, 
  Globe, 
  Monitor,
  Save,
  RotateCcw,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  Cloud
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import CloudSyncStatus from '../components/CloudSyncStatus';

interface GameSettings {
  // 音效設定
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  
  // 遊戲設定
  ghostPiece: boolean;
  gridLines: boolean;
  nextPieceCount: number;
  dropSpeed: number;
  autoRepeat: boolean;
  
  // 控制設定
  keyBindings: {
    moveLeft: string;
    moveRight: string;
    moveDown: string;
    rotate: string;
    hardDrop: string;
    hold: string;
    pause: string;
  };
  
  // 視覺設定
  theme: 'dark' | 'light' | 'auto';
  animations: boolean;
  particleEffects: boolean;
  backgroundEffects: boolean;
  
  // 通知設定
  gameNotifications: boolean;
  friendNotifications: boolean;
  achievementNotifications: boolean;
  
  // 隱私設定
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
  
  // 雲端同步設定
  cloudSyncEnabled: boolean;
  autoSyncSettings: boolean;
  syncGameProgress: boolean;
}

const defaultSettings: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 70,
  musicVolume: 50,
  ghostPiece: true,
  gridLines: true,
  nextPieceCount: 3,
  dropSpeed: 1,
  autoRepeat: true,
  keyBindings: {
    moveLeft: 'ArrowLeft',
    moveRight: 'ArrowRight',
    moveDown: 'ArrowDown',
    rotate: 'ArrowUp',
    hardDrop: 'Space',
    hold: 'KeyC',
    pause: 'KeyP'
  },
  theme: 'dark',
  animations: true,
  particleEffects: true,
  backgroundEffects: true,
  gameNotifications: true,
  friendNotifications: true,
  achievementNotifications: true,
  profileVisibility: 'public',
  showOnlineStatus: true,
  allowFriendRequests: true,
  cloudSyncEnabled: true,
  autoSyncSettings: true,
  syncGameProgress: true
};

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'game' | 'audio' | 'controls' | 'visual' | 'notifications' | 'privacy' | 'cloud'>('profile');
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  
  const { 
    isAuthenticated, 
    currentUser, 
    logout, 
    updateProfile, 
    deleteAccount,
    error,
    clearError
  } = useUserStore();

  // 如果未登入，重定向到登入頁面
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    
    // 初始化個人資料數據
    setProfileData({
      name: currentUser.name,
      email: currentUser.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    // 從 localStorage 載入設定
    const savedSettings = localStorage.getItem('tetris-settings');
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
  }, [isAuthenticated, currentUser, navigate]);

  // 監聽錯誤
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleGoBack = () => {
    if (hasChanges) {
      if (confirm('您有未保存的更改，確定要離開嗎？')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleGoHome = () => {
    if (hasChanges) {
      if (confirm('您有未保存的更改，確定要離開嗎？')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleKeyBindingChange = (action: keyof GameSettings['keyBindings'], key: string) => {
    setSettings(prev => ({
      ...prev,
      keyBindings: {
        ...prev.keyBindings,
        [action]: key
      }
    }));
    setHasChanges(true);
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('tetris-settings', JSON.stringify(settings));
      setHasChanges(false);
      toast.success('設定已保存');
    } catch (err) {
      toast.error('保存設定失敗');
    }
  };

  const handleResetSettings = () => {
    if (confirm('確定要重置所有設定為預設值嗎？')) {
      setSettings(defaultSettings);
      setHasChanges(true);
      toast.success('設定已重置');
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileData.name.trim()) {
      toast.error('姓名不能為空');
      return;
    }
    
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      toast.error('新密碼確認不一致');
      return;
    }
    
    if (profileData.newPassword && profileData.newPassword.length < 6) {
      toast.error('新密碼長度至少需要 6 個字符');
      return;
    }
    
    try {
      await updateProfile({
        name: profileData.name,
        email: profileData.email,
        currentPassword: profileData.currentPassword,
        newPassword: profileData.newPassword
      });
      
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setIsEditing(false);
      setHasChanges(false);
      toast.success('個人資料已更新');
    } catch (err) {
      // 錯誤已在 store 中處理
    }
  };

  const handleLogout = async () => {
    if (confirm('確定要登出嗎？')) {
      logout();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('請輸入 "DELETE" 來確認刪除帳號：');
    if (confirmation === 'DELETE') {
      try {
        await deleteAccount();
        navigate('/');
        toast.success('帳號已刪除');
      } catch (err) {
        // 錯誤已在 store 中處理
      }
    }
  };

  const getKeyDisplayName = (key: string) => {
    const keyMap: { [key: string]: string } = {
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'Space': '空格',
      'KeyC': 'C',
      'KeyP': 'P',
      'Enter': '回車',
      'Escape': 'Esc'
    };
    return keyMap[key] || key;
  };

  const renderTabButton = (tab: string, icon: React.ReactNode, label: string) => {
    return (
      <button
        onClick={() => setActiveTab(tab as any)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium',
          activeTab === tab
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:text-white hover:bg-gray-700'
        )}
      >
        {icon}
        {label}
      </button>
    );
  };

  const renderSlider = (label: string, value: number, onChange: (value: number) => void, min = 0, max = 100) => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-gray-300">{label}</label>
          <span className="text-sm text-gray-400">{value}%</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    );
  };

  const renderToggle = (label: string, description: string, value: boolean, onChange: (value: boolean) => void) => {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-white">{label}</h4>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <button
          onClick={() => onChange(!value)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            value ? 'bg-blue-600' : 'bg-gray-600'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              value ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>
    );
  };

  const renderSelect = (label: string, value: string, options: { value: string; label: string }[], onChange: (value: string) => void) => {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  if (!isAuthenticated || !currentUser) {
    return null;
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
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">設定</h1>
          </div>
          
          {/* 保存和重置按鈕 */}
          <div className="flex items-center gap-3">
            {hasChanges && (
              <>
                <button
                  onClick={handleResetSettings}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </>
            )}
          </div>
        </nav>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 側邊欄 */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700 sticky top-6">
                <div className="space-y-2">
                  {renderTabButton('profile', <User className="w-4 h-4" />, '個人資料')}
                  {renderTabButton('game', <Gamepad2 className="w-4 h-4" />, '遊戲設定')}
                  {renderTabButton('audio', <Volume2 className="w-4 h-4" />, '音效設定')}
                  {renderTabButton('controls', <Gamepad2 className="w-4 h-4" />, '控制設定')}
                  {renderTabButton('visual', <Palette className="w-4 h-4" />, '視覺設定')}
                  {renderTabButton('notifications', <Bell className="w-4 h-4" />, '通知設定')}
                  {renderTabButton('privacy', <Shield className="w-4 h-4" />, '隱私設定')}
                  {renderTabButton('cloud', <Cloud className="w-4 h-4" />, '雲端同步')}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    登出
                  </button>
                </div>
              </div>
            </div>

            {/* 主要內容 */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                {/* 個人資料 */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">個人資料</h2>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        {isEditing ? '取消編輯' : '編輯資料'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">姓名</label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => handleProfileChange('name', e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">電子郵件</label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleProfileChange('email', e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                    
                    {isEditing && (
                      <>
                        <div className="border-t border-gray-700 pt-6">
                          <h3 className="text-lg font-semibold text-white mb-4">更改密碼</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">當前密碼</label>
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={profileData.currentPassword}
                                  onChange={(e) => handleProfileChange('currentPassword', e.target.value)}
                                  className="w-full bg-gray-700 text-white px-4 py-2 pr-10 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                  placeholder="輸入當前密碼"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">新密碼</label>
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={profileData.newPassword}
                                onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                placeholder="輸入新密碼"
                                minLength={6}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">確認新密碼</label>
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={profileData.confirmPassword}
                                onChange={(e) => handleProfileChange('confirmPassword', e.target.value)}
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                placeholder="再次輸入新密碼"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <button
                            onClick={handleUpdateProfile}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            保存更改
                          </button>
                          
                          <button
                            onClick={handleDeleteAccount}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            刪除帳號
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 遊戲設定 */}
                {activeTab === 'game' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">遊戲設定</h2>
                    
                    <div className="space-y-4">
                      {renderToggle(
                        '幽靈方塊',
                        '顯示方塊落下位置的預覽',
                        settings.ghostPiece,
                        (value) => handleSettingChange('ghostPiece', value)
                      )}
                      
                      {renderToggle(
                        '網格線',
                        '在遊戲板上顯示網格線',
                        settings.gridLines,
                        (value) => handleSettingChange('gridLines', value)
                      )}
                      
                      {renderToggle(
                        '自動重複',
                        '長按方向鍵時自動重複移動',
                        settings.autoRepeat,
                        (value) => handleSettingChange('autoRepeat', value)
                      )}
                      
                      {renderSelect(
                        '預覽方塊數量',
                        settings.nextPieceCount.toString(),
                        [
                          { value: '1', label: '1 個' },
                          { value: '3', label: '3 個' },
                          { value: '5', label: '5 個' }
                        ],
                        (value) => handleSettingChange('nextPieceCount', parseInt(value))
                      )}
                      
                      {renderSlider(
                        '下降速度',
                        settings.dropSpeed * 100,
                        (value) => handleSettingChange('dropSpeed', value / 100),
                        50,
                        200
                      )}
                    </div>
                  </div>
                )}

                {/* 音效設定 */}
                {activeTab === 'audio' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">音效設定</h2>
                    
                    <div className="space-y-4">
                      {renderToggle(
                        '音效',
                        '啟用遊戲音效',
                        settings.soundEnabled,
                        (value) => handleSettingChange('soundEnabled', value)
                      )}
                      
                      {settings.soundEnabled && (
                        <div className="ml-6">
                          {renderSlider(
                            '音效音量',
                            settings.soundVolume,
                            (value) => handleSettingChange('soundVolume', value)
                          )}
                        </div>
                      )}
                      
                      {renderToggle(
                        '背景音樂',
                        '啟用背景音樂',
                        settings.musicEnabled,
                        (value) => handleSettingChange('musicEnabled', value)
                      )}
                      
                      {settings.musicEnabled && (
                        <div className="ml-6">
                          {renderSlider(
                            '音樂音量',
                            settings.musicVolume,
                            (value) => handleSettingChange('musicVolume', value)
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 控制設定 */}
                {activeTab === 'controls' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">控制設定</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(settings.keyBindings).map(([action, key]) => (
                        <div key={action} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <span className="text-white capitalize">
                            {{
                              moveLeft: '向左移動',
                              moveRight: '向右移動',
                              moveDown: '向下移動',
                              rotate: '旋轉',
                              hardDrop: '硬降',
                              hold: '保留',
                              pause: '暫停'
                            }[action]}
                          </span>
                          <div className="px-3 py-1 bg-gray-600 rounded text-white text-sm">
                            {getKeyDisplayName(key)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-sm text-gray-400">
                      點擊按鍵來重新設定控制鍵位
                    </p>
                  </div>
                )}

                {/* 視覺設定 */}
                {activeTab === 'visual' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">視覺設定</h2>
                    
                    <div className="space-y-4">
                      {renderSelect(
                        '主題',
                        settings.theme,
                        [
                          { value: 'dark', label: '深色主題' },
                          { value: 'light', label: '淺色主題' },
                          { value: 'auto', label: '跟隨系統' }
                        ],
                        (value) => handleSettingChange('theme', value)
                      )}
                      
                      {renderToggle(
                        '動畫效果',
                        '啟用界面動畫效果',
                        settings.animations,
                        (value) => handleSettingChange('animations', value)
                      )}
                      
                      {renderToggle(
                        '粒子效果',
                        '啟用消除行時的粒子效果',
                        settings.particleEffects,
                        (value) => handleSettingChange('particleEffects', value)
                      )}
                      
                      {renderToggle(
                        '背景效果',
                        '啟用動態背景效果',
                        settings.backgroundEffects,
                        (value) => handleSettingChange('backgroundEffects', value)
                      )}
                    </div>
                  </div>
                )}

                {/* 通知設定 */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">通知設定</h2>
                    
                    <div className="space-y-4">
                      {renderToggle(
                        '遊戲通知',
                        '接收遊戲相關通知',
                        settings.gameNotifications,
                        (value) => handleSettingChange('gameNotifications', value)
                      )}
                      
                      {renderToggle(
                        '好友通知',
                        '接收好友活動通知',
                        settings.friendNotifications,
                        (value) => handleSettingChange('friendNotifications', value)
                      )}
                      
                      {renderToggle(
                        '成就通知',
                        '接收成就解鎖通知',
                        settings.achievementNotifications,
                        (value) => handleSettingChange('achievementNotifications', value)
                      )}
                    </div>
                  </div>
                )}

                {/* 隱私設定 */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">隱私設定</h2>
                    
                    <div className="space-y-4">
                      {renderSelect(
                        '個人資料可見性',
                        settings.profileVisibility,
                        [
                          { value: 'public', label: '公開' },
                          { value: 'friends', label: '僅好友' },
                          { value: 'private', label: '私人' }
                        ],
                        (value) => handleSettingChange('profileVisibility', value)
                      )}
                      
                      {renderToggle(
                        '顯示在線狀態',
                        '讓其他玩家看到您的在線狀態',
                        settings.showOnlineStatus,
                        (value) => handleSettingChange('showOnlineStatus', value)
                      )}
                      
                      {renderToggle(
                        '允許好友請求',
                        '允許其他玩家向您發送好友請求',
                        settings.allowFriendRequests,
                        (value) => handleSettingChange('allowFriendRequests', value)
                      )}
                    </div>
                  </div>
                )}

                {/* 雲端同步設定 */}
                {activeTab === 'cloud' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">雲端同步</h2>
                      <CloudSyncStatus />
                    </div>
                    
                    <div className="space-y-4">
                      {renderToggle(
                        '啟用雲端同步',
                        '將您的設定和遊戲進度同步到雲端',
                        settings.cloudSyncEnabled,
                        (value) => handleSettingChange('cloudSyncEnabled', value)
                      )}
                      
                      {settings.cloudSyncEnabled && (
                        <div className="ml-6 space-y-4">
                          {renderToggle(
                            '自動同步設定',
                            '自動將遊戲設定同步到雲端',
                            settings.autoSyncSettings,
                            (value) => handleSettingChange('autoSyncSettings', value)
                          )}
                          
                          {renderToggle(
                            '同步遊戲進度',
                            '將遊戲進度和成就同步到雲端',
                            settings.syncGameProgress,
                            (value) => handleSettingChange('syncGameProgress', value)
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Firebase 配置狀態</h3>
                      {(() => {
                        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
                        const isUsingExampleConfig = !apiKey || 
                          apiKey === "your-api-key-here" || 
                          apiKey === "AIzaSyExample123456789";
                        
                        if (isUsingExampleConfig) {
                          return (
                            <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4 mb-4">
                              <div className="flex items-center mb-2">
                                <Shield className="w-5 h-5 text-orange-400 mr-2" />
                                <span className="text-orange-400 font-medium">配置需要設置</span>
                              </div>
                              <p className="text-sm text-orange-200 mb-3">
                                目前使用的是示例 Firebase 配置，雲端同步功能無法正常工作。
                              </p>
                              <div className="text-xs text-orange-300">
                                <p className="mb-2">請按照以下步驟設置：</p>
                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                  <li>前往 Firebase Console 創建項目</li>
                                  <li>啟用 Authentication 和 Firestore Database</li>
                                  <li>更新 .env 文件中的配置值</li>
                                  <li>重新啟動開發服務器</li>
                                </ol>
                              </div>
                              <a
                                href="https://console.firebase.google.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center mt-3 text-sm text-orange-300 hover:text-orange-200 underline"
                              >
                                <Globe className="w-4 h-4 mr-1" />
                                前往 Firebase Console
                              </a>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-4">
                              <div className="flex items-center mb-2">
                                <Cloud className="w-5 h-5 text-green-400 mr-2" />
                                <span className="text-green-400 font-medium">Firebase 配置正常</span>
                              </div>
                              <p className="text-sm text-green-200">
                                Firebase 配置已正確設置，雲端同步功能可正常使用。
                              </p>
                            </div>
                          );
                        }
                      })()}
                      
                      <div className="flex gap-3">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                          立即同步
                        </button>
                        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                          重置雲端數據
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;