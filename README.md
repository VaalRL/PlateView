# PlateView ⚾

> **PlateView**（取自 Home Plate 本壘板 ＋ View 視野）是一個專為棒球迷、數據愛好者與台灣球迷打造的**現代化、極簡、零延遲、純開源的 MLB 大聯盟數據查詢與即時比分服務**。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deploy to GitHub Pages](https://github.com/VaalRL/PlateView/actions/workflows/deploy.yml/badge.svg)](https://github.com/VaalRL/PlateView/actions/workflows/deploy.yml)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-whoami885-orange.svg?style=flat&logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/whoami885)

---

## ✨ 核心特色 (Key Features)

- ⚡ **零伺服器、永久零成本（Zero-Cost Serverless）**：完全由 GitHub Pages 託管純靜態單頁應用程式（SPA），使用者瀏覽器直接連線大聯盟官方 CDN（`statsapi.mlb.com`），免後端、免資料庫、免主機維運費用。
- 🚫 **極致輕量與無廣告干擾（Ad-Free Minimalist UI）**：摒除傳統運動網站臃腫廣告與追蹤腳本，打包體積 < 500 KB，秒級即時載入。
- 🇹🇼 **在地化雙語體驗（Bilingual Localization）**：內建台灣球迷慣用之繁體中文譯名對照字典（支援搜尋「大谷」、「斯肯斯」、「道奇」、「山本」秒級匹配官方數據）。
- 🎨 **沉浸式 30 隊動態主題（30-Team Dynamic Theming）**：支援深色/淺色模式，並可一鍵切換 30 支大聯盟球隊之官方主題色。
- 📊 **即時比分與進階數據（Live Scoreboard & Analytics）**：30 秒自動輪詢進行中賽事、好壞球/出局數/壘包動態、局數比分板（Linescore）、分區戰績與外卡榜、球員近 10 場 Game Logs。

---

## 🛠️ 技術架構 (Tech Stack)

| 領域 | 技術選型 | 說明 |
|---|---|---|
| **核心框架** | **React 18/19 + TypeScript 5+** | 現代化型別安全 UI 開發 |
| **建置工具** | **Vite 5+** | 極速開發體驗與最佳化打包 |
| **樣式與圖標** | **Tailwind CSS 3+ ＋ Lucide React** | 動態 CSS 變數主題與輕量圖標 |
| **資料快取與狀態** | **TanStack Query v5 (React Query)** | 自動輪詢、請求去重、背景快取 |
| **路由管理** | **React Router DOM (`HashRouter`)** | 完全相容 GitHub Pages 子路徑靜態託管 |
| **資料來源** | **MLB Stats API (`statsapi.mlb.com/api/v1`)** | 官方免費開放 CORS API，零 API Key 限制 |
| **測試框架** | **Vitest + React Testing Library** | 遵循 TDD 規範與高覆蓋率驗證 |

---

## 🚀 快速開始 (Getting Started)

### 前置需求
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

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

---

## 💻 常用開發指令 (NPM Scripts)

```bash
npm run dev          # 啟動本機 Vite 開發伺服器 (熱重載)
npm run build        # TypeScript 型別檢查並打包靜態生產檔案至 dist/
npm run preview      # 本機預覽 dist/ 打包產物
npm run test         # 執行 Vitest 單元測試 (TDD)
npm run test:ui      # 啟動 Vitest 視覺化測試儀表板
npm run test:run     # 執行單次測試 (CI 模式)
npm run lint         # 執行 ESLint 程式碼品質檢查
```

---

## 📂 專案架構概覽 (Directory Structure)

```text
plateview/
├── .github/workflows/      # GitHub Actions CI/CD 自動化發布流水線
├── public/                 # 靜態資源 (Favicon, 404.html)
├── src/
│   ├── assets/             # 靜態資源與占位圖
│   ├── components/         # 依領域劃分的 UI 元件
│   │   ├── common/         # Navbar, SearchModal, ThemeSelector, Footer
│   │   ├── scoreboard/     # ScoreboardGrid, ScoreboardCard, LinescoreModal
│   │   ├── standings/      # StandingsTable (分區戰績與外卡榜)
│   │   ├── team/           # TeamHeader, RosterList
│   │   ├── player/         # PlayerHeader, StatsCard, GameLogsTable
│   │   └── favorite/       # FavoritesBar (釘選追蹤列)
│   ├── data/               # 靜態球隊檔 (teams.json) 與繁中球星對照檔 (players-zh-tw.json)
│   ├── hooks/              # useFavorites, useTheme 等自訂 Hooks
│   ├── pages/              # HomePage, TeamDetailPage, PlayerDetailPage
│   ├── services/           # mlbApi.ts, queries.ts (API 與 React Query 快取)
│   ├── types/              # mlb.d.ts (完整 TypeScript 介面定義)
│   └── utils/              # timezone.ts, statsFormatters.ts
├── tests/                  # 單元測試與整合測試 (Vitest)
└── docs/adr/               # 架構決策記錄 (Architecture Decision Records)
```

---

## ⚖️ 法律合規性與開源免責宣告 (Legal Disclaimer)

### 繁體中文免責宣告
> **「本專案（PlateView）為開源非商業之棒球數據查詢工具，僅供個人學習、數據研究與球迷交流使用。本網站所引用之所有賽事比分、數據、球員肖像與球隊商標版權，均歸 Major League Baseball (MLB) 及其相關所屬實體所有。本專案與 Major League Baseball 無任何官方隸屬、授權或背書關係。」**

### English Disclaimer
> *"PlateView is an open-source, non-commercial baseball statistics explorer designed for personal research and educational purposes. All MLB trademarks, logos, team names, player photos, and statistical data are the intellectual property of Major League Baseball and its clubs. This project is not affiliated with, endorsed by, or sponsored by Major League Baseball."*

---

## ☕ 支持與贊助本專案 (Support & Sponsor)

如果您喜歡 **PlateView**，覺得這個專案對您的日常看球與數據查詢有所幫助，歡迎請開發者喝杯咖啡支持持續維護！

<a href="https://buymeacoffee.com/whoami885" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 50px !important;width: 180px !important;" />
</a>

- **Buy Me a Coffee**: [https://buymeacoffee.com/whoami885](https://buymeacoffee.com/whoami885)
- **聯絡與贊助 Email**: `whoami885@gmail.com`

---

## 📄 開源授權 (License)

本專案採用 [MIT License](LICENSE) 開源授權。
