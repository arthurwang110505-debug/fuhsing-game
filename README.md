# 復興檔案：時光的邀請（FUHSING CHRONICLES: THE INVITATION THROUGH TIME）

臺北市私立復興實驗高級中學（Taipei Fuhsing Private School）校園探索解謎互動 Web App。  
專為 7～9 年級學生設計，結合校史文化、校園建築特色、生態理念、行政服務與互動謎題，在約 50 分鐘的漫步探索中完成 8 道關卡與最終記憶匯流。

## 技術架構（Full-Stack）

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling & Motion**: Tailwind CSS + Framer Motion + Lucide Icons
- **Database**: PostgreSQL + Drizzle ORM (`missions`, `game_settings`, `game_sessions`)
- **Interactive Graphics**: 自繪 SVG 互動校園探索示意地圖 + 互動校徽拆解圖

## 本機啟動方式

1. 確認 `.env` 已設定 `DATABASE_URL`、自訂 `ADMIN_PASSCODE` 與高熵隨機 `ADMIN_TOKEN_SECRET`（至少 32 字元）。管理員通行碼不再使用弱預設值；若未設定，管理員登入會停用。
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

點擊頁面右上角「管理員」按鈕，輸入環境變數 `ADMIN_PASSCODE` 設定的通行碼。管理員登入有 15 分鐘失敗次數限制，簽章 Cookie 為 HttpOnly 並在 8 小時後失效：
- 檢視所有關卡內容、兩個提示與正確答案（一般玩家無法從前台或公開 API 看到解答）。
- 編輯關卡名稱、探索地點、題目、提示與標準答案 JSON。
- 在 SVG 示意地圖上直接拖曳任務標記，放開後即儲存；亦可使用 X／Y 滑桿微調座標。標記位置可由管理員依校方核實的底圖資料調整，示意底圖本身不代表精確校園平面圖或 GPS 座標。
- 模擬「校史館開放 / 休館」狀態（休館時 Mission 04 自動顯示數位校史替代檔案室）。
- 切換「全部關卡解鎖測試模式」、重置玩家探索進度或直接跳轉測試任意關卡。

## Vercel 部署方式

1. 將此專案推送至 GitHub / GitLab / Bitbucket。
2. 於 Vercel 匯入專案，並綁定託管 PostgreSQL 資料庫（例如 Neon / Supabase / Vercel Postgres）。
3. 在 Vercel Project Settings → Environment Variables 設定：
   - `DATABASE_URL`: 你的 PostgreSQL 連線字串
   - `ADMIN_PASSCODE`: 自訂管理員後台通行碼（必填）
   - `ADMIN_TOKEN_SECRET`: 隨機高熵簽章密鑰（必填；建議至少 32 字元）
4. Build Command 維持 `npm run build`，並在首次部署後執行 `npx drizzle-kit push` 同步資料表（系統亦會在首次載入自動寫入 8 道題庫）。

## V2 安全與媒體狀態

- 公開啟動資料不再帶提示文字；玩家點選提示後，伺服器才依據 session 與關卡解鎖狀態回傳該階提示。
- 答案與最終排序仍只在伺服器端驗證；第 08 關及最終謎題都依伺服器端完成進度判定。管理員登入與探索代碼查詢增加每程序記憶體型速率限制；多實例正式部署建議接共享限流儲存（例如 Redis）。
- `npm test` 執行遊戲規則與管理員簽章 token 測試；此測試不替代連線真實 PostgreSQL 的 API 整合測試。
- 校園 SVG 為**示意圖**，不是實際建築平面圖；任何任務點座標仍需校方核實。任務目前仍含可透過公開資料解答的知識題，需取得校方確認的實地觀察線索／站點資訊後，才能安全改為可驗證的現場任務。
- 校園照片素材尚未提供。缺少圖片時網站會顯示 `public/images/asset-placeholder.svg`，並明確標記為非實景佔位圖；請勿把它當作校園照片。
