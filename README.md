# PlateView ⚾

> **PlateView**（取自 Home Plate 本壘板 ＋ View 視野）是一個專為棒球迷、數據愛好者與台灣球迷打造的**現代化、極簡、零延遲、純開源的 MLB 大聯盟數據查詢與即時比分服務**。
>
> **PlateView** is a modern, lightweight, zero-latency, open-source MLB live stats and analytics web application built for baseball fans and sabermetrics enthusiasts worldwide.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen.svg?style=for-the-badge&logo=github)](https://vaalrl.github.io/PlateView/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Deploy to GitHub Pages](https://github.com/VaalRL/PlateView/actions/workflows/deploy.yml/badge.svg?style=for-the-badge)](https://github.com/VaalRL/PlateView/actions/workflows/deploy.yml)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-whoami885-orange.svg?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/whoami885)

🌐 **正式發布網址 (Production URL)**: [https://vaalrl.github.io/PlateView/](https://vaalrl.github.io/PlateView/)

---

## 📖 語言導航 / Language Switcher

* [🇹🇼 繁體中文說明文件 (Traditional Chinese)](#-繁體中文說明文件)
* [🇺🇸 English Documentation](#-english-documentation)

---

# 🇹🇼 繁體中文說明文件

## 🌐 線上即刻體驗

* 🚀 **正式站台網址**：[https://vaalrl.github.io/PlateView/](https://vaalrl.github.io/PlateView/)
* 🏆 **官方數據排行榜**：[https://vaalrl.github.io/PlateView/#/leaders](https://vaalrl.github.io/PlateView/#/leaders)
* 🏅 **季後賽晉級圖**：[https://vaalrl.github.io/PlateView/#/postseason](https://vaalrl.github.io/PlateView/#/postseason)
* 👑 **大谷翔平球員頁 (示範)**：[https://vaalrl.github.io/PlateView/#/players/660271](https://vaalrl.github.io/PlateView/#/players/660271)
* 🇹🇼 **鄧愷威球員頁 (示範)**：[https://vaalrl.github.io/PlateView/#/players/678906](https://vaalrl.github.io/PlateView/#/players/678906)

---

## ✨ 核心特色

- ⚡ **零伺服器、永久零成本（Zero-Cost Serverless）**：完全由 GitHub Pages 託管純靜態單頁應用程式（SPA），使用者瀏覽器直接連線大聯盟官方 CDN（`statsapi.mlb.com`），免後端、免資料庫、免主機維運費用。
- 🚫 **極致輕量與無廣告干擾（Ad-Free Minimalist UI）**：摒除傳統運動網站臃腫廣告與追蹤腳本，打包體積 < 500 KB，秒級即時載入。
- 🇹🇼 **在地化雙語體驗（Bilingual Localization）**：內建台灣球迷慣用之繁體中文譯名對照字典（支援搜尋「大谷」、「斯肯斯」、「法官」、「道奇」、「鄧愷威」等秒級匹配官方數據）。
- 📊 **進階賽伯計量學（Sabermetrics & Analytics）**：完整提供 WAR、wRC+、OPS+、FIP、FIP+、xFIP、wOBA、BABIP、ISO、K/9 等專業指標與 100 基準換算。
- 🛡️ **逐場比賽 Box 專頁與守備配置圖（Game Detail & Alignment Chart）**：`#/games/:gamePk` 專屬網址可分享，以 SVG 場地圖呈現雙方 1–9 號守備位置、1–9 棒打序與代打／代跑換人鏈，並附完整不截斷的 Box 數據。
- 🏅 **季後賽晉級圖（Postseason Bracket）**：仿 MLB「Postseason Picture」海報的菱形隊徽晉級圖，含種子序、系列賽比數與逐場連結，可回看 2012 年起每一年的季後賽。
- 🌱 **小聯盟支援（Minor Leagues）**：首頁可切換 AAA／AA／A+／A 的比分與戰績，小聯盟球隊有自己的球隊頁；球員在大小聯盟間升降時，各層級數據都能查到且標示正確。
- 🏆 **MLB 官方即時排行榜（Official Leaderboards）**：提供打擊 8 大榜單與投球 8 大榜單，支援全聯盟 (MLB)、美聯 (AL)、國聯 (NL) 即時切換。
- ⭐ **我的最愛今日戰報與備份同步（Daily Summary & Sync）**：一鍵展開關注球星今日表現精華，支援 JSON 匯出與匯入跨裝置備份。
- 🎨 **沉浸式 30 隊動態主題（30-Team Dynamic Theming）**：支援深色/淺色模式，並可一鍵切換 30 支大聯盟球隊之官方主題色。

---

## 📱 功能使用說明

### 1. ⚾ 即時比分與每日賽程 (Live Scoreboard)
* **聯盟層級切換**：比分板上方可切換 **MLB／AAA／AA／A+／A**，比分板與下方戰績表會一起切換。只會載入目前選的層級，只看大聯盟時流量與原本相同。
* **日期切換**：點擊頂部日期條的「前一天」、「今日」、「後一天」或指定日期，即時切換賽事。
* **比賽狀態與即時戰況**：
  * **進行中賽事**：30 秒自動輪詢更新比分、好壞球數、出局數（Outs 圓點）與動態壘包狀態（Bases Diamond）。
  * **點擊對戰卡片**：**已開打或已結束**的比賽可直接進入該場的 **逐場 Box 專頁** (`#/games/:gamePk`)，內含每局比分板 (Linescore)、守備配置圖、打序換人與完整 Box 數據。賽前場次尚無這些資料，因此不提供專頁入口，改於卡片上直接顯示開打時間與雙方預定先發投手。
* **全站無縫連結**：在對戰卡片中點擊球隊 Logo、先發投手 (SP)、勝/敗/救援投手姓名，均可一鍵跳轉至對應專屬頁面。
* **逐場 Box 專頁**：點擊首頁對戰卡片、或球隊頁的任一場賽事列，即進入 `#/games/:gamePk` 專屬頁面（可直接分享網址）。頁首為比分、賽況、球場、勝敗投與每局比分板，下方三個分頁：
  * **🛡️ 守備配置與打序**：左側 SVG 場地圖標示 1–9 號守備位置（大圈＝守位代號、**小圈＝打序棒次**，替補以 `*` 標記，進行中比賽高亮場上投手）；右側並列同隊 1–9 棒打序，同一棒次以箭頭串接先發與後續代打／代跑／雙重守備變換，另含板凳、牛棚與 MLB 官方換人註記。**場上小圈的棒次即是右側打序的列號**，一眼看出「第幾棒守哪裡」。上方可切換客隊／主隊。**外野輪廓依該球場官方公布之全壘打牆距離繪製**，芬威、PNC、道奇球場點進去會是看得出差別的形狀，外野手站位也隨牆的深淺調整；圖上標示各角度距離（如 `325 · 389 · 410 · 399 · 375 · 320`）。
  * **📊 完整 Box 數據**：所有打者與投手的逐場數據（不再截斷），並附官方註記（HR、SB、E 等分組說明）。
  * ⚠️ **說明**：守備配置圖呈現的是 MLB 官方登錄的 1–9 號守備位置（誰守哪個位置），**非 Statcast 的實際站位座標或布陣（shift）熱區**——後者未開放於官方公開 API。
* **賽季進度**：分區戰績表的「場次」欄與球隊頁標題旁的徽章，顯示該隊已打幾場（例：`157/162`）。
* **小聯盟戰績與球隊頁**：切到小聯盟層級時，戰績表依分區顯示勝、敗、勝率、勝差。點進小聯盟球隊會看到隊名、層級與「母隊旗下」連結、近期賽程與現役名單。外卡榜、162 場進度、40 人名單與傷兵名單、收藏球隊只適用於大聯盟，小聯盟不顯示。
* **球隊官網捷徑**：進入任一大聯盟球隊頁後，標題右側提供兩顆外部連結按鈕——「🛡️ 傷兵異動消息」直達官網球隊異動頁（含 IL 進出與傷勢說明），「🔗 球隊官網」直達 MLB 官方球隊首頁（例：`mlb.com/rays`）。

### 2. ⭐ 我的最愛與今日戰報彙總 (Favorites & Today's Summary)
* **收藏球星與球隊**：在任何球員或球隊頁面點擊「⭐ 收藏此球星／球隊」，首頁最愛列即時常駐顯示。
* **今日先發提醒**：若收藏的投手被排定為當日先發，人像旁會自動標記金色 `今日先發` 徽章。
* **展開今日戰報**：點擊最愛列右側 **「✨ 今日愛將戰報」** 按鈕，或直接點擊最愛卡片任一空白處即可展開／收合：
  * **球隊戰報**：同一張卡片並列 **今日與昨日** 兩場戰績——對戰比分與對手（如 `5 - 3 @ PIT`）、進行中局數、勝敗徽章；今日列另含 R / H / E 拆解，賽前則顯示開打時間與雙方預定先發投手，無賽程亦會明確標示。
  * **打者戰報**：即時顯示今日打席精華（如 `2-4 | HR, 3 RBI, BB`）、打擊率、OPS、全壘打與打點。
  * **投手戰報**：即時顯示投球局數、三振數、失分（如 `6.0 IP, 8 K, 1 ER`）、防禦率與 WHIP。
  * 若當日未出賽或輪休，會貼心展示最近一場的出賽精華。

### 3. 💾 我的最愛資料匯出／匯入與備份 (Backup & Restore)
* 點擊最愛列右側 **「⚙️ 備份 / 匯入」** 開啟管理視窗：
  * **匯出 (Export)**：可「📥 下載備份檔案 (JSON)」或「📋 複製備份代碼」，輕鬆備份您的收藏設定。
  * **匯入 (Import)**：提供「上傳 JSON 檔」或「貼上代碼」，並支援 **🔀 合併模式 (Merge)**（保留現有並追加新名單）與 **🔄 覆蓋模式 (Overwrite)**，方便在手機與電腦間快速同步。

### 4. 📈 進階賽伯計量學面板 (Sabermetrics Analytics)
在任何球員詳情頁中，系統提供專屬的進階數據卡片：
* **打者指標**：`WAR`（勝場貢獻值，具備等級高亮顏色）、`wRC+ / OPS+`（加權得分創造 / 標準化攻擊指數，自動計算優於聯盟平均之百分比）、`wOBA`、`BABIP`、`ISO` 等。
* **投手指標**：`WAR`、`FIP`（獨立防禦率）、`FIP+`（標準化獨立防禦率）、`xFIP`、`K/9`、`BB/9`。
* **容錯機制**：官方原生數據優先；若特定球員官方尚未回傳 FIP，系統會透過嚴謹公式即時計算補足。
* **小聯盟層級**：官方不提供小聯盟的進階數據，補算又只能用大聯盟平均當基準，所以小聯盟層級不顯示 FIP、FIP+、wRC+/OPS+。

### 5. 🏆 數據排行榜 (Stat Leaderboards)
* 點擊頂部導航列的 **「🏆 數據排行」** 或訪問 `#/leaders`：
  * **🏏 打擊排行**：打擊率 (AVG)、整體攻擊指數 (OPS)、全壘打 (HR)、打點 (RBI)、安打數 (H)、盜壘 (SB)、上壘率 (OBP)、長打率 (SLG)。
  * **⚾ 投球排行**：防禦率 (ERA)、每局被上壘率 (WHIP)、奪三振 (SO)、勝投 (W)、救援成功 (SV)、中繼成功 (HLD)、每九局三振 (K/9)、投球局數 (IP)。
  * 支援 **全大聯盟 (MLB)**、**美國聯盟 (AL)**、**國家聯盟 (NL)** 快速切換，名列前茅者享有 🥇 🥈 🥉 獎牌徽章。

### 6. 🏅 季後賽晉級圖 (Postseason Bracket)
* 點擊導航列的 **「🏅 季後賽」** 或訪問 `#/postseason`（指定年份：`#/postseason/2025`），右上角可切換 **2012 年起**的任一賽季。
* **版面**：每支球隊一格隊色菱形，左上角是種子序。輪空的 1、2 號種子直接排在分區賽欄。美聯在左、國聯在右，世界大賽與冠軍在中間。每欄上方標示輪次，下方標示賽制（3 戰 2 勝制等）。
* **比數與逐場**：連接線交會處標示系列賽比數（如 `4-3`，未開打顯示 `vs`）。點選比數，圖下方會顯示該系列賽明細與 G1–G7 連結，可進入逐場 Box 頁。打開頁面時預設選取最近一場比賽所屬的系列賽。
* **尚未確定的席位**：季後賽開打前或尚未分出勝負時，未定席位顯示為灰色菱形（待定）。種子序要等首輪席位全部確定才顯示，以免例行賽途中推算出錯誤的種子。
* 已淘汰的球隊會淡化；歷年賽制差異（2012–2021 一戰定勝負外卡、2020 年 16 隊）都能正確呈現。

### 7. 🌱 球員在大小聯盟間升降 (Minor League Players)
* 球員頁的數據區多了 **層級切換**（MLB／AAA／AA／A+／A／ROK，只有打過多個層級時才出現）。預設停在球員**目前所在**的層級：剛被下放就看小聯盟成績，剛升上來就看大聯盟成績。
* 同一層級季中換過球隊時，顯示兩隊合計的成績。
* **近 10 場逐場紀錄**把各層級的比賽依日期混排，小聯盟場次會標示層級（如 `AAA`）。
* 我的最愛戰報同樣會顯示被下放球員在小聯盟的最新一場比賽。

### 8. 🔍 中英雙語全局搜尋 (Search Modal)
* 按下鍵盤快捷鍵 `Ctrl + K` 或點擊頂部搜尋框，可輸入中文（如「大谷」、「賈吉」、「道奇」、「鄧愷威」）或英文進行即時模糊匹配，小聯盟球員也搜尋得到。

### 9. 🎨 30 隊主題與語系切換
* 點擊導航列右側調色盤圖示，可自由切換深色/明亮模式，或選取 30 支 MLB 球隊官方專屬主題色彩（如道奇藍、洋基海軍藍、紅襪紅等）。
* 點擊語言切換按鈕，全站即時在中英雙語間無縫轉換。

---

## 🛠️ 技術架構

| 領域 | 技術選型 | 說明 |
|---|---|---|
| **核心框架** | **React 18/19 + TypeScript 5+** | 現代化型別安全 UI 開發 |
| **建置工具** | **Vite 5+** | 極速開發體驗與最佳化打包 |
| **樣式與圖標** | **Tailwind CSS 3+ ＋ Lucide React** | 動態 CSS 變數主題與輕量圖標 |
| **資料快取與狀態** | **TanStack Query v5 (React Query)** | 自動輪詢、請求去重、背景快取 |
| **路由管理** | **React Router DOM (`HashRouter`)** | 完全相容 GitHub Pages 靜態託管 |
| **資料來源** | **MLB Stats API (`statsapi.mlb.com/api/v1`)** | 官方開放 REST API |
| **測試框架** | **Vitest + React Testing Library** | TDD 規範，260+ 項單元與元件測試，關鍵情境以真實 API 回應為 fixture |

---

## 🚀 本機開發指南

### 前置需求
* **Node.js** >= 18.0.0
* **npm** >= 9.0.0

### 安裝與啟動
```bash
# 1. 複製儲存庫
git clone https://github.com/VaalRL/PlateView.git
cd PlateView

# 2. 安裝相依套件
npm install

# 3. 啟動本機開發伺服器
npm run dev
```
瀏覽器開啟 `http://localhost:5173/` 即可檢視應用。

### 常用指令
```bash
npm run dev          # 啟動本機 Vite 開發伺服器 (熱重載)
npm run build        # TypeScript 型別檢查並打包生產檔案至 dist/
npm run preview      # 本機預覽 dist/ 打包產物
npm run test         # 執行 Vitest 單元測試
npm run lint         # 執行程式碼品質檢查
```

---

# 🇺🇸 English Documentation

## 🌐 Live Production Application

* 🚀 **Live Site**: [https://vaalrl.github.io/PlateView/](https://vaalrl.github.io/PlateView/)
* 🏆 **MLB Stat Leaderboards**: [https://vaalrl.github.io/PlateView/#/leaders](https://vaalrl.github.io/PlateView/#/leaders)
* 🏅 **Postseason Bracket**: [https://vaalrl.github.io/PlateView/#/postseason](https://vaalrl.github.io/PlateView/#/postseason)
* 👑 **Shohei Ohtani Profile (Demo)**: [https://vaalrl.github.io/PlateView/#/players/660271](https://vaalrl.github.io/PlateView/#/players/660271)
* 🇹🇼 **Kai-Wei Teng Profile (Demo)**: [https://vaalrl.github.io/PlateView/#/players/678906](https://vaalrl.github.io/PlateView/#/players/678906)

---

## ✨ Key Features

- ⚡ **Zero-Cost Serverless**: 100% static single page application hosted on GitHub Pages. Direct client-side connections to official MLB Stats API CDN (`statsapi.mlb.com`). Zero backend, zero database, zero hosting cost.
- 🚫 **Ad-Free & Ultralight UI**: Clean, distraction-free interface with bundle size < 500 KB and instant load times.
- 🇹🇼 **Bilingual Localization**: Built-in Traditional Chinese translation dictionary for Taiwanese baseball fans alongside full English support.
- 📊 **Advanced Sabermetrics & Analytics**: In-depth stats including WAR, wRC+, OPS+, FIP, FIP+, xFIP, wOBA, BABIP, ISO, K/9, BB/9 with league baseline (100) comparison.
- 🛡️ **Game Detail Page & Alignment Chart**: a shareable `#/games/:gamePk` page rendering both teams' 1-9 defensive positions on an SVG field chart, the full batting order with substitution chains, and an untruncated box score.
- 🏅 **Postseason Bracket**: a diamond-tile bracket modelled on MLB's "Postseason Picture", with seeds, series scores and links to every game, for every postseason since 2012.
- 🌱 **Minor Leagues**: switch the scoreboard and standings to AAA, AA, A+ or A, browse minor league team pages, and see a player's stats at every level when he moves between the majors and the minors.
- 🏆 **MLB Official Stat Leaderboards**: Comprehensive top-ranking leaderboards across 16 core batting and pitching categories with All MLB / AL / NL filters.
- ⭐ **Favorites Bar, Today's Summary & Backup Sync**: Real-time daily stats summary drawer for favorited stars with JSON export/import for cross-device syncing.
- 🎨 **30-Team Dynamic Theming**: Dark/Light mode and customizable accent palettes inspired by all 30 MLB franchises.

---

## 📱 User Guide & Features

### 1. ⚾ Live Scoreboard & Daily Schedule
* **Level Switcher**: Above the scoreboard, pick **MLB / AAA / AA / A+ / A**; the scoreboard and the standings below follow it. Only the chosen level is loaded, so staying on MLB costs no extra data.
* **Date Navigation**: Switch between past, present, and future dates effortlessly.
* **Live Match State**: 30-second automated polling with count display (Balls, Strikes, Outs), real-time base runners diamond, and venue information.
* **In-Game Linescores**: Click a live or completed game card to open its detail page, carrying the official inning-by-inning linescore, R/H/E, defensive alignment and full box score. A game that has not started has none of those yet, so it offers no detail page and shows its first pitch time and probable starters on the card instead.
* **Direct Navigation**: Click on any team logo, probable starting pitcher, or decision pitcher to open their respective detail pages.
* **Standalone Game Page**: Click a scoreboard card, or any row in a team's schedule, to reach `#/games/:gamePk` — a shareable page headed by the score, status, venue, decisions and linescore, with three tabs:
  * **🛡️ Alignment & Lineup**: an SVG field chart on the left placing the fielders at scorekeeping positions 1-9 (large circle = position, **small circle = batting slot**, substitutes marked `*`, pitcher on the mound highlighted during live games), and the same team's 1-9 batting order beside it, each slot chaining the starter to every pinch hitter, pinch runner and double switch, plus bench, bullpen and MLB's own substitution notes. **A fielder's slot badge is the row number next to it**, so who bats where reads at a glance. A switcher picks the away or home team. **The outfield wall is drawn from the venue's published home run distances**, so Fenway, PNC and Dodger Stadium each come out a recognisably different shape and the outfielders play shallower in front of a short porch; the distances are quoted on the chart.
  * **📊 Full Box Score**: every batter and pitcher, untruncated, with the official remark groups (HR, SB, E and so on).
  * ⚠️ **Note**: the alignment chart shows MLB's official 1-9 scorekeeping positions (who plays where), **not Statcast tracked fielder coordinates or shift alignment**, which MLB does not expose through its public API.
* **Season Progress**: The standings' GP column and a badge on each team page show how far into the season a team is (e.g. `157/162`).
* **Minor League Standings & Teams**: At a minor league level the standings list W / L / PCT / GB per division. A minor league team page shows its name, level, parent club link, recent games and active roster. Wild cards, 162-game progress, the 40-man and injured lists, and team favorites are MLB-only and are not shown there.
* **Official Shortcuts**: Each MLB team page carries an "Injury & Transactions" button (IL moves with injury reasons) and an "Official Site" button, both opening mlb.com in a new tab (e.g. `mlb.com/rays`).

### 2. ⭐ Favorites Bar & Today's Summary
* **Pin Players & Teams**: Click "⭐ Favorite Player/Team" on any detail page to pin them to the homepage favorites strip.
* **Today's Starter Indicator**: Pitchers scheduled to start today receive an amber badge highlighting their upcoming outing.
* **Expand Daily Live Summary**: Click **"✨ Today's Summary"**, or anywhere on the favorites card, to expand or collapse the drawer:
  * **Teams**: Today and yesterday side by side on one card — score and opponent (e.g. `5 - 3 @ PIT`), current inning, win/loss badge, plus R/H/E or probable starters.
  * **Batters**: View real-time game summaries (e.g. `2-4 | HR, 3 RBI, BB`), batting average, OPS, home runs, and RBIs.
  * **Pitchers**: View innings pitched, strikeouts, earned runs (e.g. `6.0 IP, 8 K, 1 ER`), ERA, and WHIP.
  * Shows either today's live stats or the most recent game performance.

### 3. 💾 Favorites Data Backup, Export & Import
* Click the **"⚙️ Backup / Sync"** button in the favorites bar:
  * **Export**: Download a JSON backup file (`plateview-favorites-YYYY-MM-DD.json`) or copy the code to your clipboard.
  * **Import**: Upload a backup JSON file or paste the code directly. Choose between **🔀 Merge Mode** (keeps existing favorites and adds new ones) or **🔄 Overwrite Mode** to seamlessly transfer settings between phone and computer.

### 4. 📈 Advanced Sabermetrics Panel
* Detailed sabermetrics cards on player profile pages:
  * **Batting**: WAR (with color-coded tiers), wRC+ and OPS+ (percentage difference relative to league average 100), wOBA, BABIP, ISO.
  * **Pitching**: WAR, FIP, FIP+ (normalized fielding independent pitching), xFIP, K/9, BB/9.
  * **Minor league lines**: MLB publishes no sabermetrics for the minors, and filling them in would measure against the MLB average, so FIP, FIP+ and wRC+/OPS+ are hidden at a minor league level.

### 5. 🏆 Stat Leaderboards (`#/leaders`)
* Access via top navigation **"🏆 Leaderboards"**:
  * **🏏 Batting**: AVG, OPS, HR, RBI, Hits, Stolen Bases, OBP, SLG.
  * **⚾ Pitching**: ERA, WHIP, Strikeouts, Wins, Saves, Holds, K/9, Innings Pitched.
  * Filter by **All MLB**, **American League (AL)**, or **National League (NL)**.

### 6. 🏅 Postseason Bracket (`#/postseason`)
* Open **"🏅 Postseason"** in the top navigation, or go to `#/postseason/2025` for a given year; any season **since 2012** can be picked.
* **Layout**: each team is a diamond tile in its colours with its seed badge. The top two seeds sit straight in the Division Series column. The AL is on the left, the NL on the right, and the World Series and champion are in the middle. Round names run across the top and series lengths along the bottom.
* **Scores & games**: each series' score (e.g. `4-3`, or `vs` before it starts) sits where its lines meet. Select it to see that series and its G1-G7 links below the bracket. The page opens on the series played most recently.
* **Undecided slots** are grey (TBD). Seeds appear once every first-round slot is settled, so a mid-season guess is never shown.
* Knocked-out teams are dimmed, and past formats (the 2012-2021 one-game wild card, the 16-team 2020 field) draw correctly.

### 7. 🌱 Players Moving Between the Majors and Minors
* The player page's stats gain a **level switcher** (MLB / AAA / AA / A+ / A / ROK, shown only for players with more than one level). It opens on the level the player is at **now**: just optioned down shows his minor league line, just called up shows MLB.
* A level split between two clubs shows the combined line.
* The **last 10 games** mix every level by date and badge the minor league ones (e.g. `AAA`).
* The favorites summary also shows an optioned favorite's latest minor league game.

### 8. 🔍 Bilingual Search (`Ctrl + K`)
* Press `Ctrl + K` or tap the search bar to search across all MLB and minor league players, Taiwanese prospects, and 30 teams in Traditional Chinese or English.

### 9. 🎨 Themes & Language
* Toggle between Light and Dark mode, or select from official colors of all 30 MLB clubs.
* Switch between Traditional Chinese (繁體中文) and English with one click.

---

## 🛠️ Technology Stack

* **Framework**: React 18/19 + TypeScript
* **Bundler**: Vite 5+
* **Styling**: Tailwind CSS + Lucide React Icons
* **Data Fetching & Cache**: TanStack Query v5 (React Query)
* **Routing**: React Router DOM (`HashRouter` for GitHub Pages)
* **Data Source**: Official MLB Stats API (`statsapi.mlb.com/api/v1`)
* **Testing**: Vitest + React Testing Library (260+ passing tests, key scenarios backed by real API responses as fixtures)

---

## 🚀 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/VaalRL/PlateView.git
cd PlateView

# Install dependencies
npm install

# Start development server
npm run dev

# Run automated tests
npm run test
```

---

## ⚖️ 免責宣告 / Legal Disclaimer

### 繁體中文
> **「本專案（PlateView）為開源非商業之棒球數據查詢工具，僅供個人學習、數據研究與球迷交流使用。本網站所引用之所有賽事比分、數據、球員肖像與球隊商標版權，均歸 Major League Baseball (MLB) 及其相關所屬實體所有。本專案與 Major League Baseball 無任何官方隸屬、授權或背書關係。」**

### English
> *"PlateView is an open-source, non-commercial baseball statistics explorer designed for personal research and educational purposes. All MLB trademarks, logos, team names, player photos, and statistical data are the intellectual property of Major League Baseball and its clubs. This project is not affiliated with, endorsed by, or sponsored by Major League Baseball."*

---

## ☕ 支持與贊助 / Support & Sponsor

如果您喜歡 **PlateView**，覺得這個專案對您的日常看球與數據查詢有所幫助，歡迎請開發者喝杯咖啡支持持續維護！

<a href="https://buymeacoffee.com/whoami885" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 50px !important;width: 180px !important;" />
</a>

* **Buy Me a Coffee**: [https://buymeacoffee.com/whoami885](https://buymeacoffee.com/whoami885)
* **Contact & Sponsor Email**: `whoami885@gmail.com`

---

## 📄 開源授權 (License)

本專案採用 [MIT License](LICENSE) 開源授權。
