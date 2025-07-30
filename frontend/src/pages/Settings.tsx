import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useTranslation } from 'react-i18next';
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
import { trackSettingsChange } from '../lib/analytics';
import { usePageTitle, PAGE_SEO_DATA } from '../hooks/usePageTitle';

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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'game' | 'audio' | 'controls' | 'visual' | 'notifications' | 'privacy' | 'cloud'>('profile');
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // SEO優化：設置頁面標題和描述
  usePageTitle(PAGE_SEO_DATA.settings);
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
    const savedSettings = localStorage.getItem('blockfall-settings');
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
      if (confirm(t('settings.unsavedChanges'))) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleGoHome = () => {
    if (hasChanges) {
      if (confirm(t('settings.unsavedChanges'))) {
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
      localStorage.setItem('blockfall-settings', JSON.stringify(settings));
      trackSettingsChange(activeTab, settings);
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

  // 如果未登入，重定向到登入頁面
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
    }
  }, [isAuthenticated, currentUser, navigate]);

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('common.loading')}</p>
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
              {t('common.home')}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{t('settings.title')}</h1>
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
                  {t('common.reset')}
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {t('common.save')}
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
                  {renderTabButton('profile', <User className="w-4 h-4" />, t('settings.tabs.profile'))}
                  {renderTabButton('game', <Gamepad2 className="w-4 h-4" />, t('settings.tabs.game'))}
                  {renderTabButton('audio', <Volume2 className="w-4 h-4" />, t('settings.tabs.audio'))}
                  {renderTabButton('controls', <Gamepad2 className="w-4 h-4" />, t('settings.tabs.controls'))}
                  {renderTabButton('visual', <Palette className="w-4 h-4" />, t('settings.tabs.visual'))}
                  {renderTabButton('notifications', <Bell className="w-4 h-4" />, t('settings.tabs.notifications'))}
                  {renderTabButton('privacy', <Shield className="w-4 h-4" />, t('settings.tabs.privacy'))}
                  {renderTabButton('cloud', <Cloud className="w-4 h-4" />, t('settings.tabs.cloudSync'))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('settings.logout')}
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
                      <h2 className="text-2xl font-bold text-white">{t('settings.tabs.profile')}</h2>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        {isEditing ? t('common.cancel') : t('settings.profile.editProfile')}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.profile.name')}</label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => handleProfileChange('name', e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.profile.email')}</label>
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
                          <h3 className="text-lg font-semibold text-white mb-4">{t('settings.changePassword')}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.currentPassword')}</label>
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={profileData.currentPassword}
                                  onChange={(e) => handleProfileChange('currentPassword', e.target.value)}
                                  className="w-full bg-gray-700 text-white px-4 py-2 pr-10 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                  placeholder={t('settings.enterCurrentPassword')}
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
                              <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.newPassword')}</label>
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={profileData.newPassword}
                                onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                placeholder={t('settings.enterNewPassword')}
                                minLength={6}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.confirmNewPassword')}</label>
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={profileData.confirmPassword}
                                onChange={(e) => handleProfileChange('confirmPassword', e.target.value)}
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                                placeholder={t('settings.enterNewPasswordAgain')}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <button
                            onClick={handleUpdateProfile}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            {t('settings.saveChanges')}
                          </button>
                          
                          <button
                            onClick={handleDeleteAccount}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t('settings.deleteAccount')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 遊戲設定 */}
                {activeTab === 'game' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">{t('settings.tabs.game')}</h2>
                    
                    <div className="space-y-4">
                      {renderToggle(
                        t('settings.game.ghostPiece'),
                        t('settings.game.ghostPieceDesc'),
                        settings.ghostPiece,
                        (value) => handleSettingChange('ghostPiece', value)
                      )}
                      
                      {renderToggle(
                        t('settings.game.gridLines'),
                        t('settings.game.gridLinesDesc'),
                        settings.gridLines,
                        (value) => handleSettingChange('gridLines', value)
                      )}
                      
                      {renderToggle(
                        t('settings.game.autoRepeat'),
                        t('settings.game.autoRepeatDesc'),
                        settings.autoRepeat,
                        (value) => handleSettingChange('autoRepeat', value)
                      )}
                      
                      {renderSelect(
                        t('settings.game.nextPieceCount'),
                        settings.nextPieceCount.toString(),
                        [
                          { value: '1', label: t('settings.game.pieces1') },
                          { value: '3', label: t('settings.game.pieces3') },
                          { value: '5', label: t('settings.game.pieces5') }
                        ],
                        (value) => handleSettingChange('nextPieceCount', parseInt(value))
                      )}
                      
                      {renderSlider(
                        t('settings.game.dropSpeed'),
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
                    <h2 className="text-2xl font-bold text-white">{t('settings.tabs.audio')}</h2>
                    
                    <div className="space-y-4">
                      {renderToggle(
                        t('settings.audio.soundEffects'),
                        t('settings.audio.soundEffectsDesc'),
                        settings.soundEnabled,
                        (value) => handleSettingChange('soundEnabled', value)
                      )}
                      
                      {settings.soundEnabled && (
                        <div className="ml-6">
                          {renderSlider(
                            t('settings.audio.soundVolume'),
                            settings.soundVolume,
                            (value) => handleSettingChange('soundVolume', value)
                          )}
                        </div>
                      )}
                      
                      {renderToggle(
                        t('settings.audio.backgroundMusic'),
                        t('settings.audio.backgroundMusicDesc'),
                        settings.musicEnabled,
                        (value) => handleSettingChange('musicEnabled', value)
                      )}
                      
                      {settings.musicEnabled && (
                        <div className="ml-6">
                          {renderSlider(
                            t('settings.audio.musicVolume'),
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
                    <h2 className="text-2xl font-bold text-white">{t('settings.tabs.controls')}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(settings.keyBindings).map(([action, key]) => (
                        <div key={action} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <span className="text-white capitalize">
                            {{
                              moveLeft: t('settings.controls.moveLeft'),
                              moveRight: t('settings.controls.moveRight'),
                              moveDown: t('settings.controls.moveDown'),
                              rotate: t('settings.controls.rotate'),
                              hardDrop: t('settings.controls.hardDrop'),
                              hold: t('settings.controls.hold'),
                              pause: t('settings.controls.pause')
                            }[action]}
                          </span>
                          <div className="px-3 py-1 bg-gray-600 rounded text-white text-sm">
                            {getKeyDisplayName(key)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-sm text-gray-400">
                      {t('settings.controls.clickToRebind')}
                    </p>
                  </div>
                )}

                {/* 視覺設定 */}
                {activeTab === 'visual' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">{t('settings.tabs.visual')}</h2>
                    
                    <div className="space-y-4">
                      {renderSelect(
                        t('settings.visual.theme'),
                        settings.theme,
                        [
                          { value: 'dark', label: t('settings.visual.darkTheme') },
                          { value: 'light', label: t('settings.visual.lightTheme') },
                          { value: 'auto', label: t('settings.visual.systemTheme') }
                        ],
                        (value) => handleSettingChange('theme', value)
                      )}
                      
                      {renderToggle(
                        t('settings.visual.animations'),
                        t('settings.visual.animationsDesc'),
                        settings.animations,
                        (value) => handleSettingChange('animations', value)
                      )}
                      
                      {renderToggle(
                        t('settings.visual.particles'),
                        t('settings.visual.particlesDesc'),
                        settings.particleEffects,
                        (value) => handleSettingChange('particleEffects', value)
                      )}
                      
                      {renderToggle(
                        t('settings.visual.backgroundEffects'),
                        t('settings.visual.backgroundEffectsDesc'),
                        settings.backgroundEffects,
                        (value) => handleSettingChange('backgroundEffects', value)
                      )}
                    </div>
                  </div>
                )}

                {/* 通知設定 */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">{t('settings.tabs.notifications')}</h2>
                    
                    <div className="space-y-4">
                      {renderToggle(
                        t('settings.notifications.gameNotifications'),
                        t('settings.notifications.gameNotificationsDesc'),
                        settings.gameNotifications,
                        (value) => handleSettingChange('gameNotifications', value)
                      )}
                      
                      {renderToggle(
                        t('settings.notifications.friendNotifications'),
                        t('settings.notifications.friendNotificationsDesc'),
                        settings.friendNotifications,
                        (value) => handleSettingChange('friendNotifications', value)
                      )}
                      
                      {renderToggle(
                        t('settings.notifications.achievementNotifications'),
                        t('settings.notifications.achievementNotificationsDesc'),
                        settings.achievementNotifications,
                        (value) => handleSettingChange('achievementNotifications', value)
                      )}
                    </div>
                  </div>
                )}

                {/* 隱私設定 */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">{t('settings.tabs.privacy')}</h2>
                    
                    <div className="space-y-4">
                      {renderSelect(
                        t('settings.privacy.profileVisibility'),
                        settings.profileVisibility,
                        [
                          { value: 'public', label: t('settings.privacy.public') },
                          { value: 'friends', label: t('settings.privacy.friendsOnly') },
                          { value: 'private', label: t('settings.privacy.private') }
                        ],
                        (value) => handleSettingChange('profileVisibility', value)
                      )}
                      
                      {renderToggle(
                        t('settings.privacy.showOnlineStatus'),
                        t('settings.privacy.showOnlineStatusDesc'),
                        settings.showOnlineStatus,
                        (value) => handleSettingChange('showOnlineStatus', value)
                      )}
                      
                      {renderToggle(
                        t('settings.privacy.allowFriendRequests'),
                        t('settings.privacy.allowFriendRequestsDesc'),
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
                      <h2 className="text-2xl font-bold text-white">{t('settings.tabs.cloudSync')}</h2>
                      <CloudSyncStatus />
                    </div>
                    
                    <div className="space-y-4">
                      {renderToggle(
                        t('settings.cloudSync.enableSync'),
                        t('settings.cloudSync.enableSyncDesc'),
                        settings.cloudSyncEnabled,
                        (value) => handleSettingChange('cloudSyncEnabled', value)
                      )}
                      
                      {settings.cloudSyncEnabled && (
                        <div className="ml-6 space-y-4">
                          {renderToggle(
                            t('settings.cloudSync.autoSyncSettings'),
                            t('settings.cloudSync.autoSyncSettingsDesc'),
                            settings.autoSyncSettings,
                            (value) => handleSettingChange('autoSyncSettings', value)
                          )}
                          
                          {renderToggle(
                            t('settings.cloudSync.syncProgress'),
                            t('settings.cloudSync.syncProgressDesc'),
                            settings.syncGameProgress,
                            (value) => handleSettingChange('syncGameProgress', value)
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">{t('settings.cloudSync.firebaseStatus')}</h3>
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
                                <span className="text-orange-400 font-medium">{t('settings.cloudSync.configNeeded')}</span>
                              </div>
                              <p className="text-sm text-orange-200 mb-3">
                                {t('settings.cloudSync.configNeededDesc')}
                              </p>
                              <div className="text-xs text-orange-300">
                                <p className="mb-2">{t('settings.cloudSync.setupSteps')}：</p>
                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                  <li>{t('settings.cloudSync.step1')}</li>
                                  <li>{t('settings.cloudSync.step2')}</li>
                                  <li>{t('settings.cloudSync.step3')}</li>
                                  <li>{t('settings.cloudSync.step4')}</li>
                                </ol>
                              </div>
                              <a
                                href="https://console.firebase.google.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center mt-3 text-sm text-orange-300 hover:text-orange-200 underline"
                              >
                                <Globe className="w-4 h-4 mr-1" />
                                {t('settings.cloudSync.goToFirebase')}
                              </a>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-4">
                              <div className="flex items-center mb-2">
                                <Cloud className="w-5 h-5 text-green-400 mr-2" />
                                <span className="text-green-400 font-medium">{t('settings.cloudSync.configOk')}</span>
                              </div>
                              <p className="text-sm text-green-200">
                                {t('settings.cloudSync.configOkDesc')}
                              </p>
                            </div>
                          );
                        }
                      })()}
                      
                      <div className="flex gap-3">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                          {t('settings.cloudSync.syncNow')}
                        </button>
                        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                          {t('settings.cloudSync.resetCloudData')}
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