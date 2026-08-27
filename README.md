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
* 👑 **大谷翔平球員頁 (示範)**：[https://vaalrl.github.io/PlateView/#/players/660271](https://vaalrl.github.io/PlateView/#/players/660271)
* 🇹🇼 **鄧愷威球員頁 (示範)**：[https://vaalrl.github.io/PlateView/#/players/678906](https://vaalrl.github.io/PlateView/#/players/678906)

---

## ✨ 核心特色

- ⚡ **零伺服器、永久零成本（Zero-Cost Serverless）**：完全由 GitHub Pages 託管純靜態單頁應用程式（SPA），使用者瀏覽器直接連線大聯盟官方 CDN（`statsapi.mlb.com`），免後端、免資料庫、免主機維運費用。
- 🚫 **極致輕量與無廣告干擾（Ad-Free Minimalist UI）**：摒除傳統運動網站臃腫廣告與追蹤腳本，打包體積 < 500 KB，秒級即時載入。
- 🇹🇼 **在地化雙語體驗（Bilingual Localization）**：內建台灣球迷慣用之繁體中文譯名對照字典（支援搜尋「大谷」、「斯肯斯」、「法官」、「道奇」、「鄧愷威」等秒級匹配官方數據）。
- 📊 **進階賽伯計量學（Sabermetrics & Analytics）**：完整提供 WAR、wRC+、OPS+、FIP、FIP+、xFIP、wOBA、BABIP、ISO、K/9 等專業指標與 100 基準換算。
- 🏆 **MLB 官方即時排行榜（Official Leaderboards）**：提供打擊 8 大榜單與投球 8 大榜單，支援全聯盟 (MLB)、美聯 (AL)、國聯 (NL) 即時切換。
- ⭐ **我的最愛今日戰報與備份同步（Daily Summary & Sync）**：一鍵展開關注球星今日表現精華，支援 JSON 匯出與匯入跨裝置備份。
- 🎨 **沉浸式 30 隊動態主題（30-Team Dynamic Theming）**：支援深色/淺色模式，並可一鍵切換 30 支大聯盟球隊之官方主題色。

---

## 📱 功能使用說明

### 1. ⚾ 即時比分與每日賽程 (Live Scoreboard)
* **日期切換**：點擊頂部日期條的「前一天」、「今日」、「後一天」或指定日期，即時切換賽事。
* **比賽狀態與即時戰況**：
  * **進行中賽事**：30 秒自動輪詢更新比分、好壞球數、出局數（Outs 圓點）與動態壘包狀態（Bases Diamond）。
  * **已結束賽事 (Final)**：點擊對戰卡片即可原地展開/收合 **MLB 官方每局比分板 (Linescore & Boxscore)** 與 R / H / E 詳細攻守數據。
* **全站無縫連結**：在對戰卡片中點擊球隊 Logo、先發投手 (SP)、勝/敗/救援投手姓名，均可一鍵跳轉至對應專屬頁面。

### 2. ⭐ 我的最愛與今日戰報彙總 (Favorites & Today's Summary)
* **收藏球星與球隊**：在任何球員或球隊頁面點擊「⭐ 收藏此球星／球隊」，首頁最愛列即時常駐顯示。
* **今日先發提醒**：若收藏的投手被排定為當日先發，人像旁會自動標記金色 `今日先發` 徽章。
* **展開今日戰報**：點擊最愛列右側 **「✨ 今日愛將戰報」** 按鈕：
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

### 5. 🏆 數據排行榜 (Stat Leaderboards)
* 點擊頂部導航列的 **「🏆 數據排行」** 或訪問 `#/leaders`：
  * **🏏 打擊排行**：打擊率 (AVG)、整體攻擊指數 (OPS)、全壘打 (HR)、打點 (RBI)、安打數 (H)、盜壘 (SB)、上壘率 (OBP)、長打率 (SLG)。
  * **⚾ 投球排行**：防禦率 (ERA)、每局被上壘率 (WHIP)、奪三振 (SO)、勝投 (W)、救援成功 (SV)、中繼成功 (HLD)、每九局三振 (K/9)、投球局數 (IP)。
  * 支援 **全大聯盟 (MLB)**、**美國聯盟 (AL)**、**國家聯盟 (NL)** 快速切換，名列前茅者享有 🥇 🥈 🥉 獎牌徽章。

### 6. 🔍 中英雙語全局搜尋 (Search Modal)
* 按下鍵盤快捷鍵 `Ctrl + K` 或點擊頂部搜尋框，可輸入中文（如「大谷」、「賈吉」、「道奇」、「鄧愷威」）或英文進行即時模糊匹配。

### 7. 🎨 30 隊主題與語系切換
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
| **測試框架** | **Vitest + React Testing Library** | TDD 規範與全套 66+ 單元測試驗證 |

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
* 👑 **Shohei Ohtani Profile (Demo)**: [https://vaalrl.github.io/PlateView/#/players/660271](https://vaalrl.github.io/PlateView/#/players/660271)
* 🇹🇼 **Kai-Wei Teng Profile (Demo)**: [https://vaalrl.github.io/PlateView/#/players/678906](https://vaalrl.github.io/PlateView/#/players/678906)

---

## ✨ Key Features

- ⚡ **Zero-Cost Serverless**: 100% static single page application hosted on GitHub Pages. Direct client-side connections to official MLB Stats API CDN (`statsapi.mlb.com`). Zero backend, zero database, zero hosting cost.
- 🚫 **Ad-Free & Ultralight UI**: Clean, distraction-free interface with bundle size < 500 KB and instant load times.
- 🇹🇼 **Bilingual Localization**: Built-in Traditional Chinese translation dictionary for Taiwanese baseball fans alongside full English support.
- 📊 **Advanced Sabermetrics & Analytics**: In-depth stats including WAR, wRC+, OPS+, FIP, FIP+, xFIP, wOBA, BABIP, ISO, K/9, BB/9 with league baseline (100) comparison.
- 🏆 **MLB Official Stat Leaderboards**: Comprehensive top-ranking leaderboards across 16 core batting and pitching categories with All MLB / AL / NL filters.
- ⭐ **Favorites Bar, Today's Summary & Backup Sync**: Real-time daily stats summary drawer for favorited stars with JSON export/import for cross-device syncing.
- 🎨 **30-Team Dynamic Theming**: Dark/Light mode and customizable accent palettes inspired by all 30 MLB franchises.

---

## 📱 User Guide & Features

### 1. ⚾ Live Scoreboard & Daily Schedule
* **Date Navigation**: Switch between past, present, and future dates effortlessly.
* **Live Match State**: 30-second automated polling with count display (Balls, Strikes, Outs), real-time base runners diamond, and venue information.
* **In-Game Linescores**: Click any completed game card to expand official inning-by-inning linescores and R/H/E boxscore summaries.
* **Direct Navigation**: Click on any team logo, probable starting pitcher, or decision pitcher to open their respective detail pages.

### 2. ⭐ Favorites Bar & Today's Summary
* **Pin Players & Teams**: Click "⭐ Favorite Player/Team" on any detail page to pin them to the homepage favorites strip.
* **Today's Starter Indicator**: Pitchers scheduled to start today receive an amber badge highlighting their upcoming outing.
* **Expand Daily Live Summary**: Click **"✨ Today's Summary"** in the favorites bar:
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

### 5. 🏆 Stat Leaderboards (`#/leaders`)
* Access via top navigation **"🏆 Leaderboards"**:
  * **🏏 Batting**: AVG, OPS, HR, RBI, Hits, Stolen Bases, OBP, SLG.
  * **⚾ Pitching**: ERA, WHIP, Strikeouts, Wins, Saves, Holds, K/9, Innings Pitched.
  * Filter by **All MLB**, **American League (AL)**, or **National League (NL)**.

### 6. 🔍 Bilingual Search (`Ctrl + K`)
* Press `Ctrl + K` or tap the search bar to search across all MLB players, Taiwanese prospects, and 30 teams in Traditional Chinese or English.

### 7. 🎨 Themes & Language
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
* **Testing**: Vitest + React Testing Library (66+ passing tests)

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
