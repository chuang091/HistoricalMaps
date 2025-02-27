# 1️⃣ 使用 Node.js 官方 LTS 版本
FROM node:20-alpine AS builder

# 2️⃣ 設定工作目錄
WORKDIR /app

# 3️⃣ 複製 package.json 並安裝依賴
COPY package.json package-lock.json ./
RUN npm install

# 4️⃣ 複製 Nuxt 代碼並 Build
COPY . .
RUN NITRO_PRESET=node npm run build

# 5️⃣ 使用新的 Node.js 來運行
FROM node:20-alpine AS runner
WORKDIR /app

# 6️⃣ 複製 build 結果
COPY --from=builder /app/.output .output

# 7️⃣ 設定環境變數
ENV HOST=0.0.0.0 PORT=3000

# 8️⃣ 設定對外開放的 Port
EXPOSE 3000

# 9️⃣ 啟動 Nuxt 伺服器
CMD ["node", ".output/server/index.mjs"]
