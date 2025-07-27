import React from 'react';
import { Cloud, CloudOff, Wifi, WifiOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useUserStore } from '../store/userStore';

interface CloudSyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

const CloudSyncStatus: React.FC<CloudSyncStatusProps> = ({ 
  className = '',
  showDetails = false 
}) => {
  const { 
    currentUser,
    isFirestoreConnected, 
    isCloudSyncEnabled, 
    lastSyncTime,
    syncToCloud,
    enableCloudSync,
    disableCloudSync
  } = useUserStore();

  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleManualSync = async () => {
    if (!currentUser || currentUser.isGuest || !isCloudSyncEnabled) return;
    
    setIsSyncing(true);
    try {
      await syncToCloud();
    } catch (error) {
      console.error('手動同步失敗:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleSync = () => {
    if (isCloudSyncEnabled) {
      disableCloudSync();
    } else {
      enableCloudSync();
    }
  };

  const formatLastSyncTime = (time: Date | null) => {
    if (!time) return '從未同步';
    
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '剛剛同步';
    if (minutes < 60) return `${minutes}分鐘前`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小時前`;
    
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  const getStatusIcon = () => {
    if (currentUser?.isGuest) {
      return <CloudOff className="w-4 h-4 text-gray-400" />;
    }
    
    if (!isFirestoreConnected) {
      return <WifiOff className="w-4 h-4 text-red-400" />;
    }
    
    if (!isCloudSyncEnabled) {
      return <CloudOff className="w-4 h-4 text-yellow-400" />;
    }
    
    if (isSyncing) {
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    }
    
    return <Cloud className="w-4 h-4 text-green-400" />;
  };

  const getStatusText = () => {
    if (currentUser?.isGuest) {
      return '訪客模式';
    }
    
    // 檢查 Firebase 配置
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const isUsingExampleConfig = !apiKey || 
      apiKey === "your-api-key-here" || 
      apiKey === "AIzaSyExample123456789";
    
    if (isUsingExampleConfig) {
      return '配置錯誤';
    }
    
    if (!isFirestoreConnected) {
      return '連接失敗';
    }
    
    if (!isCloudSyncEnabled) {
      return '同步已停用';
    }
    
    if (isSyncing) {
      return '同步中...';
    }
    
    return '雲端同步';
  };

  const getStatusColor = () => {
    if (currentUser?.isGuest) return 'text-gray-400';
    
    // 檢查 Firebase 配置
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const isUsingExampleConfig = !apiKey || 
      apiKey === "your-api-key-here" || 
      apiKey === "AIzaSyExample123456789";
    
    if (isUsingExampleConfig) return 'text-orange-400';
    if (!isFirestoreConnected) return 'text-red-400';
    if (!isCloudSyncEnabled) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 rounded-lg p-4 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {!currentUser?.isGuest && isFirestoreConnected && (
          <div className="flex items-center space-x-2">
            {isCloudSyncEnabled && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
              >
                {isSyncing ? '同步中...' : '手動同步'}
              </button>
            )}
            
            <button
              onClick={handleToggleSync}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                isCloudSyncEnabled 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isCloudSyncEnabled ? '停用同步' : '啟用同步'}
            </button>
          </div>
        )}
      </div>
      
      <div className="space-y-2 text-sm text-gray-400">
        <div className="flex items-center justify-between">
          <span>連接狀態:</span>
          <div className="flex items-center space-x-1">
            {isFirestoreConnected ? (
              <>
                <Wifi className="w-3 h-3 text-green-400" />
                <span className="text-green-400">已連接</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-400" />
                <span className="text-red-400">未連接</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span>同步狀態:</span>
          <div className="flex items-center space-x-1">
            {isCloudSyncEnabled ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-green-400">已啟用</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400">已停用</span>
              </>
            )}
          </div>
        </div>
        
        {isCloudSyncEnabled && (
          <div className="flex items-center justify-between">
            <span>最後同步:</span>
            <span className="text-gray-300">
              {formatLastSyncTime(lastSyncTime)}
            </span>
          </div>
        )}
        
        {currentUser?.isGuest && (
          <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-yellow-300 text-xs">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            訪客模式下無法使用雲端同步功能，請登入帳戶以保存戰績數據。
          </div>
        )}
        
        {!isFirestoreConnected && !currentUser?.isGuest && (
          <div className="mt-3 p-2 bg-red-900/20 border border-red-700/30 rounded text-red-300 text-xs">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            無法連接到雲端服務，請檢查網路連接或 Firebase 配置。
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudSyncStatus;