# 使用官方 Node.js 運行時作為基礎鏡像
FROM node:18-alpine

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安裝依賴
RUN npm install --only=production

# 複製應用程式源碼
COPY . .

# 暴露端口
EXPOSE 3001

# 定義啟動命令
CMD ["npm", "start"]