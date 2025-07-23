# Firebase Google 登入設置指南

本指南將幫助您設置 Firebase 項目以啟用 Google 登入功能。

## 1. 創建 Firebase 項目

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「創建項目」或「Add project」
3. 輸入項目名稱（例如：tetris-game）
4. 選擇是否啟用 Google Analytics（可選）
5. 點擊「創建項目」

## 2. 設置 Web 應用

1. 在 Firebase 項目控制台中，點擊「Web」圖標（</>）
2. 輸入應用暱稱（例如：Tetris Web App）
3. 選擇是否設置 Firebase Hosting（可選）
4. 點擊「註冊應用」
5. 複製提供的配置對象，您將需要這些信息

## 3. 啟用 Authentication

1. 在左側導航欄中，點擊「Authentication」
2. 點擊「開始使用」
3. 切換到「Sign-in method」標籤
4. 點擊「Google」
5. 啟用 Google 登入
6. 輸入項目的公開名稱
7. 選擇項目支援電子郵件
8. 點擊「儲存」

## 4. 設置授權域名

1. 在 Authentication > Settings > Authorized domains
2. 添加您的域名：
   - `localhost`（用於開發）
   - 您的生產域名（如果有）

## 5. 配置環境變數

1. 複製 `.env.example` 文件並重命名為 `.env`
2. 填入您的 Firebase 配置信息：

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 如何獲取配置信息：

1. 在 Firebase Console 中，點擊項目設置（齒輪圖標）
2. 滾動到「您的應用」部分
3. 點擊您的 Web 應用
4. 在「SDK 設置和配置」中找到配置對象
5. 複製各個值到 `.env` 文件中

## 6. 測試設置

1. 重新啟動開發服務器：
   ```bash
   npm run dev
   ```

2. 前往登入頁面
3. 點擊「使用 Google 登入」按鈕
4. 應該會彈出 Google 登入視窗

## 7. 常見問題

### 錯誤：「This app domain is not authorized"
- 確保在 Firebase Console > Authentication > Settings > Authorized domains 中添加了 `localhost`

### 錯誤：「API key not valid"
- 檢查 `.env` 文件中的 `VITE_FIREBASE_API_KEY` 是否正確
- 確保 API 密鑰已啟用必要的服務

### 錯誤：「Project not found"
- 檢查 `VITE_FIREBASE_PROJECT_ID` 是否正確

### 彈出視窗被阻擋
- 確保瀏覽器允許彈出視窗
- 可以在瀏覽器設置中將 localhost 添加到允許彈出視窗的網站列表

## 8. 安全注意事項

1. **不要將 `.env` 文件提交到版本控制系統**
2. 在生產環境中，確保正確設置環境變數
3. 定期檢查 Firebase 使用量和安全規則
4. 考慮設置 Firebase Security Rules 來保護用戶數據

## 9. 進階設置（可選）

### 自定義 Google 登入按鈕
- 可以在 `src/lib/firebase.ts` 中修改 `googleProvider.setCustomParameters()` 來自定義登入體驗

### 添加其他登入方式
- Facebook 登入
- Twitter 登入
- GitHub 登入
- 電子郵件/密碼登入（已實現但需要後端支持）

### 用戶資料同步
- 考慮使用 Firestore 來存儲用戶的遊戲數據
- 實現跨設備數據同步

---

如果您在設置過程中遇到任何問題，請參考 [Firebase 官方文檔](https://firebase.google.com/docs/auth/web/google-signin) 或檢查瀏覽器控制台中的錯誤訊息。