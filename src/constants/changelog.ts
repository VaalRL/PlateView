import type { Language } from '../i18n/translations';

/**
 * Release history shown when the footer version is clicked, newest first.
 *
 * The first entry must match `version` in package.json — a test enforces it,
 * so bump both together when cutting a release.
 */
export interface ChangelogEntry {
  version: string;
  /** Release date, YYYY-MM-DD */
  date: string;
  changes: Record<Language, readonly string[]>;
}

export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: '1.5.2',
    date: '2026-09-24',
    changes: {
      zh: [
        '修正季後賽對戰樹中巨人隊只顯示一片橘色：帽徽與底色同色的球隊（巨人、海盜、紅襪、響尾蛇）改用實際球帽顏色當底色',
      ],
      en: [
        'Fixed the Giants showing as a plain orange tile in the postseason bracket: teams whose cap logo matches their primary colour (Giants, Pirates, Red Sox, Diamondbacks) now sit on their actual cap colour',
      ],
    },
  },
  {
    version: '1.5.1',
    date: '2026-09-24',
    changes: {
      zh: [
        '修正切換到 A+ 層級時整頁空白：沒有分區的西北聯盟改以聯盟名稱顯示',
        '無賽程提示不再寫「MLB」，小聯盟層級也適用',
      ],
      en: [
        'Fixed a blank page when switching to A+: the Northwest League, which has no divisions, is now headed by its league name',
        'The no-games message no longer says “MLB”, so it reads right for minor league levels too',
      ],
    },
  },
  {
    version: '1.5.0',
    date: '2026-09-24',
    changes: {
      zh: [
        '新增季後賽對戰樹，可回溯至 2012 年，版面比照 MLB 官方 Postseason Picture',
        '新增小聯盟支援：依層級瀏覽比分、戰績與球隊頁面',
        '分區榜顯示各隊 162 場例行賽的進度',
        '修正球員在大小聯盟之間升降時，各層級數據遺失的問題',
        '小聯盟數據列不再顯示以大聯盟為基準的指標',
        '初次開啟改為英文與淺色主題，之後沿用你上次選擇的語言與主題',
      ],
      en: [
        'Postseason bracket back to 2012, laid out after MLB’s Postseason Picture',
        'Minor league support: browse scores, standings and team pages by level',
        'Standings show how far into the 162-game season each team is',
        'Fixed stats from other levels disappearing when a player moves between MLB and the minors',
        'MLB-relative stats are hidden on minor league lines',
        'First visits open in English with the light theme; your last language and theme choice is remembered',
      ],
    },
  },
  {
    version: '1.4.0',
    date: '2026-09-23',
    changes: {
      zh: [
        '球員逐場紀錄標示當場所屬球隊',
        'Box score 標示投手勝敗救援，並補上先前未呈現的數據',
      ],
      en: [
        'Player game logs show which team the player suited up for',
        'Box scores mark pitching decisions and surface previously unused stats',
      ],
    },
  },
  {
    version: '1.3.0',
    date: '2026-09-17',
    changes: {
      zh: [
        '新增比賽詳情頁：守備位置圖與打序整合於同一畫面',
        '外野全壘打牆依各球場公布的尺寸繪製',
        '以比賽詳情頁取代比分卡內嵌的 box score 面板',
        '進行中的比賽改用琥珀色標示，避免與代表敗場的紅色混淆',
        '修正主題色的透明度在部分元件無效的問題',
      ],
      en: [
        'Game detail page combining the defensive alignment chart and batting order',
        'Outfield walls drawn from each venue’s published dimensions',
        'The game detail page replaces the inline box score panels',
        'Live games are marked in amber instead of the colour that means a loss',
        'Fixed theme colour opacity not applying in some components',
      ],
    },
  },
  {
    version: '1.2.0',
    date: '2026-09-10',
    changes: {
      zh: [
        '最愛摘要新增球隊卡片，顯示今日與昨日賽況',
        '球隊頁新增官方網站與傷兵名單捷徑，修正傷兵分頁空白',
        '修正逐場紀錄中投手勝敗的判定',
      ],
      en: [
        'Team cards with today’s and yesterday’s games in the favorites summary',
        'Official site and injury list shortcuts on team pages; fixed the empty IL tab',
        'Fixed pitching decisions in player game logs',
      ],
    },
  },
  {
    version: '1.1.0',
    date: '2026-08-31',
    changes: {
      zh: [
        '賽季改為自動判斷，比賽進行中才定時更新，日期統一以美東時間計算',
        '頁面改為按需載入，加快首次開啟速度',
        '修正最愛備份的儲存鍵值並強化匯入檢查',
        'Box score 的打擊率與防禦率改讀當季累計數據',
        '各列表的球員姓名統一以英文顯示',
      ],
      en: [
        'Season is detected automatically, polling runs only during live games, and dates use US Eastern time',
        'Pages load on demand for a faster first visit',
        'Fixed favorites backup storage keys and hardened import',
        'Box score AVG and ERA read from season stats',
        'Player names display in English across all lists',
      ],
    },
  },
  {
    version: '1.0.0',
    date: '2026-08-27',
    changes: {
      zh: [
        '首次發布：即時比分、分區榜、球隊與球員頁面',
        '進階數據面板（WAR、wRC+、OPS+、FIP、wOBA 等）與數據排行榜',
        '最愛球員每日摘要，以及備份與還原',
        '繁中 / 英文介面、深淺色主題與行動裝置版面',
      ],
      en: [
        'First release: live scores, standings, team and player pages',
        'Sabermetrics panel (WAR, wRC+, OPS+, FIP, wOBA and more) and stat leaderboards',
        'Daily summary for favorite players, with backup and restore',
        'Chinese / English interface, light and dark themes, mobile layout',
      ],
    },
  },
];
