import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { useUserStore } from './store/userStore';
import FirebaseConfigWarning from './components/FirebaseConfigWarning';
import { trackPageView } from './lib/analytics';

// Pages
import Home from './pages/Home';
import SinglePlayer from './pages/SinglePlayer';
import Multiplayer from './pages/Multiplayer';
import Login from './pages/Login';
import Stats from './pages/Stats';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';

// 頁面追蹤組件
function PageTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // 追蹤頁面瀏覽
    trackPageView(location.pathname);
  }, [location]);
  
  return null;
}

function App() {
  // 初始化 Firebase 認證監聽
  useFirebaseAuth();
  
  const userStore = useUserStore();
  const { initializeFirestore } = userStore;
  
  // 將 userStore 暴露到全局 window 對象，供其他 store 使用
  useEffect(() => {
    (window as any).userStore = userStore;
  }, [userStore]);
  const [showFirebaseWarning, setShowFirebaseWarning] = useState(false);
  
  // 檢查 Firebase 配置
  useEffect(() => {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const isUsingExampleConfig = !apiKey || 
      apiKey === "your-api-key-here" || 
      apiKey === "AIzaSyExample123456789";
    
    if (isUsingExampleConfig) {
      setShowFirebaseWarning(true);
    }
  }, []);
  
  // 初始化 Firestore 連接
  useEffect(() => {
    initializeFirestore().catch(error => {
      console.error('應用啟動時初始化 Firestore 失敗:', error);
    });
  }, [initializeFirestore]);
  
  return (
    <Router>
      <div className="App">
        {/* 頁面追蹤 */}
        <PageTracker />
        
        {/* Firebase 配置警告 */}
        <FirebaseConfigWarning 
          isVisible={showFirebaseWarning}
          onDismiss={() => setShowFirebaseWarning(false)}
        />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/single-player" element={<SinglePlayer />} />
          <Route path="/multiplayer" element={<Multiplayer />} />
          <Route path="/login" element={<Login />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1F2937',
              color: '#F3F4F6',
              border: '1px solid #374151'
            }
          }}
        />
      </div>
    </Router>
  );
}

export default App;
