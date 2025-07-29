# Firestore 索引設置指南

## 問題說明

當您在瀏覽器控制台看到類似以下錯誤時：

```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

這表示 Firestore 查詢需要建立索引才能正常工作。

## 解決方案

### 方法 1：自動建立索引（推薦）

1. **點擊錯誤信息中的連結**
   - 複製錯誤信息中的完整 URL
   - 在瀏覽器中打開該 URL
   - 系統會自動跳轉到 Firebase Console 的索引建立頁面

2. **確認並建立索引**
   - 確認索引配置正確
   - 點擊「建立索引」按鈕
   - 等待索引建立完成（通常需要幾分鐘）

### 方法 2：手動建立索引

1. **進入 Firebase Console**
   - 訪問 [Firebase Console](https://console.firebase.google.com/)
   - 選擇您的專案

2. **導航到 Firestore**
   - 點擊左側選單的「Firestore Database」
   - 選擇「索引」標籤

3. **建立複合索引**
   - 點擊「建立索引」
   - 設置以下索引：

#### 遊戲記錄索引
```
集合 ID: gameRecords
欄位:
  - userId (升序)
  - playedAt (降序)
查詢範圍: 集合
```

#### 排行榜索引
```
集合 ID: leaderboard
欄位:
  - gameType (升序)
  - category (升序)
  - score (降序)
查詢範圍: 集合
```

```
集合 ID: leaderboard
欄位:
  - gameType (升序)
  - category (升序)
  - level (降序)
查詢範圍: 集合
```

```
集合 ID: leaderboard
欄位:
  - gameType (升序)
  - category (升序)
  - lines (降序)
查詢範圍: 集合
```

```
集合 ID: leaderboard
欄位:
  - gameType (升序)
  - category (升序)
  - wins (降序)
查詢範圍: 集合
```

```
集合 ID: leaderboard
欄位:
  - gameType (升序)
  - category (升序)
  - winRate (降序)
查詢範圍: 集合
```

## 代碼優化

為了減少對索引的依賴，我們已經對查詢邏輯進行了優化：

### 遊戲記錄查詢優化
- 移除了 `orderBy` 子句，改為在客戶端排序
- 添加了降級查詢機制
- 增加了詳細的錯誤處理和日誌

### 排行榜查詢優化
- 使用簡單查詢避免複雜索引需求
- 在客戶端進行數據處理和排序

## 注意事項

1. **索引建立時間**
   - 索引建立可能需要幾分鐘到幾小時
   - 在索引建立期間，相關查詢可能會失敗

2. **成本考量**
   - 每個索引都會增加 Firestore 的存儲成本
   - 建議只建立必要的索引

3. **測試環境**
   - 開發和生產環境需要分別建立索引
   - 確保在部署前測試所有查詢

## 驗證索引

索引建立完成後：

1. **重新載入應用程式**
2. **測試以下功能**：
   - 用戶登入後查看歷史記錄
   - 遊戲結束後查看統計數據
   - 查看排行榜
   - 重新登入後數據是否保留

3. **檢查控制台**：
   - 確認沒有索引相關錯誤
   - 查看數據載入日誌

## 故障排除

如果索引建立後仍有問題：

1. **清除瀏覽器快取**
2. **檢查 Firebase 規則**
3. **確認索引狀態為「已啟用」**
4. **查看 Firebase Console 中的使用情況統計**

## 聯絡支援

如果問題持續存在，請提供：
- 完整的錯誤信息
- 瀏覽器控制台日誌
- Firebase 專案 ID
- 重現步驟