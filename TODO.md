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

- [x] **Phase 9: 修正球員頁 Game Logs「結果」欄永遠空白（2026-09-10）**
  - [x] 修正先發投手逐場紀錄的「結果 / Dec」欄永遠顯示 `-`：原讀取 `log.stat.decision`，但 MLB API 的 pitching gameLog split 並無此欄位（經真實 API 驗證，Skubal 全季 23 場皆無）
  - [x] 新增 `getPitchingDecision()` 至既有 `statsFormatters.ts`（SSOT），依 `wins`／`losses`／`saves`／`holds`／`blownSaves` 計數欄位推導 W／L／SV／HLD／BS／ND，無任何計數欄位時回傳 `-`
  - [x] 明確不採用 split 層級的 `isWin`：該欄位是球隊當場勝負，非投手決勝（實測 Skubal 三場球隊獲勝但投手無關勝負）
  - [x] 以真實 API 交叉驗證先發（Skubal）與後援（Díaz，含 SV／HLD／BS 與「BS 後撿勝」同場並存情境）
  - [x] 測試由 98 項增至 106 項，全數通過；TypeScript、ESLint（0 errors）驗證通過

- [x] **Phase 10: 逐場比賽 Box 專頁與守備配置圖像化（2026-09-16）**
  - [x] 先產出評估 `docs/adr/0002-game-detail-page.md`：確認 boxscore 單一請求即含 `battingOrder`／`position`／`allPositions`／`bench`／`bullpen`／`info`／`note`，並明確劃出做不到的範圍
  - [x] **明確不做 Statcast 式守備布陣（shift）站位座標**：野手追蹤座標與 `if_fielding_alignment` 僅存在於 Baseball Savant（非開放 CORS），零後端取不到；本頁提供的是官方登錄的 1–9 守備位置配置，UI 文案與頁內說明皆已標示
  - [x] 新增 `src/utils/lineup.ts` 純函式（SSOT）：`parseBattingOrder()` 解析 MLB 的打序編碼（百位＝棒次、末兩位＝該棒第幾位球員，`00` 為先發）、`buildLineup()` 產生 1–9 棒替補鏈、`buildFieldAlignment()` 推導當前守備配置
  - [x] 投手改由 `pitchers` 陣列末位取得（DH 制下投手不在打序中，無法從棒次推導）
  - [x] 新增 `#/games/:gamePk` 逐場專頁（lazy route）：頁首比分／狀態／球場／勝敗投 ＋ 三分頁（守備配置圖 / 打序與換人 / 完整 Box）
  - [x] 新增 `FieldAlignmentDiagram.tsx`：手刻 SVG 菱形場地（不引入任何圖表函式庫），9 個守位節點含位置代號與球員連結，替補以 `*` 標示，Live 時高亮場上投手；窄螢幕另有 1–9 條列不依賴圖形
  - [x] 新增 `LineupOrderBoard.tsx`：1–9 棒與同棒次替補鏈（代打／代跑／雙重守備變換），多守位者顯示 `SS-2B` 形式
  - [x] 表格抽為共用 `BoxscoreTables.tsx`、逐局比分抽為共用 `LinescoreTable.tsx`：折疊面板與專頁不再有兩份重複邏輯（SSOT）
  - [x] 修正 Box 打者表被 `slice(0, 12)` 截斷：專頁完整顯示所有打者，折疊面板維持 12 筆並附「開啟完整 Box 專頁」連結
  - [x] 修正球隊層 `info` 結構誤讀：官方註記為 `[{title, fieldList:[{label, value}]}]` 而非扁平 `{label, value}`；換人註記另由 `note[]` 呈現於打序分頁
  - [x] `src/types/mlb.d.ts` 補上 boxscore 完整型別與 `linescore.defense` 九名野手欄位，新元件不再使用 `any`（ESLint warnings 由 58 降至 53）
  - [x] 單場 Box 查詢支援 Live 輪詢（`useGameBoxscoreQuery(gamePk, isLive)`），完賽維持 30 分鐘快取；`useGameScheduleQuery` 沿用既有 `scheduleHasLiveGames` 判定
  - [x] 同一守位出現兩位球員的處理（換二壘手情境）：守備圖取每棒次「當前在場者」，被換下者不留在場上圖但以「替下 ○○○」註明，完整鏈保留在打序分頁
  - [x] 修正進行中比賽的守位天窗：代打／代跑剛上場而 MLB 尚未指派守位（`position` 仍為 `PH`／`PR`）時，原本該守位會整個空缺；改為第二輪回填繼承前一位守位並標記「守位待定」（虛線圈），且永不覆蓋已確認的守備者
  - [x] 修正雙重守備變換的錯誤標示：「替下 ○○○」原取同棒次前一位，但顯示於守備位置旁；雙重守備變換時棒次與守位分開易主，會標出從未守過該位置的人。改為僅在前一位確實守過同一位置時才顯示
  - [x] 釐清範圍：以上皆為「單張 boxscore 快照內的消歧義」，非時間軸還原；逐局守備變動時點仍需 feed/live（v2）
  - [x] 測試由 106 項增至 141 項，全數通過；TypeScript、ESLint（0 errors）與 Vite 打包驗證通過（主 bundle 372.13 → 376.89 kB，專頁為 18.14 kB lazy chunk）

- [x] **Phase 11: Box 統一收斂至逐場專頁（2026-09-16）**
  - [x] 首頁比分卡改為點擊直接進入 `#/games/:gamePk`，移除原地展開的 Linescore／Box 面板；卡片底部改為明確的「開啟完整 Box 專頁」連結
  - [x] 所有狀態的比賽皆可點擊（原本僅 Final 或已有 innings 才可展開）；賽前場次於專頁顯示雙方預定先發投手，不再是死路
  - [x] 球隊頁賽事列同樣改為導向專頁，移除 `expandedGamePk` 展開狀態與整段展開區塊（含原本只存在於此的賽前先發對決，已移入專頁）
  - [x] 刪除失去用途的 `GameBoxscorePanel.tsx`（兩處呼叫皆已改為導向）；Phase 5 的 `seasonStats` 比率數據回歸測試移至新的 `BoxscoreTables.test.tsx`，覆蓋不流失
  - [x] 清除孤兒翻譯鍵 `team.view_boxscore`／`team.hide_boxscore`
  - [x] **主 bundle 反而縮小**：Box 表格與 `LinescoreTable` 隨之移出首頁 chunk、併入 lazy 專頁 chunk，376.89 → 366.52 kB（低於本次功能開發前的 372.13 kB）；專頁 chunk 18.19 → 26.78 kB
  - [x] 測試由 141 項增至 145 項，全數通過；TypeScript、ESLint（0 errors，warnings 53 → 50）與 Vite 打包驗證通過

- [x] **Phase 12: 守備配置圖場地繪製與深淺色修正（2026-09-16）**
  - [x] **修正 SVG 填色退化為黑色的實際 bug**：`fill-team-primary/5`、`/10`、`/20`、`/40` 這類帶透明度的 utility，Tailwind 無法從 `var()` 主題色推導 alpha，會**靜默丟棄整條規則**；`fill` 未設定時 SVG 預設為黑色，導致內外野渲染成兩塊實心黑（已於編譯後 CSS 實測確認該類規則完全未產生）
  - [x] 新增專屬場地色票 `--field-grass`／`--field-infield`／`--field-dirt`／`--field-line`（`:root` 與 `.dark` 各一組）並註冊進 `tailwind.config.ts`，不依賴 alpha 修飾即可隨深淺色切換
  - [x] 場地改繪為真實球場結構：外野草皮扇形、外野警戒區、內野紅土弧、壘包間內野草皮、投手丘、三個壘包與本壘板、兩條邊線（viewBox 360 → 400，一併修正捕手名字被裁切）
  - [x] 節點座標依新場地重排，野手落在符合實際站位的位置（游擊／二壘分居二壘包兩側，三壘／一壘各在邊線側）
  - [x] Live 高亮環與「守位待定」圈改用 SVG `fillOpacity` 屬性，不再依賴 Tailwind alpha 修飾
  - [x] 補回歸測試：斷言四個場地圖層皆使用主題 token，且 SVG 內**不得出現任何帶 `/` 的 fill／stroke class**（此類失效是靜默的，必須由測試把關）
  - [x] 以 Playwright 實際渲染深／淺兩種模式截圖目視確認
  - [x] 測試由 145 項增至 147 項，全數通過；TypeScript、ESLint（0 errors）與 Vite 打包驗證通過

- [x] **Phase 13: 主題色票改存 RGB 通道，修復全站透明度修飾（2026-09-16）**
  - [x] 根治 Phase 12 發現的問題：`index.css` 全部 82 個色票由 hex 改存空格分隔的 RGB 通道值（含 30 隊主題色與深／淺色介面色）
  - [x] `tailwind.config.ts` 12 個色票改以 `rgb(var(--token) / <alpha-value>)` 引用，透明度修飾才會真正產生規則
  - [x] 兩處非 Tailwind 的直接引用（捲軸樣式）補上 `rgb()` 包裝
  - [x] **實測成效**：編譯後 CSS 中帶透明度的主題色規則由 **0 條增至 24 條**（對應原始碼約 150 處使用）
  - [x] ⚠️ **本次為全站視覺變更**：`border-border/40` 等原本整條被丟棄、邊框退回 `currentColor`（跟著文字色）；修正後才是預期的淡邊框。`bg-page/60`、`bg-card-hover/50` 等原本完全透明，修正後才有半透明底色
  - [x] 新增 `tests/theme/tokens.test.ts` 鎖定不變量：所有色票必須是 `r g b` 格式（禁止 hex）、通道值介於 0–255、Tailwind 端必須以 `<alpha-value>` 引用且不得出現裸 `var()`、每個介面色票都要有深色版本、30 隊主題色皆需定義主/次色
  - [x] 移除守備圖中「禁止 alpha class」的測試：該限制的成因已根除，留著反而會誤導後人；不變量改由上述色票測試把關
  - [x] 以 Playwright 渲染比分卡（大量使用原本失效的邊框／背景透明度）深淺兩色目視確認
  - [x] 測試由 147 項增至 151 項，全數通過；TypeScript、ESLint（0 errors）與 Vite 打包驗證通過

- [x] **Phase 14: 守備配置圖與打序整合為同一視圖（2026-09-16）**
  - [x] 分頁由三個收斂為兩個：原「🛡️ 守備配置圖」與「📋 打序與換人」合併為「🛡️ 守備配置與打序」
  - [x] 左右並列同一隊的場地圖與 1–9 棒打序（窄螢幕自動堆疊），上方以球隊按鈕切換客／主隊 —— 原本兩隊同時顯示會埋掉場上棒次與打序列的對應關係
  - [x] **整合的關鍵**：場上每個守位節點加上打序棒次小圈（大圈＝守位代號 1–9、小圈＝第幾棒），該數字即是右側打序的列號，可直接對照「第幾棒守哪個位置」；節點 tooltip 與窄螢幕條列同步顯示棒次
  - [x] 棒次小圈改用中性色（`fill-card` ＋ `stroke-border` ＋ `fill-main` 字）：原用隊色在深色模式下幾乎不可見，且遇到深色系隊伍（教士、白襪等）會失效
  - [x] 移除場地圖條列中的「替下 ○○○」：右側打序已完整呈現換人鏈，重複顯示反而把球員名字擠到截斷（實測 `Evan Carter` 被截成 `E.`）；該資訊保留於節點 tooltip
  - [x] 清除孤兒翻譯鍵 `game.tab_alignment`，新增 `game.batting_slot`
  - [x] 以 Playwright 於桌機寬度渲染深／淺兩色確認並排版面與小圈對比度
  - [x] 測試 151 項全數通過（改寫兩項描述舊分頁結構的測試）；TypeScript、ESLint（0 errors）與 Vite 打包驗證通過

- [x] **Phase 15: 守備配置圖依球場繪製外野輪廓（2026-09-16）**
  - [x] 先產出評估 `docs/adr/0003-venue-specific-ballpark-shape.md`：確認 `/venues/{id}?hydrate=fieldInfo` 提供最多 7 個角度的全壘打牆距離、`turfType` 與 `roofType`，並劃清「這不是球場平面圖」的邊界
  - [x] **明確不做**：牆高（`fieldInfo` 根本沒有此欄位，綠色怪物畫出來只會是一條短邊線）、特殊地形（三角區、常春藤、Crawford Boxes、PNC 凹角）、看台與場館外觀
  - [x] 新增 `src/utils/ballpark.ts` 純函式（17 項單元測試）：角度指派（邊線 ±45°、7 點以 15° 等距）、比例正規化（最深點對應 250 SVG 單位）、任意角度的牆距離線性內插、極座標轉 SVG、二次樣條路徑產生、距離標籤
  - [x] 防呆：距離值需落在 250–550 英尺且必須同時具備兩條邊線，否則回傳 null 讓呼叫端退回原本的通用弧線（春訓場、海外賽場地可能缺 `fieldInfo`）
  - [x] 外野草皮、警戒區與兩條邊線改為依實際牆形繪製；**外野手站位改為牆距離的 82%**（外野手站在牆前面，短邊線球場的外野手會站得比較淺）
  - [x] 修正外野手被擠到內野的問題：內野為了可讀性畫得比實際比例大，芬威 302 英尺的右外野角會把外野手推到游擊手旁邊 —— 加上最小半徑 172 單位的夾制（實際渲染後才發現，已於截圖確認）
  - [x] 新增 `getVenue()` 與 `useVenueQuery()`（24 小時 staleTime，全聯盟僅 30 座球場）；`src/types/mlb.d.ts` 補 `VenueFieldInfo` / `VenueDetail` / `VenuesResponse` 型別
  - [x] 圖上標示球場名、各角度距離與「依官方公布之全壘打牆距離繪製，非球場平面圖」的說明文字（雙語）
  - [x] 以 Playwright 並排渲染 PNC Park、Fenway Park 與無資料 fallback 三種情境確認形狀確實可辨識
  - [x] 測試由 151 項增至 171 項，全數通過；TypeScript、ESLint（0 errors）與 Vite 打包驗證通過

> 📌 **後續可選優化**：球場尺寸是靜態資料，可比照 `teams.json` 烤成 `src/data/venues.json` 達成執行期零請求。本次未做，因為開發環境無法連線驗證這 30 筆資料，而產出一份無法驗證的靜態檔比多打一次請求糟糕。

- [x] **Phase 16: 賽前場次不顯示逐場專頁入口（2026-09-16）**
  - [x] 比賽尚未開打時,首頁比分卡不再顯示「開啟完整 Box 專頁」按鈕與右上角箭頭,整張卡片也不再可點擊 —— 賽前沒有 Box、沒有打線、沒有守備配置,點進去只會看到空狀態
  - [x] 判定條件統一為 `abstractGameState` 為 `Live` 或 `Final`(而非 detailedState),因此賽前延賽/取消的場次(`abstractGameState` 仍為 `Preview`)同樣不會有入口
  - [x] 球隊頁賽事列套用同一條規則(列不可點、箭頭不顯示),避免兩處行為不一致
  - [x] 資訊不流失:首頁卡片與球隊頁賽事列**本來就已顯示雙方預定先發投手**(且可連至球員頁),專頁對賽前場次並無額外內容
  - [x] 修正既有測試命名錯誤:原「offers an explicit link ... for previews too」實際渲染的是進行中比賽
  - [x] 以 Playwright 並排渲染賽前與已結束卡片確認差異
  - [x] 測試由 171 項增至 172 項,全數通過;TypeScript、ESLint（0 errors）與 Vite 打包驗證通過

- [x] **Phase 17: 比分卡逐場專頁入口改為實體按鈕（2026-09-16）**
  - [x] 原本整行的文字連結「開啟完整 Box 專頁 (守備配置 / 打序)」＋箭頭,改為置中的實體按鈕,可見文字精簡為 **Box**
  - [x] 無障礙不打折:可見標籤雖短,`aria-label` 與 `title` 仍為完整敘述,螢幕閱讀器讀到的仍是「開啟完整 Box 專頁 (守備配置 / 打序)」
  - [x] **按鈕底色刻意不用隊伍主題色**:海盜隊主題為金色 `#FDB827`,白字配金底對比度僅約 1.7:1,遠低於可讀標準,且淺色系隊伍都會有同樣問題。改用中性底(`bg-card-hover` ＋ `border-border` ＋ `text-main`),在任何主題色與深淺模式下皆保證可讀;隊色改於 hover 時出現在邊框與文字
  - [x] 補測試釘住可見文字為 `Box`(而非完整敘述),避免日後改回長文字
  - [x] 以 Playwright 渲染賽前／進行中／已結束三種卡片狀態,深淺兩色確認
  - [x] 測試 172 項全數通過;TypeScript、ESLint（0 errors）與 Vite 打包驗證通過

- [x] **Phase 18: 進行中標記改色與打序列補上 AVG／OPS（2026-09-17）**
  - [x] **進行中比賽不再使用與敗投相同的紅色**:全站以 `emerald`(勝)、`rose`(敗)區分,而進行中原用 `red-500` —— `red-500` (#ef4444) 與 `rose-500` (#f43f5e) 肉眼幾乎無法分辨,進行中的比賽看起來像輸球。改用 `amber`,是三者中唯一不帶勝負語意的顏色
  - [x] 顏色抽為 `src/constants/gameStatus.ts` 的 `LIVE_ACCENT`(卡片外框／徽章／圓點／文字四種用法),避免四個檔案各自散落色碼;套用於 `ScoreboardCard`、`GameDetailPage`、`TeamDetailPage` 與 `FavoriteTeamSummaryCard`,全專案已無 `red-500`
  - [x] **保留**出局指示燈的 `rose-500`:那是「出局」語意(對打擊方不利),與勝敗標記無關
  - [x] 守備配置與打序分頁的打序列新增右側對齊的 **AVG / OPS** 欄位與欄位標題,數字採等寬字體便於縱向比對
  - [x] 比率數據取自 boxscore 的 `seasonStats`(單場 `stats` 不含比率數據,同 Phase 5 的既有發現);同一棒次已換人時顯示**當前在場者**的成績,被換下者的數據可由其球員頁查看
  - [x] 無賽季成績者(如初登板新人)顯示 `-`,不會出現空白或 `undefined`
  - [x] 補測試:斷言卡片與 LIVE 徽章不得出現 `red-500`／`rose-500`／`emerald-500`、打序列顯示 AVG／OPS、換人後取當前在場者、無資料時退回 `-`
  - [x] 以 Playwright 並排渲染進行中／已結束卡片與打序列,深淺兩色確認
  - [x] 測試由 172 項增至 176 項,全數通過;TypeScript、ESLint（0 errors）與 Vite 打包驗證通過

- [x] **Phase 19: 球員逐場紀錄補上所屬球隊、主客場與逐場專頁連結（2026-09-21）**
  - [x] **修正看不出「代表哪一隊出賽」**:逐場紀錄原本只讀 `log.opponent`,從未使用 `log.team`;季中被交易的球員整季紀錄混在一起,無從分辨哪幾場還在舊東家
  - [x] 查證 API 確實提供(對照 `python-mlb-statsapi` 的 dataclass):`Split` 基底提供 `team`,`HittingGameLog`／`PitchingGameLog` 另有 `isHome`、`isWin`、`game`(含 `gamePk`)、`date`、`opponent`,打者另有 `positionsPlayed`
  - [x] 「對手」欄改為「所屬 / 對戰」:`LAD vs 匹茲堡海盜`、`TEX @ 休士頓太空人`
  - [x] **所屬球隊以隊伍縮寫文字呈現而非隊徽**:隊徽載入失敗時 `onError` 會將其隱藏,若只用隊徽,圖一失敗所屬球隊就完全消失,等於沒修(實際渲染後才發現);對手維持隊徽＋隊名,兩者視覺上也因此可區分
  - [x] 日期欄連至 `#/games/:gamePk`,逐場紀錄與逐場 Box 專頁就此串接;無 `gamePk` 時退回純文字
  - [x] `GameLogSplit` 型別補上 `team`／`opponent`／`isHome`／`isWin`／`game`／`positionsPlayed`,逐場列不再是 `any`
  - [x] **型別化過程順帶抓出既有漏洞**:`GameLogStat` 缺少頁面實際讀取的 `runs`,以及 `getPitchingDecision()` 所需的 `wins`／`losses`／`saves`／`holds`／`blownSaves` 決勝計數欄位
  - [x] 補測試:交易球員兩隊皆可辨識、主客場分別顯示 `vs`／`@`、日期連結指向正確 gamePk、無 gamePk 時不產生連結
  - [x] 以 Playwright 渲染跨隊逐場紀錄,深淺兩色確認
  - [x] 測試由 176 項增至 180 項,全數通過;TypeScript、ESLint（0 errors,warnings 50 → 49）與 Vite 打包驗證通過

> 📌 **尚未使用但已可取得**:`positionsPlayed`(該場守備位置)與 `isWin`(球隊當場勝負),型別已備妥,需要時可直接用。

- [x] **Phase 20: Box 投手表標記勝敗/救援/中繼/救援失敗,並補齊既有但未顯示的數據（2026-09-23）**
  - [x] 投手名字旁新增決勝徽章 **W／L／SV／HLD／BS**,並以 MLB 慣例附上球季累計:`W (12-6)`、`SV (28)`、`BS (3)`
  - [x] **修正單數版 `getPitchingDecision()` 的錯誤假設**:原 docstring 宣稱「一次登板只會有一個決勝」,但專案 Phase 9 自己就驗證過「BS 後撿勝」情境 —— `blownSaves` 與 `wins` 會同時成立,舊函式會**默默丟掉 BS**。新增複數版 `getPitchingDecisions()` 回傳全部,單數版改為委派其第一項,球員頁逐場紀錄行為與既有測試完全不變
  - [x] 決勝徽章配色併入 `DECISION_ACCENT` 常數,依結果分組而非給五種色相:W／SV 用 emerald、L／BS 用 rose、HLD 用隊色;**BS 刻意不用 amber**,因為 amber 現在代表「比賽進行中」
  - [x] 維持 `HLD` 而非 MLB.com 的 `H`:投手表已有一個 `H` 欄位代表被安打數
  - [x] **投手表補上既有但未顯示的欄位**:`HR`(被全壘打)、`P-S`(總球數-好球數)、`BF`(面對打者數);後援投手另在名字下方顯示 `IR 2-1`(繼承跑者-其中回本壘得分)
  - [x] **打者表補上**:`LOB`(殘壘)欄位,名字旁標記 `HR`／`SB`
  - [x] 內嵌標記**排除二壘打與三壘打**:`2B`／`3B` 同時是守備位置縮寫,二壘手擊出二壘打會顯示成 `2B 2B`(實際渲染後才發現);這兩項本來就在已顯示的官方註記區(`2B: Seager (30)`)
  - [x] `BoxscorePittingStats`／`BoxscoreBattingStats` 型別補齊上述欄位與決勝計數(型別化再次攔下遺漏欄位)
  - [x] 修正既有測試的 `HR` 斷言:新增的投手 HR 欄位與官方註記的 HR 標籤撞名,改以註記內容比對
  - [x] 以 Playwright 渲染完整 Box 表格,深淺兩色確認
  - [x] 測試由 180 項增至 194 項,全數通過;TypeScript、ESLint（0 errors）與 Vite 打包驗證通過

- [x] **Phase 21: 戰績表與球隊頁標示賽季進度（2026-09-24）**
  - [x] 新增 `formatSeasonProgress()` 至既有 `statsFormatters.ts`（SSOT），輸出 `145/162`；缺值、負數、NaN 回傳 `-`
  - [x] 分母抽為 `src/constants/season.ts` 的 `MLB_REGULAR_SEASON_GAMES`，不硬寫在元件內
  - [x] 分子讀 standings 既有的 `gamesPlayed`，不多發請求；**明確不採用**「數球隊賽程」（延賽重複列出，實測光芒 2026 例行賽出現 164 場）與 `leagueRecord` 勝＋敗（季後賽期間會變成系列賽戰績）
  - [x] 分區戰績表新增「場次／GP」欄；球隊頁標題列新增「已賽 157/162」徽章
  - [x] 測試由 194 項增至 199 項，全數通過；TypeScript、ESLint（0 errors）與 Vite 打包驗證通過

- [x] **Phase 22: 季後賽淘汰賽樹狀圖，歷史自 2012 年起（2026-09-24）**
  - [x] 先寫 `docs/adr/0004-postseason-bracket.md`：實測 1903–2026 皆有資料，範圍訂為 2012 年起；列出 API 不提供、需前端推導的三項（晉級關係、種子、佔位隊伍）
  - [x] 新增 `src/utils/postseason.ts` 純函式：晉級關係以**隊伍比對**推導（2012 與 2019 的外卡→分區對應不同，不能寫死）；未分勝負時分配到來源最少的佔位席位
  - [x] 種子由 standings 的 `clinchIndicator`（z/y → x → w）＋ `leagueRank` 推算，以 2020、2025 驗證與官方一致；**首輪席位未全部確定前不顯示**，避免例行賽中途推出錯誤種子
  - [x] 佔位隊伍（如 `AL 4/5 Winner`）以「不在 `teams.json` 30 隊內」判定，顯示「待定」，不查隊徽、不連結球隊頁
  - [x] 系列賽戰績只累計 Final 且 `isWinner` 的場次，排除與補賽重複列出的延賽紀錄（2012 ALCS）
  - [x] 新增 `#/postseason/:season?` lazy 頁面：寬螢幕美聯／世界大賽／國聯左右對稱，窄螢幕上下堆疊並於卡片區內橫向捲動；每場以 G1–G7 連至逐場 Box 頁；導覽列新增「季後賽」
  - [x] API 以 `fields=` 精簡（整季約 20 KB）；當季 staleTime 5 分鐘、往年 24 小時，不輪詢
  - [x] 測試 fixture 為真實 API 回應（2012／2020／2025／2026 季後賽與 standings）
  - [x] 以瀏覽器實際檢視 2025（完賽）與 2026（尚未開打、佔位）兩種狀態，桌機與手機寬度皆無頁面橫向捲動
  - [x] 測試由 199 項增至 220 項，全數通過；TypeScript、ESLint（0 errors）驗證通過

- [x] **Phase 23: 球員在大小聯盟間升降時的數據正確性（2026-09-24）**
  - [x] 先寫 `docs/adr/0005-minor-league-support.md`（小聯盟整體決策，本階段為 A 部分）
  - [x] **修正：升上大聯盟後小聯盟數據消失**。原本只在「完全沒有大聯盟數據」時才補抓小聯盟（實例：Serven 2026 AAA 61 場被隱藏）；改用 `leagueListId=mlb_milb` 一次取得各層級，同時移除原本最多 3 次請求的兩段式補抓
  - [x] **修正：被下放後大聯盟數據被標成 `Triple-A`**。數據區層級標籤原本讀「目前所屬球隊」，現改讀數據本身
  - [x] **修正：我的最愛戰報看不到下放球員的比賽**，並改取「日期最新」一場（API 依層級分段而非依日期排序，`slice(-1)` 會取錯）
  - [x] 查證 `sportIds=1,11,...` 多值參數會被 API 忽略，不可用
  - [x] 新增 `src/utils/playerLevels.ts`：列出層級（排除 sport 21 小聯盟合計）、同層級跨隊取合計列、預設層級（目前所屬層級 → MLB → 第一個）、依日期排序
  - [x] 球員頁新增層級切換（MLB／AAA／…，僅多層級時顯示）；逐場紀錄各層級混合排序並標示層級
  - [x] 測試 fixture 為真實 API：升上來（Serven）、下放中（Trevor Martin）、同季兩層級皆跨隊（Halvorsen）
  - [x] 以瀏覽器確認 Trevor Martin 頁面預設 AAA、可切 MLB，逐場紀錄正確穿插 8/29 大聯盟出賽
  - [x] 測試由 220 項增至 239 項，全數通過；TypeScript、ESLint（0 errors，warnings 49 → 30）驗證通過

> ✅ 已於 Phase 26 處理：API 無 sabermetrics 時 FIP／FIP+／OPS+ 以大聯盟常數推算，小聯盟層級改為不顯示。

- [x] **Phase 24: 小聯盟比分、戰績與球隊頁（2026-09-24）**
  - [x] 首頁新增層級切換（MLB／AAA／AA／A+／A），比分板與戰績表跟著切換；**只查詢被選中的層級**，輪詢規則不變，只看大聯盟的使用者請求數與流量不變（ADR 0005 B 部分）
  - [x] 小聯盟戰績表只顯示勝／敗／勝率／勝差：外卡榜與 162 場進度是大聯盟概念；MLB 戰績元件拆為內部 `MlbStandings`，小聯盟模式下不會多抓大聯盟戰績
  - [x] 查證 `/standings?sportId=11` 回傳空資料，必須給 `leagueId`；各層級聯盟 id 放 `src/constants/levels.ts`
  - [x] **修正小聯盟球隊頁**：原本標題顯示「MLB 球隊」、賽程永遠空白（固定 `sportId=1`）。現在隊名、簡稱、分區、層級、母隊連結取自 `/teams/{id}`，賽程以該隊層級查詢，戰績查該隊所屬聯盟
  - [x] 小聯盟球隊頁隱藏只屬於大聯盟的部分：162 場進度、40 人／傷兵名單、收藏按鈕
  - [x] 已驗證逐場比賽頁不需修改即可顯示小聯盟比賽（Box、守備配置圖、球場外野輪廓）
  - [x] 以瀏覽器確認 AAA 比分板（含小聯盟隊徽）與 Rochester Red Wings 球隊頁
  - [x] 測試由 239 項增至 245 項，全數通過；TypeScript、ESLint（0 errors）驗證通過

- [x] **Phase 25: 依 code review 修正小聯盟相關問題（2026-09-24）**
  - [x] 球員頁層級選擇改為綁定球員：路由只換 `:personId` 時元件不重掛（例如從搜尋跳頁），原本選的 AAA 會帶到只有 MLB 數據的下一位球員，顯示「尚無出賽數據」且切換鈕消失
  - [x] 球隊頁名單分頁改為綁定球隊：在大聯盟隊開著傷兵分頁再跳到小聯盟隊，原本會對小聯盟隊查 40 人名單並套傷兵篩選，畫面空白
  - [x] 小聯盟球隊資料 (`/teams/{id}`) 載入失敗時顯示錯誤與重試，不再因為層級未知而默默顯示空賽程
  - [x] 小聯盟戰績無資料時顯示空狀態
  - [x] 各附重現測試；測試由 245 項增至 249 項，全數通過；TypeScript、ESLint（0 errors）驗證通過

- [x] **Phase 26: 小聯盟層級不顯示以大聯盟為基準的進階數據（2026-09-24）**
  - [x] 使用者決定：小聯盟層級隱藏 FIP、FIP+、wRC+/OPS+ 與「100 為聯盟平均基準」提示；API 在小聯盟沒有 sabermetrics，這幾項原本會用寫死的大聯盟常數（FIP 常數 3.10、聯盟 FIP 4.15、OBP .315／SLG .400）推算
  - [x] 切回 MLB 層級時照常顯示；K/9、BB/9 等純比率不受影響
  - [x] 測試由 249 項增至 251 項，全數通過

- [x] **Phase 27: 季後賽晉級圖改為 MLB「Postseason Picture」海報外觀（2026-09-24）**
  - [x] 每支球隊一格菱形（隊色底＋`team-cap-on-dark` 帽徽），左上角種子圓標，未定席位為灰色菱形，已淘汰者淡化（下墊不透明底，連接線不透出）
  - [x] 輪空種子直接置於分區賽欄；各格對齊送它進來的系列賽中點；粗灰直角連接線；美聯左、國聯鏡像右、世界大賽與冠軍居中；欄頂輪次名稱、欄底賽制
  - [x] 新增純函式 `src/utils/bracketLayout.ts` 計算座標（12 項測試，含 2012 一戰定勝負、2020 十六隊、2025 完賽、2026 未開打），`BracketDiagram` 以單一 SVG 繪製並等比縮放
  - [x] 系列賽比數標籤可點選（鍵盤可操作），圖下方顯示明細與 G1–G7；預設選最近一場比賽的系列賽；選取狀態綁定賽季
  - [x] 不複製 MLB 字標、世界大賽標誌與贊助商標誌；ADR 0004 補上外觀段落
  - [x] 以瀏覽器確認 2020／2025／2026 深淺兩色與手機寬度（圖內橫向捲動、頁面無橫向捲動）
  - [x] 測試由 251 項增至 264 項，全數通過；TypeScript、ESLint（0 errors）與 Vite 打包驗證通過
