# 0002. 逐場比賽專頁 (`#/games/:gamePk`)：以 boxscore 單一請求驅動守備配置圖與打序圖

- Status: Accepted
- Date: 2026-09-16

## Context

目前 PlateView 的逐場資料只存在於一個折疊面板 `GameBoxscorePanel`，分別掛在首頁比分卡（`ScoreboardCard`）與球隊頁賽程列（`TeamDetailPage`）之下。這個設計有四個已確認的缺口：

1. **無法分享或深連結**：`App.tsx` 只有 `/`、`/teams/:teamId`、`/players/:personId`、`/leaders` 四條路由，單場比賽沒有自己的網址，使用者無法把「某一場的 Box」貼給別人。
2. **資料被截斷**：面板以 `batterIds.slice(0, 12)` 只渲染前 12 名打者，延長賽或大量換人的比賽會直接漏掉替補打者。
3. **看不到守備配置**：現有畫面只有兩張數字表格，無法回答「今天誰守游擊」「大谷是先發 DH 還是有守備」這類最基本的逐場問題。
4. **看不到打序與換人鏈**：代打、代跑、雙重守備變換完全沒有呈現。

需求是「逐場 box 專有頁面，能根據守備部陣與打次圖像化顯示」。因此需要先確認：**這些資料在零後端架構下拿得到嗎？**

## Decision

新增 **`#/games/:gamePk` 逐場比賽專頁**（lazy route），以 **既有的 `/game/{gamePk}/boxscore` 單一請求**驅動兩個新的圖像化元件，並額外用 `/schedule?gamePk={pk}` 取得頁首所需的比賽狀態與比分。

### 資料來源與可行性（已查證）

`/game/{gamePk}/boxscore` 單一回應即包含全部所需欄位：

| 欄位路徑 | 用途 |
|---|---|
| `teams.{home,away}.battingOrder` | 9 位先發打者的 personId 陣列 |
| `players.IDxxx.battingOrder` | 字串如 `"100"` / `"101"`：**百位＝第幾棒，末兩位＝該棒的第幾位球員（`00` 為先發，非 `00` 為替補）** |
| `players.IDxxx.position.abbreviation` | 該球員在本場的當前守備位置 |
| `players.IDxxx.allPositions[]` | 該場守過的所有位置（可標記一人多守位） |
| `players.IDxxx.gameStatus` | `isCurrentBatter` / `isCurrentPitcher` / `isOnBench` / `isSubstitute` |
| `teams.X.bench` / `bullpen` | 板凳與牛棚名單 |
| `teams.X.pitchers` | 依登板順序排列的投手 personId 陣列（末位＝當前/最後投手） |
| `teams.X.info[]` / `note[]` | MLB 官方文字註記（如「a-7 局代打 X」） |

進行中的比賽另可由 `schedule` 的 `linescore.defense` / `linescore.offense` 取得即時對位（本專案 `types/mlb.d.ts` 已有型別，`ScoreboardCard` 的壘包菱形已在使用）。

> 註：`battingOrder` 末兩位判定替補、`allPositions`、`info` / `note` 的用法交叉驗證自 `toddrob99/MLB-StatsAPI` 的實作與 `gomlb` 的 `BoxscoreTeam` struct 定義。撰寫本 ADR 的環境無法直連 `statsapi.mlb.com`（egress 政策封鎖），因此**所有解析邏輯都寫成 `src/utils/lineup.ts` 的純函式並以單元測試鎖定行為**，欄位若與實際回應有出入，只需修改單一檔案。

### 明確不做的事（範圍邊界）

1. **不做 Statcast 意義的守備布陣（shift）站位**：野手實際站位座標與 `if_fielding_alignment` / `of_fielding_alignment`（Standard / Infield shift / Strategic）只存在於 Baseball Savant，並非開放 CORS 的端點，零後端架構取不到。本頁提供的是**「守備配置圖」＝誰站在 1–9 號哪個位置**，文案一律避免使用 shift／布陣熱區等會造成誤解的說法。（2023 年限制守備布陣新規上路後，該欄位的分析價值本身也已大幅縮水。）
2. **不做逐局守備變動時間軸**：boxscore 只提供「當前／最終」守位與 `allPositions`，不含變動發生的局數。要精確到「第幾局誰換誰」必須改打 `/api/v1.1/game/{pk}/feed/live` 的 `playEvents` action 事件，單場 payload 達數 MB，與本專案 < 500 KB、行動裝置省流量的取向直接衝突。
3. **不做打球落點噴灑圖**：`hitData.coordinates` 同樣只在 feed/live 之下，理由同上。

## Alternatives Considered

1. **維持折疊面板、只在面板內加圖**
   - *否決理由*：無法解決深連結與分享問題；面板寬度受比分卡限制，場地圖在窄容器內無法閱讀；且 `TeamDetailPage` 與 `ScoreboardCard` 兩處都要各自處理展開狀態。
2. **改用 `/api/v1.1/game/{pk}/feed/live` 作為單一資料源**
   - *否決理由*：feed/live 一次回傳整場 GUMBO（逐球事件），單場數 MB。雖然能換到逐局布陣時間軸，但對「誰守哪個位置」這個主要需求而言，成本與收益完全不成比例。保留為 v2 的可選增強。
3. **引入圖表函式庫（D3 / Recharts / visx）繪製場地**
   - *否決理由*：場地圖是固定 9 個節點的靜態版面，手刻 SVG 約 3–5 KB 即可完成；引入圖表庫會讓打包體積增加一個數量級，違反 ADR 0001 的首屏 < 500 KB 約束。
4. **用 `/game/{pk}/linescore` 取得頁首資訊**
   - *否決理由*：linescore 回應不含比賽狀態（Preview / Live / Final）與勝敗投手。改用 `/schedule?gamePk={pk}`，回應型別與既有的 `GameSchedule` 完全相同，可直接沿用 `formatBilingualGameTime`、`scheduleHasLiveGames` 等既有工具（SSOT）。

## Consequences

- **好處 (Pros)**：
  - **零額外網路成本**：專頁與折疊面板共用 `['game-boxscore', gamePk]` 這把 TanStack Query 快取鍵，從首頁展開後再點進專頁是 0 次請求。
  - **零新依賴**：場地圖為手刻 SVG，打包增量僅路由層 lazy chunk。
  - 補上可分享的深連結，並讓 Box 表格不再截斷。
  - 解析邏輯集中在 `src/utils/lineup.ts` 純函式，符合專案既有的高可測性原則。
  - 表格抽成 `BoxscoreTables.tsx` 共用元件後，面板與專頁不再有兩份重複的表格邏輯。
- **代價與風險 (Cons & Risks)**：
  - 使用者若期待 Baseball Savant 式的站位熱區會落空，需靠 UI 文案（「守備配置」而非「布陣」）管理期待值。
  - 多打一次 `/schedule?gamePk=` 請求（僅專頁直接開啟時；由首頁點入會命中既有的當日 schedule 快取的可能性視日期而定）。
  - 守備配置圖在窄螢幕需退化策略：SVG 以 `viewBox` 等比縮放，並在圖下方保留 1–9 條列，確保手機可讀。
  - `battingOrder` 的字串格式屬未公開文件的行為，若 MLB 變更格式，`parseBattingOrder()` 需同步調整（已以單元測試鎖定）。
