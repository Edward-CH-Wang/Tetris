import { useEffect } from 'react';
import { onAuthStateChanged } from '../lib/firebase';
import { useUserStore } from '../store/userStore';
import { User } from '../store/userStore';

/**
 * Firebase 認證狀態監聽 Hook
 * 監聽 Firebase 認證狀態變化並同步到應用狀態
 */
export const useFirebaseAuth = () => {
  const { setUser, logout } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // 用戶已登入，同步到應用狀態
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '用戶',
          avatar: firebaseUser.photoURL || 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20gamer%20avatar%20cartoon%20style&image_size=square',
          isGuest: false,
          createdAt: new Date()
        };
        
        console.log('🔥 Firebase 認證狀態變化：用戶登入', user.email);
        await setUser(user);
      } else {
        // 用戶已登出，但不要觸發完整的logout流程
        // 因為這可能是由我們自己的logout函數觸發的
        console.log('🔥 Firebase 認證狀態變化：用戶登出');
        const currentUser = useUserStore.getState().currentUser;
        if (currentUser && !currentUser.isGuest) {
          // 只有當前用戶不是訪客時才清除狀態
          useUserStore.setState({
            currentUser: null,
            isAuthenticated: false
          });
        }
      }
    });

    // 清理函數
    return () => unsubscribe();
  }, [setUser]);
};

/**
 * 檢查是否為有效的 Firebase 用戶
 */
export const isFirebaseUser = (user: User | null): boolean => {
  return user !== null && !user.isGuest && user.id.length > 10;
};