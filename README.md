# 復興檔案：時光的邀請

臺北市私立復興實驗高級中學校園探索解謎互動 Web App，題目與敘事特別為 7–9 年級（國中）學生設計。保留八道任務、校園故事、互動 SVG 示意地圖、記憶碎片、校史館休館替代情節與最終謎題。故事敘事文字採手寫風格字體（霞鶩文楷 LXGW WenKai TC，透過 Google Fonts 載入，離線時自動降級為系統楷體）。

遊戲支援三種遊玩模式：

| 模式 | 說明 | 需要網路 | 需要帳號 |
|------|------|----------|----------|
| 離線單機 | 進度存於瀏覽器 Local Storage，可完全離線遊玩 | 否 | 否 |
| 雲端存檔 | 登入後進度同步至 Supabase，換手機／換電腦都能繼續 | 首次與同步時需要 | 是（免 email 驗證） |
| 組隊遊玩 | 建立／加入隊伍（6 碼代碼），全隊共解八道任務，即時同步進度、隊員分工紀錄與團隊排行榜 | 需要 | 是（免 email 驗證） |

## 啟動

```bash
npm install
npm run dev
```

開啟 `http://localhost:3000`。離線模式無需任何設定；雲端與組隊模式使用內建的 Supabase 專案設定（見下節）。

## 雲端與組隊（Supabase）

雲端與組隊功能透過 Supabase（Auth + Postgres + Realtime）運作，純前端呼叫、不需要自建伺服器：

- **帳號**：電子郵件＋密碼註冊即自動確認（此專案已關閉 email 驗證信，方便校園活動快速開帳號）。密碼至少 6 碼。
- **跨裝置存檔**：登入後遊玩進度寫入 `solo_saves` 資料表；換裝置登入即可繼續。
- **組隊遊玩**：`create_team` / `join_team_by_code` RPC 建立或加入隊伍；`team_sessions` 共享全隊進度，`team_mission_log` 記錄「誰解開哪一關」；Supabase Realtime 即時把隊友的進度推到每個人的畫面。
- **排行榜**：`team_leaderboard` RPC 依分數、完成時間排序全隊伍。

資料表皆啟用 Row Level Security：每個人只能讀寫自己的存檔與所屬隊伍的資料；加入隊伍必須透過代碼（6 碼，排除 0/O/1/I/L 等易混淆字元）。

要連到自己的 Supabase 專案時，設定環境變數即可覆寫預設值：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> anon key 本來就會隨靜態網站送到瀏覽器（安全邊界是 RLS，不是這把 key），請勿在前端放 service role key。

## 靜態建置

```bash
npm run build
```

Next.js 靜態匯出會產生 `out/`，可部署到任意靜態網站主機（含 Vercel）。離線模式搭配 Service Worker 快取可離線開啟；雲端／組隊模式需要網路連線，斷線時進度會保留於記憶體並於恢復連線後自動補上同步。

## 紙本印刷品（混合手冊）

`printables/` 內含可直接列印的 PDF（A5 直式），與系統搭配的「混合手冊」玩法：紙本負責題目與現場觀察，系統負責驗證與計分。

| 檔案 | 用途 |
|------|------|
| `復興探索手冊_學生版.pdf` | 學生任務書：玩法、校園地圖、八關題目＋現場觀察欄、碎片收集頁、終章排列題、答案速查表 |
| `復興探索手冊_教師解答本.pdf` | 教師用：逐關解答、觀察題參考答案、解題提示、評分與安全建議 |
| `campus-map.png` | 印刷地圖（300dpi，含任務編號針腳） |

重新產生：

```bash
python3 scripts/render-map.py               # 由 CampusMapSVG.tsx 重繪印刷地圖
npx tsx scripts/generate-booklets.ts        # 依題庫（src/lib/seed-data.ts）產出兩本 PDF
```

字體使用霞鶩文楷（`@expo-google-fonts/lxgw-wenkai-tc`，與遊戲介面手寫字體一致，需先 `npm install`）。

## 驗證

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## 備註

- 離線模式進度只寫入同一瀏覽器的 Local Storage，清除瀏覽器網站資料會刪除進度；建議長時間遊玩改用雲端存檔模式。
- 雲端／組隊模式沒有伺服器端防作弊驗證，適合課堂與活動使用，不適用於嚴肅競賽。
- 校園地圖是示意圖，並非精確建築平面圖或 GPS 圖資；關卡位置不可視為已核實的實際座標。
- 關卡題目皆可純文字作答，不以照片或校徽圖像作為解題必要條件；首頁校園照片與序章主視覺僅作為裝飾素材（序章圖為 AI 生成之示意圖，非復興實中實景），出處與聲明見 `public/images/IMAGE_SOURCES.md`。
- 題庫正確答案會隨靜態遊戲程式送至瀏覽器，因此本遊戲適合個人與班級遊玩。
