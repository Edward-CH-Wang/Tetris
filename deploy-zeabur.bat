@echo off
chcp 65001 >nul
echo 🚀 開始部署到 Zeabur...
echo.

REM 檢查是否有未提交的更改
git status --porcelain > temp_status.txt
for /f %%i in (temp_status.txt) do (
    echo 📝 發現未提交的更改，正在提交...
    git add .
    git commit -m "部署到Zeabur: %date% %time%"
    goto :push
)
echo ✅ 沒有未提交的更改
del temp_status.txt

:push
REM 推送到遠程倉庫
echo 📤 推送代碼到 GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo ✅ 代碼推送成功！
    echo.
    echo 📋 接下來的步驟：
    echo 1. 前往 https://zeabur.com 登入您的帳號
    echo 2. 創建新項目或選擇現有項目
    echo 3. 添加兩個服務：
    echo    - 後端服務 ^(backend^): node server.js
    echo    - 前端服務 ^(frontend^): npm run build
    echo 4. 設置環境變數（參考 ZEABUR_DEPLOYMENT.md）
    echo 5. 等待部署完成
    echo.
    echo 📖 詳細部署指南請查看: ZEABUR_DEPLOYMENT.md
    echo.
    echo 🎉 部署腳本執行完成！
) else (
    echo ❌ 代碼推送失敗，請檢查 Git 配置
    pause
    exit /b 1
)

pause