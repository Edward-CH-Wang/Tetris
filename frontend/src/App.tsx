import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { useUserStore } from './store/userStore';

// Pages
import Home from './pages/Home';
import SinglePlayer from './pages/SinglePlayer';
import Multiplayer from './pages/Multiplayer';
import Login from './pages/Login';
import Stats from './pages/Stats';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';

function App() {
  // 初始化 Firebase 認證監聽
  useFirebaseAuth();
  
  const { initializeFirestore } = useUserStore();
  
  // 初始化 Firestore 連接
  useEffect(() => {
    initializeFirestore().catch(error => {
      console.error('應用啟動時初始化 Firestore 失敗:', error);
    });
  }, [initializeFirestore]);
  
  return (
    <Router>
      <div className="App">
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
