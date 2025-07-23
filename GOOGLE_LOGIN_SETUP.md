# Google 登入配置指南

本專案已實現完整的 Google 登入功能，包括 Google OAuth、Email/Password 註冊登入和訪客模式。以下是配置 Google 登入的詳細步驟：

## 🚀 功能特色

- ✅ Google OAuth 登入
- ✅ Email/Password 註冊和登入
- ✅ 訪客模式
- ✅ 用戶狀態管理
- ✅ 遊戲記錄保存
- ✅ 成就系統
- ✅ 統計數據追蹤

## 📋 配置步驟

### 1. 創建 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」
3. 輸入專案名稱（例如：tetris-game）
4. 選擇是否啟用 Google Analytics（可選）
5. 點擊「建立專案」

### 2. 設定 Firebase Authentication

1. 在 Firebase Console 中，選擇您的專案
2. 點擊左側選單的「Authentication」
3. 點擊「開始使用」
4. 切換到「Sign-in method」標籤
5. 啟用以下登入方式：
   - **Google**：點擊啟用，設定專案的公開名稱和支援電子郵件
   - **電子郵件/密碼**：點擊啟用

### 3. 設定 Web 應用程式

1. 在 Firebase Console 中，點擊專案設定（齒輪圖示）
2. 選擇「一般」標籤
3. 在「您的應用程式」區域，點擊「</> Web」圖示
4. 輸入應用程式暱稱（例如：Tetris Web App）
5. 勾選「同時為此應用程式設定 Firebase Hosting」（可選）
6. 點擊「註冊應用程式」
7. 複製 Firebase 配置物件

### 4. 配置環境變數

1. 在專案根目錄找到 `.env` 檔案
2. 將 Firebase 配置資訊填入對應的環境變數：

```env
# Firebase 配置
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 5. 設定授權網域

1. 在 Firebase Console 的 Authentication > Settings > Authorized domains
2. 添加您的網域：
   - `localhost`（開發環境）
   - 您的生產網域（如果有的話）

### 6. 測試登入功能

1. 啟動開發服務器：`npm run dev`
2. 前往登入頁面：`http://localhost:5173/login`
3. 測試以下功能：
   - Google 登入
   - Email/Password 註冊
   - Email/Password 登入
   - 訪客模式

## 🔧 技術實現

### 檔案結構

```
src/
├── lib/
│   └── firebase.ts          # Firebase 配置和認證函數
├── store/
│   └── userStore.ts         # 用戶狀態管理（Zustand）
├── pages/
│   └── Login.tsx            # 登入/註冊頁面
└── hooks/
    └── useFirebaseAuth.ts   # Firebase 認證 Hook
```

### 主要功能

#### 1. Firebase 配置 (`src/lib/firebase.ts`)
- Google OAuth 登入
- Email/Password 註冊和登入
- 用戶登出
- 認證狀態監聽

#### 2. 用戶狀態管理 (`src/store/userStore.ts`)
- Zustand 狀態管理
- 持久化存儲
- 遊戲記錄管理
- 統計數據計算
- 成就系統

#### 3. 登入介面 (`src/pages/Login.tsx`)
- 響應式設計
- 表單驗證
- 錯誤處理
- 載入狀態

## 🛡️ 安全性考量

1. **環境變數**：敏感配置已移至 `.env` 檔案
2. **Git 忽略**：`.env` 檔案已加入 `.gitignore`
3. **Firebase 規則**：建議設定適當的 Firestore 安全規則
4. **網域限制**：只允許授權網域進行認證

## 🚨 常見問題

### Q: Google 登入彈出視窗被阻擋
A: 請允許瀏覽器彈出視窗，或檢查彈出視窗阻擋設定

### Q: 「auth/unauthorized-domain」錯誤
A: 請確認您的網域已加入 Firebase Console 的授權網域清單

### Q: 環境變數無法讀取
A: 確認 `.env` 檔案在專案根目錄，且變數名稱以 `VITE_` 開頭

### Q: Firebase 配置錯誤
A: 請檢查 Firebase Console 中的專案設定，確認配置資訊正確

## 📞 支援

如果您在配置過程中遇到問題，請檢查：
1. Firebase Console 的專案設定
2. 環境變數是否正確設定
3. 瀏覽器控制台的錯誤訊息
4. 網路連線狀態

---

**注意**：請妥善保管您的 Firebase 配置資訊，不要將 `.env` 檔案提交到版本控制系統中。