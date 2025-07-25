# Zeabur GitHub 部署指南

## 概述

本指南將幫助您使用 GitHub 集成方式將俄羅斯方塊多人對戰遊戲部署到 Zeabur 平台，包括前端和 Socket.IO 後端服務。

## 🚀 GitHub 部署步驟

### 1. GitHub 倉庫準備

#### 1.1 確保代碼已推送到 GitHub

```bash
# 檢查當前狀態
git status

# 添加所有更改
git add .
git commit -m "準備部署到Zeabur - GitHub集成"
git push origin main
```

#### 1.2 驗證倉庫結構
確保您的 GitHub 倉庫包含以下關鍵文件：
- `package.json` - 項目依賴和腳本
- `server.js` - Socket.IO 後端服務
- `zeabur.json` - Zeabur 配置文件
- `src/` - 前端源代碼
- `.env.example` - 環境變數範例

### 2. Zeabur 帳號設置

#### 2.1 註冊並連接 GitHub
1. 前往 [Zeabur](https://zeabur.com) 官網
2. 點擊「Sign in with GitHub」
3. 授權 Zeabur 訪問您的 GitHub 帳號
4. 選擇要授權的倉庫（建議選擇 All repositories 或特定倉庫）

#### 2.2 驗證 GitHub 集成
1. 登入後在控制台確認可以看到您的 GitHub 倉庫
2. 確保倉庫狀態顯示為「Connected」

### 3. 創建 Zeabur 項目

#### 3.1 從 GitHub 創建項目
1. 在 Zeabur 控制台點擊「Create Project」
2. 選擇「Deploy from GitHub」
3. 選擇您的俄羅斯方塊遊戲倉庫
4. 項目名稱：`tetris-multiplayer-github`
5. 點擊「Create」

### 4. 自動部署後端服務 (Socket.IO)

#### 4.1 Zeabur 自動檢測
由於項目包含 `zeabur.json` 配置文件，Zeabur 會自動：
1. 檢測到這是一個多服務項目
2. 根據配置文件自動創建前端和後端服務
3. 設置基本的構建和運行命令

#### 4.2 後端服務自動配置
Zeabur 會自動為後端服務設置：
- **服務名稱**: `backend`
- **運行時**: Node.js
- **啟動命令**: `node server.js`
- **端口**: `3001`
- **分支**: `main`（跟隨 GitHub 主分支）

#### ⚠️ 重要：Socket.IO 服務配置修正

如果 Socket.IO 服務部署失敗，出現錯誤「process '/bin/sh -c npm run build' did not complete successfully」：

**問題原因**：Zeabur 錯誤地嘗試執行前端構建命令 `npm run build`，但 Socket.IO 服務器不需要構建步驟。

**解決方案**：
1. 部署完成後，進入後端服務的「Settings」頁面
2. 在「General」標籤中找到「Command」欄位
3. 確保命令設置為：`node server.js`
4. 在「Networking」標籤中確認端口為：`3001`
5. 點擊「Save」保存設置
6. 重新部署服務

**正確的服務配置**：
- **前端服務**：使用 `npm run build` 構建靜態文件
- **後端服務**：直接使用 `node server.js` 啟動，無需構建步驟

#### 4.3 手動調整後端環境變數
在後端服務的「Environment」標籤中確認/添加：
```
NODE_ENV=production
PORT=3001
```

#### 4.4 啟用自動部署
1. 在後端服務設置中找到「Git」標籤
2. 確認「Auto Deploy」已啟用
3. 選擇觸發分支：`main`
4. 保存設置

#### 4.5 獲取後端域名
部署完成後，在服務詳情頁面複製後端域名：
`https://backend-tetris-multiplayer-xxx.zeabur.app`

### 5. 自動部署前端服務

#### 5.1 前端服務自動創建
基於 `zeabur.json` 配置，Zeabur 會自動創建前端服務：
- **服務名稱**: `frontend`
- **類型**: Static Site
- **框架**: 自動檢測為 Vite
- **構建命令**: `npm run build`
- **輸出目錄**: `dist`
- **分支**: `main`

#### 5.2 配置前端環境變數
在前端服務的「Environment」標籤中設置：

**必需的 Socket.IO 配置**：
```
VITE_SOCKET_URL=wss://backend-tetris-multiplayer-xxx.zeabur.app
```

**Firebase 配置**（從 `.env.local` 複製）：
```
VITE_FIREBASE_API_KEY=AIzaSyBSuWPIqfOkLtm0tMZNXif-6HG2dc8-RKs
VITE_FIREBASE_AUTH_DOMAIN=tetris-game-bb11f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tetris-game-bb11f
VITE_FIREBASE_STORAGE_BUCKET=tetris-game-bb11f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=189316509379
VITE_FIREBASE_APP_ID=1:189316509379:web:495b4d179a622efd96fc76
```

**重要**: 
1. 將 `backend-tetris-multiplayer-xxx.zeabur.app` 替換為您實際的後端域名
2. Firebase 配置值已從您的 `.env.local` 文件中提取

#### 5.3 啟用前端自動部署
1. 在前端服務設置中確認「Auto Deploy」已啟用
2. 每次推送到 `main` 分支時會自動重新部署
3. 構建日誌可在「Deployments」標籤中查看

### 6. GitHub 自動部署工作流程

#### 6.1 驗證服務部署狀態
在繼續之前，請確認兩個服務都已成功部署：

**檢查後端服務**：
1. 在 Zeabur 控制台中確認後端服務狀態為「Running」（綠色）
2. 如果狀態為「Failed」（紅色），請按照上述 Socket.IO 配置修正步驟操作
3. 查看「Logs」標籤確認沒有啟動錯誤

**檢查前端服務**：
1. 確認前端服務構建成功，狀態為「Running」
2. 訪問前端域名確認頁面正常載入

#### 6.2 獲取服務域名
部署完成後，記錄兩個服務的域名：
- **前端域名**: `https://frontend-tetris-multiplayer-xxx.zeabur.app`
- **後端域名**: `https://backend-tetris-multiplayer-xxx.zeabur.app`

#### 6.2 更新 CORS 配置
在本地更新 `server.js` 中的 CORS 配置：

```javascript
cors: {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        "https://frontend-tetris-multiplayer-xxx.zeabur.app", // 替換為實際前端域名
        "*.zeabur.app" // 支援所有 Zeabur 子域名
      ]
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  methods: ["GET", "POST"]
}
```

#### 6.3 觸發自動重新部署
```bash
# 提交 CORS 配置更改
git add server.js
git commit -m "更新CORS配置支援Zeabur域名"
git push origin main
```

**自動化流程**：
1. 推送代碼到 GitHub `main` 分支
2. Zeabur 自動檢測到更改
3. 自動重新構建和部署後端服務
4. 無需手動干預，幾分鐘內完成部署

### 7. GitHub 自動部署優勢

#### 7.1 持續集成/持續部署 (CI/CD)
使用 GitHub 集成的優勢：
- ✅ **自動部署**: 推送代碼即自動部署
- ✅ **版本控制**: 每次部署都有對應的 Git commit
- ✅ **回滾簡單**: 可以快速回滾到任何歷史版本
- ✅ **分支部署**: 支援不同分支的獨立部署
- ✅ **協作友好**: 團隊成員推送代碼即可觸發部署

#### 7.2 部署監控
在 Zeabur 控制台監控部署狀態：
1. **Deployments 標籤**: 查看部署歷史和狀態
2. **Logs 標籤**: 實時查看構建和運行日誌
3. **Metrics 標籤**: 監控服務性能指標
4. **GitHub Integration**: 在 GitHub commit 頁面查看部署狀態

#### 7.3 部署通知設置
1. 在項目設置中啟用「Deployment Notifications」
2. 可選擇通知方式：Email、Slack、Discord
3. 設置通知觸發條件：成功、失敗、或全部

### 8. 自定義域名（可選）

#### 8.1 設置自定義域名
1. 在服務設置中點擊「Domains」
2. 添加您的自定義域名
3. 配置 DNS 記錄指向 Zeabur

#### 8.2 更新環境變數
如果使用自定義域名，記得更新相應的環境變數。

## 🔧 配置文件說明

### zeabur.json
項目已包含 `zeabur.json` 配置文件：

```json
{
  "name": "tetris-multiplayer",
  "services": [
    {
      "name": "frontend",
      "type": "static",
      "buildCommand": "npm run build",
      "outputDirectory": "dist",
      "environmentVariables": {
        "VITE_SOCKET_URL": "wss://tetris-server.zeabur.app"
      }
    },
    {
      "name": "backend",
      "type": "nodejs",
      "startCommand": "node server.js",
      "port": 3001,
      "environmentVariables": {
        "NODE_ENV": "production",
        "PORT": "3001"
      }
    }
  ]
}
```

## 🧪 測試部署

### 1. 檢查服務狀態
- 前端服務：訪問前端域名，確保頁面正常載入
- 後端服務：訪問 `https://your-backend-domain/health` 檢查健康狀態

### 2. 測試多人對戰功能
1. 在不同設備/瀏覽器中打開前端網站
2. 登入或使用訪客模式
3. 創建房間或快速匹配
4. 確認 Socket.IO 連接正常

### 3. 檢查日誌
在 Zeabur 控制台的「Logs」標籤中查看服務日誌，確保沒有錯誤。

## 🔍 GitHub 部署故障排除

### GitHub 集成相關問題

#### 1. GitHub 倉庫連接失敗
**問題**: Zeabur 無法訪問 GitHub 倉庫
**解決方案**:
- 重新授權 Zeabur 訪問 GitHub
- 確認倉庫是 Public 或已正確授權
- 檢查 GitHub App 權限設置

#### 2. 自動部署未觸發
**問題**: 推送代碼後沒有自動部署
**解決方案**:
- 確認「Auto Deploy」已啟用
- 檢查推送的分支是否為監控分支（通常是 `main`）
- 查看 GitHub Webhooks 是否正常工作
- 在 Zeabur 控制台手動觸發部署測試

#### 3. 構建失敗
**問題**: GitHub 推送後構建失敗
**解決方案**:
- 查看「Deployments」標籤中的構建日誌
- 確認 `package.json` 中的依賴完整
- 檢查 Node.js 版本兼容性
- 驗證 `zeabur.json` 配置正確性

### 服務運行問題

#### 4. Socket.IO 連接失敗
**問題**: 前端無法連接到後端 Socket.IO 服務
**解決方案**:
- 檢查 `VITE_SOCKET_URL` 環境變數是否正確
- 確認後端服務正在運行（查看服務狀態）
- 驗證 CORS 配置包含正確的前端域名
- 測試後端健康檢查端點：`/health`

#### 5. Firebase 認證失敗
**問題**: 用戶無法登入或註冊
**解決方案**:
- 確認所有 Firebase 環境變數已正確設置
- 在 Firebase 控制台添加 Zeabur 域名到授權域名列表
- 檢查 Firebase API Key 的 HTTP referrer 限制

#### 6. 環境變數未生效
**問題**: 設置的環境變數在應用中無法讀取
**解決方案**:
- 確認環境變數名稱正確（前端變數需 `VITE_` 前綴）
- 設置環境變數後重新部署服務
- 在構建日誌中確認環境變數已正確載入

### 調試技巧

1. **查看實時日誌**：
   ```bash
   # 在 Zeabur 控制台的 Logs 標籤中查看
   ```

2. **測試 API 端點**：
   ```bash
   curl https://your-backend-domain/health
   curl https://your-backend-domain/stats
   ```

3. **檢查環境變數**：
   在前端控制台中檢查環境變數是否正確載入

## 🚀 快速開始總結

### GitHub 部署三步驟

#### 第一步：準備 GitHub 倉庫
```bash
git add .
git commit -m "準備部署到Zeabur - GitHub集成"
git push origin main
```

#### 第二步：在 Zeabur 創建項目
1. 登入 [Zeabur](https://zeabur.com) 並連接 GitHub
2. 選擇「Deploy from GitHub」
3. 選擇您的俄羅斯方塊倉庫
4. Zeabur 自動檢測 `zeabur.json` 並創建服務

#### 第三步：配置環境變數
**後端服務**:
```
NODE_ENV=production
PORT=3001
```

**前端服務**:
```
VITE_SOCKET_URL=wss://your-backend-domain
VITE_FIREBASE_API_KEY=AIzaSyBSuWPIqfOkLtm0tMZNXif-6HG2dc8-RKs
VITE_FIREBASE_AUTH_DOMAIN=tetris-game-bb11f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tetris-game-bb11f
VITE_FIREBASE_STORAGE_BUCKET=tetris-game-bb11f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=189316509379
VITE_FIREBASE_APP_ID=1:189316509379:web:495b4d179a622efd96fc76
```

### 🎯 部署完成檢查清單

- [ ] 後端服務運行正常（綠色狀態）
- [ ] 前端服務構建成功（綠色狀態）
- [ ] 訪問前端域名，頁面正常載入
- [ ] 測試 Google 登入功能
- [ ] 測試多人對戰房間創建
- [ ] 確認 Socket.IO 連接正常
- [ ] 在 Firebase 控制台添加 Zeabur 域名

### 🔄 日常維護

**代碼更新流程**:
```bash
# 本地開發和測試
npm run dev

# 提交更改
git add .
git commit -m "功能更新描述"
git push origin main

# Zeabur 自動部署（無需手動操作）
```

## 📊 監控和維護

### 1. 性能監控
- 使用 Zeabur 內建的監控功能
- 定期檢查 `/health` 和 `/stats` 端點
- 監控 GitHub 部署狀態和通知

### 2. 日誌管理
- 定期查看應用日誌
- 監控 GitHub Actions 和 Webhooks 狀態
- 設置錯誤警報（如果 Zeabur 支援）

### 3. 更新部署
```bash
# 推送代碼更改會自動觸發重新部署
git add .
git commit -m "更新功能"
git push origin main
```

## 🎉 完成

恭喜！您的俄羅斯方塊多人對戰遊戲現在已經成功部署到 Zeabur 平台。用戶可以通過前端域名訪問遊戲，享受實時多人對戰體驗。

### 下一步
- 設置自定義域名
- 配置 CDN 加速
- 添加更多遊戲功能
- 設置數據庫持久化（如需要）

---

**注意**: 請確保定期備份您的代碼和配置，並在生產環境中使用環境變數管理敏感信息。