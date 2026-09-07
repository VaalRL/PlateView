# TODO.md (PlateView 開發進度與任務清單)

> 本文件追蹤 PlateView 的里程碑與任務進度。

---

## 🎯 專案狀態：全部里程碑已 100% 完成開發與驗收 (Ready for Production)

### 📌 里程碑交付總覽

- [x] **Phase 1: 專案基建與骨架**
  - [x] Stack 規範對齊：建立 `WEB_DEVELOPMENT_RULES.md`
  - [x] 專案基礎文件：`README.md`, `ARCHITECTURE.md`, `docs/adr/0001-tech-stack.md`
  - [x] 工具鏈設定：`package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `tailwind.config.ts`
  - [x] 靜態資料與字典：`teams.json`, `players-zh-tw.json`
  - [x] 基礎架構與路由：`HashRouter`, `useTheme`, `useFavorites`, `Navbar`, `Footer`, `SearchModal`
  - [x] CI/CD 流水線：`.github/workflows/deploy.yml`

- [x] **Phase 2: 首頁比分看板、在壘動態與戰績完善**
  - [x] 實作在壘菱形動態亮燈元件 (`BasesDiamond.tsx`)
  - [x] 實作好壞球與出局數視覺指示燈 (`CountDisplay.tsx`)
  - [x] 完善比分卡片 (`ScoreboardCard.tsx`)：支援進行中 (Live)、預定開打 (Preview)、已結束 (Final) 與延賽 (Postponed/Delayed) 狀態
  - [x] 強化每局得分板 (Linescore)：高亮當前局數、R/H/E 統計與折疊展開
  - [x] 完善戰績表 (`StandingsTable.tsx`)：支援分區戰績切換與美聯/國聯外卡榜 (Wild Card Tab) 及晉級線 (Playoff Spot)
  - [x] 強化我的最愛置頂列 (`FavoritesBar.tsx`)：結合當日賽況即時比分與「⭐ 今日先發」高亮徽章

- [x] **Phase 3: 深度查詢與繁中雙語搜尋**
  - [x] 擴充 `players-zh-tw.json` 繁中譯名字典，加入超過 48 位大聯盟焦點球星與旅美台將
  - [x] 完善 `SearchModal.tsx`：支援鍵盤上下鍵 (↑/↓) 導航、Enter 鍵即時跳轉、線上 MLB 官方 API 模糊即時補全
  - [x] 完善 `TeamDetailPage.tsx`：支援 26 人現役名單 (Active)、40 人名單 (40-Man) 與傷兵名單 (IL List) 分頁切換，並展示投手/野手本季數據
  - [x] 完善 `PlayerDetailPage.tsx`：支援二刀流雙棲切換 (打擊/投球)、生涯 vs 本季數據切換、近 10 場逐場出賽 Game Logs、體型與投打習慣

- [x] **Phase 4: 個人化、離線韌性、多語系支援與細節打磨**
  - [x] 🌐 **新增 `🌐 繁中 / EN` 全站語系一鍵切換系統 (`useLanguage.tsx`, `translations.ts`, `LanguageSelector.tsx`)**
  - [x] 30 隊動態主題色下拉切換 (`ThemeSelector.tsx`)：分區分組、球隊主色圓點預覽
  - [x] 深淺色模式即時切換與持久化儲存 (`useTheme.ts`)
  - [x] 離線與網路中斷即時提示橫幅 (`OfflineBanner.tsx`)
  - [x] 全套 41 項單元與元件測試 100% 通過
  - [x] 生產環境 TypeScript 嚴格檢查與 Vite 打包驗證通過

- [x] **Phase 5: 程式碼審查修正與品質強化（2026-08-31）**
  - [x] 修正備份/還原主題與隊色鍵名錯誤（`plateview_theme/team_color` → 實際的 `plateview_mode/team`），並補整合測試
  - [x] localStorage 鍵、預設收藏、排行榜類別清單抽至 `src/constants/`（SSOT，消除重複定義）
  - [x] 移除賽季 2026 硬編碼：新增 `getCurrentMlbSeason()`（1–2 月回前一賽季），副標題參數化
  - [x] 賽程輪詢條件化：僅在有 Live 賽事時每 30 秒輪詢（`scheduleHasLiveGames`）
  - [x] 匯入資料強化驗證：meta 僅接受字串、ID 清單上限 500、theme/隊色/語言白名單、部分備份覆蓋不清空未含欄位
  - [x] 匯入錯誤改為 error code + i18n 翻譯（含成功訊息數量文案雙語化）
  - [x] `useFavorites` 跨實例同步：persist 後 dispatch 自訂事件，reload 加防迴圈比對；`useTheme`/`useLanguage` 監聽事件，匯入後即時套用
  - [x] 「今日出賽」徽章改用美東日期（`getEasternDateStr`），修正台灣時區早晨誤判
  - [x] 備份 Modal 無障礙：`role="dialog"`、`aria-modal`、Esc 關閉、點背景關閉、開啟時聚焦；複製失敗加 fallback 與錯誤回饋
  - [x] 排行榜每類別空狀態卡片（啟用 `leaders.empty`）；類別名稱移入 `translations.ts`
  - [x] 移除孤兒翻譯鍵（`leaders.loading`、`fav.season_ops`、`fav.season_era`）；修正無效 Tailwind class `py-0.2`
  - [x] gameLog 回應補型別（`src/types/favorites.ts`），消除 favorites 元件的 `any`
  - [x] 路由層 code splitting（React.lazy）：主 bundle 423.74 kB → 363.27 kB
  - [x] 測試基礎設施：全域 stub `fetch`（不再打真實 MLB API）、測試間清空 QueryClient 快取
  - [x] 測試由 66 項增至 84 項，全數通過；TypeScript 與 Vite 打包驗證通過
  - [x] 建立 `eslint.config.js`（ESLint 9 flat config）：`npm run lint` 恢復可用（0 errors；既有 `any` 降為 51 warnings 待逐步清理）
  - [x] 修正 Box 視角打者 AVG / 投手 ERA 顯示空白：boxscore API 的單場 `stats` 不含比率數據，改讀 `seasonStats`（經真實 API 驗證，附重現測試）
  - [x] 球員名稱顯示策略統一：所有列表（排行榜、名單、Box、收藏列、戰報卡）一律顯示英文原名，解決中文字典僅 50 人造成的中英混排；搜尋維持中英文皆可輸入；搜尋結果與球員詳情頁以英文為主、字典中文名為輔行顯示

- [x] **Phase 6: 今日愛將戰報補上球隊卡與整卡展開（2026-09-07）**
  - [x] 新增最愛球隊戰報卡（`FavoriteTeamSummaryCard.tsx`）：今日賽況（Live 局數 / Final 勝敗徽章 / 預定開打時間 / 延賽）、比分與對手、R/H/E 拆解、預定先發投手、無賽程空狀態
  - [x] `FavoritesSummaryDrawer` 延伸接收 `teamIds` / `games`，球隊卡與球星卡共用同一格線；手動重新整理同時失效 `schedule` 查詢
  - [x] 修正只收藏球隊時看不到戰報入口：戰報按鈕與抽屜不再以 `favoritePlayers.length > 0` 為條件
  - [x] 首頁「我的最愛」整張卡片可點擊展開／收合戰報；標籤連結、備份按鈕與抽屜內容以 `stopPropagation` 隔離
  - [x] 新增 `fav.team_no_game`、`fav.view_team` 雙語鍵，`fav.summary_subtitle` 補上球隊語意
  - [x] 測試由 84 項增至 91 項，全數通過；TypeScript 與 Vite 打包驗證通過

- [x] **Phase 7: 戰報卡雙日戰績與球隊官網捷徑（2026-09-07）**
  - [x] 球隊戰報卡同卡顯示「今日 + 昨日」兩列（比分、勝敗徽章、賽況狀態；今日列另含 R/H/E 或預定先發）
  - [x] 新增 `getPreviousDateStr()`（純日曆計算，不受時區位移影響）與邊界測試（月/年/閏日）
  - [x] 昨日賽況以 `useScheduleQuery` 取得（SSOT 沿用既有 hook，新增選用 `enabled` 參數；無收藏球隊時不發請求）；基準日取自 `games[0].officialDate`，確保兩列同屬同一天
  - [x] 球隊頁新增「球隊官網」外部連結按鈕（`target="_blank"` + `rel="noopener noreferrer"`）
  - [x] `teams.json` 補 30 隊 `mlbSlug` 欄位（全數以 HTTP 200 驗證過 mlb.com 網址）
  - [x] 修正 `TeamDetailPage` 在 standings 回應缺 `records` 時的當機（`records?.forEach`）
  - [x] 測試由 91 項增至 95 項，全數通過；TypeScript 與 ESLint（0 errors）驗證通過

- [x] **Phase 8: 傷兵名單修正與官網傷兵異動捷徑（2026-09-07）**
  - [x] 修正傷兵名單 (IL) 分頁永遠空白：IL 分頁改讀 `40Man` 名單（傷兵不會出現在 active 名單），實測光芒由 0 人 → 正確顯示 9 人
  - [x] 傷兵判定改用 `^D\d+$` 狀態碼（D7/D10/D15/D60）＋ description 佐證，排除同樣以 D 開頭的 `DES`（讓渡指定）
  - [x] 同一判定抽為單一 `isOnInjuredList()` 並套用至名單過濾與名字旁 IL 徽章（原 `code.includes('I')` 對 D15/D60 永遠為 false，徽章從未顯示）
  - [x] 球隊頁新增「傷兵異動消息」外部按鈕，連至 `mlb.com/{slug}/transactions`（官網團隊異動頁，含 IL 進出與傷勢原因）
  - [x] 已驗證 mlb.com 無球隊層級傷兵專頁（`/{slug}/roster/injury-report` 等皆 404），聯盟版 `/injury-report` 亦不支援 `teamId` 篩選
  - [x] 測試由 95 項增至 98 項，全數通過；TypeScript、ESLint（0 errors）與 Vite 打包驗證通過
