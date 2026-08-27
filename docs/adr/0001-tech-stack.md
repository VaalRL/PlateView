# 0001. 技術堆疊選型：React + Vite + TypeScript 靜態單頁應用 (SPA) 直連 MLB CDN

- Status: Accepted
- Date: 2026-08-27

## Context
PlateView 專案的目標是為棒球迷提供現代化、極簡、零延遲、純開源的 MLB 大聯盟數據查詢與即時比分看板。
核心需求包括：
1. **永久零維運成本（Zero Cost）**：避免每月支付伺服器主機與資料庫租金。
2. **免除 Rate Limit 封鎖風險**：MLB API 未提供官方付費商業方案，若使用單一伺服器中繼請求容易遭 MLB 阻擋 IP。
3. **極速載入與雙語搜尋**：首屏體積需小於 500 KB，並支援繁體中文球星與球隊搜尋。
4. **易於開源協作與自動化部署**：透過 GitHub Pages 與 GitHub Actions 一鍵交付。

## Decision
我們決定採用 **React 18/19 + Vite + TypeScript 5+ + Tailwind CSS + TanStack Query v5 + React Router (HashRouter)** 建置純客戶端靜態單頁應用程式（SPA），完全託管於 **GitHub Pages**，並由使用者瀏覽器直接向 MLB 官方 CDN（`statsapi.mlb.com/api/v1`）發送 HTTPS 請求。

## Alternatives Considered
1. **Tauri v2 / Electron 桌面應用程式**：
   - *否決理由*：球迷查詢即時比分與數據需要跨裝置（手機、平板、公司電腦）極速開啟，桌面應用程式安裝門檻高、無法透過單一 URL 分享，且增加跨平台打包編譯複雜度。
2. **Next.js / Nuxt 伺服器渲染 (SSR) 架構**：
   - *否決理由*：SSR 需依賴 Node.js 伺服器託管（如 Vercel 或 VPS），會產生主機成本，且伺服器對外集中請求容易觸發 MLB 頻率限制。
3. **原生 JavaScript (Vanilla JS / jQuery)**：
   - *否決理由*：比分板（Linescore）、分區戰績表、即時輪詢與 30 隊主題切換具備高度動態狀態，缺乏宣告式組件化架構將導致維護成本急劇上升。

## Consequences
- **好處 (Pros)**：
  - 零主機營運成本，無流量與並發上限。
  - 客戶端分散式直連，徹底消除單點 Rate Limit 封鎖風險。
  - Vite + Tailwind 打包極致輕量，首屏秒開。
  - TanStack Query 提供成熟的請求去重、背景快取與輪詢控制。
- **代價與風險 (Cons & Risks)**：
  - 依賴 MLB 官方 CDN 的 CORS 政策（經實機驗證目前完全開放 `Access-Control-Allow-Origin: *`）。
  - GitHub Pages 不支援後端環境變數，所有敏感操作或需 API Key 的第三方服務不可納入。
