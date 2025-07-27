# 多階段構建：第一階段用於構建
FROM node:18-alpine AS builder

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製源碼
COPY . .

# 構建應用
RUN npm run build

# 第二階段：生產環境
FROM nginx:alpine

# 複製構建結果到 nginx 目錄
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製 nginx 配置（可選）
# COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]