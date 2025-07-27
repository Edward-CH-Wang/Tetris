import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface FirebaseConfigWarningProps {
  isVisible: boolean;
  onDismiss: () => void;
}

const FirebaseConfigWarning: React.FC<FirebaseConfigWarningProps> = ({ isVisible, onDismiss }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Firebase 配置需要設置
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              目前使用的是示例配置，雲端同步功能無法正常工作。您的戰績數據只會保存在本地，登出後將會丟失。
            </p>
            <div className="text-xs text-yellow-600 mb-3">
              <p className="mb-1">設置步驟：</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>前往 Firebase Console 創建項目</li>
                <li>啟用 Authentication 和 Firestore</li>
                <li>更新 .env 文件中的配置</li>
              </ol>
            </div>
            <div className="flex items-center justify-between">
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-yellow-700 hover:text-yellow-800 underline"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Firebase Console
              </a>
              <button
                onClick={onDismiss}
                className="text-xs text-yellow-600 hover:text-yellow-800 font-medium"
              >
                暫時忽略
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseConfigWarning;