import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 配置
// 注意：這些是示例值，需要替換為您的實際 Firebase 項目配置
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key-here",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firebase Auth
export const auth = getAuth(app);

// 初始化 Firestore
export const db = getFirestore(app);

// Google 認證提供者
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Google 登入函數
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google 登入錯誤:', error);
    
    // 處理特定錯誤
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('登入已取消');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('彈出視窗被阻擋，請允許彈出視窗後重試');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('網路連線失敗，請檢查網路連線');
    } else {
      throw new Error('Google 登入失敗，請稍後再試');
    }
  }
};

// 登出函數
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('登出錯誤:', error);
    throw new Error('登出失敗');
  }
};

// 檢查用戶是否已登入
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Email/Password 註冊
export const registerWithEmailAndPassword = async (email: string, password: string, name: string): Promise<FirebaseUser> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // 更新用戶顯示名稱
    await updateProfile(result.user, {
      displayName: name
    });
    
    return result.user;
  } catch (error: any) {
    console.error('Email 註冊錯誤:', error);
    
    // 處理特定錯誤
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('此電子郵件已被使用');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('密碼強度不足，請使用至少6個字符');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('電子郵件格式無效');
    } else {
      throw new Error('註冊失敗，請稍後再試');
    }
  }
};

// Email/Password 登入
export const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Email 登入錯誤:', error);
    
    // 處理特定錯誤
    if (error.code === 'auth/user-not-found') {
      throw new Error('找不到此用戶');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('密碼錯誤');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('電子郵件格式無效');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('登入嘗試次數過多，請稍後再試');
    } else {
      throw new Error('登入失敗，請檢查您的電子郵件和密碼');
    }
  }
};

// 監聽認證狀態變化
export const onAuthStateChanged = (callback: (user: FirebaseUser | null) => void) => {
  return auth.onAuthStateChanged(callback);
};