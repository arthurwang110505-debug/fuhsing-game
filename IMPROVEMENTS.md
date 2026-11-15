# 《復興檔案：時光的邀請》改進建議書

> 盤點範圍：`arena/8689aab5-fuhsing-game` 分支（基於 `cf2590c`）
> 現況驗證：`npm test` 11/11 通過、`typecheck` ✓、`lint` ✓、`npm run build`（靜態匯出）✓
> 以下建議依「影響 × 成本」分為 P0（建議儘速處理）～ P3（可排入後續規劃），並附具體落點與工作量估計。
>
> **進度更新（2026-11-14）**：
> - 已補齊 8 張任務場景圖＋序章主視覺（AI 生成，標示非實景）。
> - 已新增 Supabase 雲端存檔（跨裝置）與**組隊遊玩**（隊伍代碼、共享進度、即時同步、團隊排行榜），並保留離線單機模式。P1-3「存檔匯出／匯入」由雲端存檔大幅緩解。
> - 尚未處理：P0-1 每秒寫入 Local Storage、P0-2 主視覺 2.4MB 壓縮、P1-1 SW 預快取、CI 流水線、架構拆分等。

---

## 一、效能與穩定性

### P0-1 每秒寫入一次 Local Storage（實際效能問題）

**落點**：`src/components/FuhsingChroniclesApp.tsx` 約 L114–128、L133–138

計時器每秒 `setElapsedSeconds(+1)`，而存檔 `useEffect` 的依賴陣列包含
`elapsedSeconds` —— 等於**遊玩中每秒把整個 session JSON 序列化並寫入
localStorage 一次**。在低階 Android 裝置（學校常見情境）上會造成不必要的
I/O 與主執行緒干擾，也加速快閃儲存體寫入。

**建議**：

1. 計時值改存 `useRef`（或獨立 state 但**移出**存檔依賴），UI 上的顯示以
   1 秒 interval 更新；
2. 存檔改為「事件驅動 + 節流」：
   - 關鍵事件（解題成功、開啟提示、切換關卡）後立即寫入；
   - 遊玩中每 10–15 秒節流寫入一次；
   - 監聽 `visibilitychange` / `pagehide` 離開頁面前補寫一次。
3. 順手把 `GameSession.elapsedSeconds` 這個**永遠是 0 的死欄位**處理掉
   （完成遊戲時回填，或從型別中移除，目前存的是頂層 `elapsedSeconds`）。

**工作量**：小（約 1 小時內）。**收益**：直接消除高頻 I/O，低階裝置更順。

### P0-2 校園主視覺圖片高達 2.4 MB

**落點**：`public/images/fuhsing-campus-hero.jpg`（2,389,654 bytes）

首頁裝飾用照片未經壓縮，佔首次載入與 Service Worker 快取容量的絕大部分。
在手機網路（校園 Wi-Fi 亦然）下會拖慢首屏，也讓離線快取膨脹。

**建議**：

- 壓縮並轉為 WebP/AVIF（品質 70–80 通常可壓到 200–400 KB）；
- 以 `next/image` 的 `export` 模式靜態產生多尺寸版本，`<img>`/`picture` 加
  `srcset` 與 `loading="lazy"`、`decoding="async"`；
- 若保留 JPG，至少先用 `jpegoptim --strip-all` 之類工具做無損/輕度有損壓縮。

**工作量**：小。**收益**：首屏速度與離線快取容量大幅改善（估計縮小 80% 以上）。

---

## 二、PWA 與離線體驗

### P1-1 Service Worker 快取策略可再強化

**落點**：`public/sw.js`

目前問題：

1. `APP_SHELL` 只預快取 `"/"` 與 `manifest.webmanifest`，Next 靜態匯出產出的
   `/_next/static/...` 雜湊資源靠「首次連線後才快取」——**部署新版本後的
   第一次離線開啟可能破圖**；
2. 沒有版本更新流程：`CACHE_NAME` 是寫死的 `v1`，使用者端的舊 SW 不會主動
   提示更新，可能長期跑舊題目。

**建議**：

- 建置時以腳本產生「預快取清單」（把 `out/` 內所有資源列進 manifest），
  在 `install` 一次快取完畢（可考慮直接用 Workbox 產生）；
- 版本號改由建置流程注入（例如吃 `package.json` version 或 build hash）；
- 加入更新提示：偵測 `registration.waiting` 時在 UI 顯示「有新版本，點此
  重新載入」的小橫幅，呼叫 `SKIP_WAITING` + `location.reload()`；
- 額外加一個簡易離線狀態指示（`navigator.onLine` + `online`/`offline`
  事件），讓學生知道自己正處於離線遊玩。

**工作量**：中。**收益**：真正可靠的離線體驗與無痛版本更新。

### P2-1 加入 `prefers-reduced-motion` 支援

**落點**：全站 `framer-motion` 動畫（`FuhsingChroniclesApp`、`FinalPuzzleAndEnding`
等多處 `motion.div`）

目前未處理動態減免偏好。最省力的作法是在根元件包
`<MotionConfig reducedMotion="user">`，一行即可讓所有 framer-motion 動畫
尊重系統設定（前庭敏感使用者的無障礙基本款）。

**工作量**：極小。**收益**：無障礙合規、對暈動症使用者友善。

---

## 三、存檔系統

### P1-2 存檔 schema 版本化與遷移

**落點**：`STORAGE_SESSION_KEY = "fuhsing_chronicles_local_save_v2"`（
`FuhsingChroniclesApp.tsx` L38）、L88–112 的還原邏輯

目前用「改 key 名稱」當版本管理（`_v2`）。未來任何欄位變更都要再改 key，
舊存檔直接被當垃圾清掉。建議：

- 存檔 JSON 內放 `saveVersion: number` 與 `savedAt`；
- 還原時走純函式 `migrateSave(raw): GameSession`（v1→v2→…），可單元測試；
- 解析失敗時保留原始字串到 `..._backup` key 再清空，避免「一次損毀永久歸零」。

**工作量**：小～中。**收益**：未來改題目/欄位時不犧牲學生進度。

### P1-3 存檔匯出／匯入（校園情境的關鍵需求）

README 已明言「清除瀏覽器資料會刪除進度」。在學校場景中，電腦常被統一重
灌、學生也可能換裝置遊玩，純 localStorage 太脆弱。建議：

- 結尾頁與儀表板加「匯出存檔」（下載 JSON 檔）與「匯入存檔」（檔案選擇 +
  schema 驗證 + 遷移）；
- 可再進階：產生含存檔的 QR code（手機掃描帶入），對沒有隨身碟的學生很實用。

**工作量**：小（匯出/匯入）、中（QR）。**收益**：大幅降低「進度遺失」的
客服成本與挫敗感。

### P1-4 關卡中途草稿也應存檔

**落點**：`PuzzlePlayfield.tsx` L65–87 的 `evidenceAnswers`、`pairAnswers`、
`timelineOrder`、`synthAnswers` 等

這些作答中狀態只存在 React state —— 玩到一半關閉分頁，**已完成的關卡在、
但當前關卡的作答全沒**。建議按 `missionId` 把草稿寫進存檔（可沿用 P0-1 的
節流寫入），進入關卡時還原。這對「上課 40 分鐘、下課再玩」的節奏特別重要。

**工作量**：中。**收益**：遊戲體驗連續性明顯提升。

---

## 四、無障礙與使用者體驗

### P2-2 解題回饋加入 `aria-live` 區域

**落點**：`PuzzlePlayfield` 的 `puzzleFeedback`、`MissionCompleteModal`

送出答案後的對錯回饋是動態插入的，螢幕閱讀器不會主動朗讀。把回饋訊息容器
加上 `aria-live="polite"`（或 `role="status"`）即可。同理，解鎖新關卡、
得分變動等重要訊息也適用。

**工作量**：極小。

### P2-3 鍵盤與焦點體驗細節

`CampusMapSVG` 的地圖節點已有 `tabIndex`/`onKeyDown`（做得不錯）。建議再補：

- 明顯的 `:focus-visible` 樣式（SVG 上常被瀏覽器預設忽略）；
- `MissionCompleteModal` 開啟時焦點鎖定（focus trap）與 `Esc` 關閉；
- 頁面切換（screen 狀態變更）後把焦點移到新畫面標題（`h1`）。

**工作量**：小～中。**收益**：鍵盤/讀屏使用者可完整通關。

---

## 五、程式架構與可維護性

### P2-4 拆分 979 行的主元件、狀態改用 reducer

**落點**：`FuhsingChroniclesApp.tsx`（979 行、17 個 `useState`）

單一元件承擔開場、設定、儀表板、地圖、任務詳情、謎題、最終謎題、結尾全部
畫面與轉場。建議：

1. 按 `GameScreen` 拆出 `OpeningScreen`、`SetupScreen`、`DashboardScreen`、
   `MissionDetailScreen`…等子元件（本來就有介面型別，拆分風險低）；
2. 遊戲 session 狀態改 `useReducer`（`START` / `SOLVE_MISSION` / `USE_HINT` /
   `SOLVE_FINAL`… action），轉場邏輯可單元測試、也自然解決 P0-1 的存檔觸發
   點問題（在 reducer 後果效應存檔）；
3. `submittingAnswer`、`puzzleFeedback` 等 UI 狀態留給子元件自管。

**工作量**：中～大。**收益**：可維護性、可測試性顯著提升；後續加功能
（例如多人模式）不用再動這個巨型檔案。

### P2-5 題目 payload 改為判別聯合（discriminated union）

**落點**：`PublicMission.puzzlePayload: Record<string, unknown>`（`types/game.ts`
L25）、`game-engine.ts` 各 `case` 中大量的 `as` 轉型、`tests/game-flow.test.ts`
中的 `as unknown[]`。

建議改成：

```ts
type PuzzlePayload =
  | { type: "evidence-grid"; questions: EvidenceQuestion[]; ... }
  | { type: "timeline-sort"; items: TimelineItem[]; ... }
  | ...
```

並讓 `SeedMission` 以 `puzzleType` 關聯對應 payload 與 `correctAnswer` 型別。
如此 `gradeMissionAnswer` 內可完全消滅 `as` 轉型，題庫形狀錯誤在編譯期就會
被抓到（例如 `payload(4).items` 寫錯欄位名）。

**工作量**：中。**收益**：型別安全、減少執行期 `Record<string, unknown>` 
轉型錯誤的風險。

### P3-1 `gradeMissionAnswer` 的重複結構可收斂

七個 `case` 中「檢查未填 → 數對幾題 → 回饋字串」的骨架重複了五次。可抽出
`gradeObjectMatch(expected, actual, opts)` 共用，各題型只保留自己的回饋文案
與特殊規則（如 `eco-matching` 的安全守則）。屬可選的整潔性重構。

---

## 六、測試與 CI

### P2-6 建立 GitHub Actions 流水線

**落點**：repo 目前**沒有** `.github/workflows/`

建議加一個最基本的 CI（push / PR 觸發）：

```yaml
- npm ci
- npm run lint
- npm run typecheck
- npm test
- npm run build
```

README 的「驗證」一節列了這四道指令，正好原樣搬進 CI，避免日後改壞了沒人
發現。若要更進一步：把 `out/` 上傳 artifact，或接 GitHub Pages / Vercel 自動
部署（本對話已連接 Vercel，靜態匯出可直接部署）。

**工作量**：小。**收益**：品質門檻自動化。

### P2-7 測試覆蓋擴充

現有 5 個測試都在驗 `game-engine` 純函式（方向正確）。建議依序補：

1. **存檔遷移測試**（配合 P1-2）：餵舊版 JSON 進 `migrateSave`；
2. **UI 元件測試**（React Testing Library）：至少涵蓋「開局 → 作答 → 對/錯
   回饋 → 解鎖下一關」主流程與 `MissionCompleteModal`；
3. **E2E**（Playwright）：靜態匯出後對 `out/` 起靜態伺服器跑「完整通關」
   腳本，並驗證離線（context.setOffline）後仍可遊玩 —— 這是本作的核心賣點，
   最值得用 E2E 守住。

**工作量**：中（1、2）～大（3）。

---

## 七、依賴與資安

### P3-2 依賴健檢

- `npm audit` 現有 **8 個 moderate** 漏洞，全部落在 `typescript-eslint` 系
  （`eslint-config-next` 相依鏈，屬 devDependency，不影響出貨的靜態站）。
  執行 `npm audit fix` 即可處理多數；
- `package.json` 建議補 `engines`（如 `"node": ">=20"`），避免老師們用過舊的
  Node 建置失敗；
- 答案隨靜態程式送至前端的問題 README 已誠實揭露，且題型全是選擇/配對（無
  自由文字答案），此模式可接受，**不建議**花成本做混淆。

---

## 八、內容與遊戲性（可排入下一階段）

| # | 建議 | 說明 | 工作量 |
|---|------|------|--------|
| 1 | **結尾「探索報告」** | `attemptsLog` 與 `hintsUsed` 已蒐集卻沒展示；結尾頁可呈現每關嘗試次數、提示使用、星等評分（例如：通關 + 未用提示 = ★★★），讓重玩有追求目標 | 小 |
| 2 | **積分納入提示代價** | `computeTotalScore` 目前與提示無關；可改為「用過提示扣 N 分」或維持滿分但星等分開計算（建議後者，避免懲罰探索） | 小 |
| 3 | **M04 休館替代情節入口更明顯** | `historyMuseumOpen` 切換藏在設定列（L635–639），帶隊老師不易發現；可在任務詳情頁就地提示「校史館休館？點此切換替代檔案」 | 小 |
| 4 | **多語版** | 校園有雙語部，官方網站亦有英文校史（資料來源已有英文頁）；架構上 UI 文案可抽成字典檔，先做 `zh-Hant` → `en` 對照 | 中～大 |
| 5 | **列印版探索證書** | 結尾頁加「列印證書」按鈕（含姓名、分數、完成日期的 A4 樣式），學校活動很受歡迎 | 小 |

---

## 建議執行順序（roadmap）

| 順序 | 項目 | 優先 | 工作量 |
|------|------|------|--------|
| 1 | P0-1 每秒寫入修正（含死欄位清理） | 高 | 小 |
| 2 | P0-2 主視覺圖片壓縮 | 高 | 小 |
| 3 | P2-6 GitHub Actions CI | 高 | 小 |
| 4 | P1-2 存檔版本化 + P1-3 匯出/匯入 | 中高 | 小～中 |
| 5 | P1-1 SW 預快取與更新提示 | 中高 | 中 |
| 6 | P1-4 關卡草稿存檔 | 中 | 中 |
| 7 | P2-1 減少動態、P2-2 aria-live、P2-3 焦點管理 | 中 | 小 |
| 8 | P2-4 拆主元件 + reducer、P2-5 題庫型別化 | 中 | 中～大 |
| 9 | P2-7 測試擴充（含 E2E 離線驗證） | 中 | 中～大 |
| 10 | 第八節遊戲性項目 | 低 | 小～中 |

**結論**：目前的程式品質基礎相當好（四道驗證全綠、題庫純文字可解、來源引用
完整、地圖有基礎無障礙）。最大的改進空間集中在「真實裝置上的效能細節
（每秒 I/O、2.4MB 圖片）」、「存檔韌性（版本化、匯出匯入、草稿）」與
「離線可靠性（SW 預快取、更新流程）」三塊；架構拆分與測試擴充則是為下一輪
內容擴充鋪路。以上第 1–3 項都是半天內可完成的高效益項目，建議優先執行。
