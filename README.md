# 復興檔案：時光的邀請（FUHSING CHRONICLES: THE INVITATION THROUGH TIME）

臺北市私立復興實驗高級中學（Taipei Fuhsing Private School）校園探索解謎互動 Web App。  
專為 7～9 年級學生設計，結合校史文化、校園建築特色、生態理念、行政服務與互動謎題，在約 50 分鐘的漫步探索中完成 8 道關卡與最終記憶匯流。

## 技術架構（Full-Stack）

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling & Motion**: Tailwind CSS + Framer Motion + Lucide Icons
- **Database**: PostgreSQL + Drizzle ORM (`missions`, `game_settings`, `game_sessions`)
- **Interactive Graphics**: 自繪 SVG 互動校園探索示意地圖 + 互動校徽拆解圖

## 本機啟動方式

1. 確認環境變數 `.env` 已設定 `DATABASE_URL`（以及可選的 `ADMIN_PASSCODE`，預設為 `FHSH1946`）。
2. 安裝相依套件並推送資料庫結構：
   ```bash
   npm install
   npx drizzle-kit push
   ```
3. 啟動開發或正式伺服器：
   ```bash
   npm run dev
   # 或正式環境：
   npm run build && npm run start
   ```
4. 開啟瀏覽器前往 `http://localhost:3000`（首次造訪或呼叫 `/api/game/bootstrap` 時會自動寫入 8 道已驗證關卡與預設設定）。

## 管理員／教師測試模式

點擊頁面右上角「管理員」按鈕，輸入通行碼（預設 `FHSH1946`，或讀取環境變數 `ADMIN_PASSCODE`）：
- 檢視所有關卡內容、兩個提示與正確答案（一般玩家無法從前台或公開 API 看到解答）。
- 編輯關卡名稱、探索地點、題目、提示與標準答案 JSON。
- 透過滑桿微調未確認任務點在 SVG 示意地圖上的 `(X, Y)` 位置。
- 模擬「校史館開放 / 休館」狀態（休館時 Mission 04 自動顯示數位校史替代檔案室）。
- 切換「全部關卡解鎖測試模式」、重置玩家探索進度或直接跳轉測試任意關卡。

## Vercel 部署方式

1. 將此專案推送至 GitHub / GitLab / Bitbucket。
2. 於 Vercel 匯入專案，並綁定託管 PostgreSQL 資料庫（例如 Neon / Supabase / Vercel Postgres）。
3. 在 Vercel Project Settings → Environment Variables 設定：
   - `DATABASE_URL`: 你的 PostgreSQL 連線字串
   - `ADMIN_PASSCODE`: 自訂管理員後台通行碼（選填，預設 `FHSH1946`）
4. Build Command 維持 `npm run build`，並在首次部署後執行 `npx drizzle-kit push` 同步資料表（系統亦會在首次載入自動寫入 8 道題庫）。
