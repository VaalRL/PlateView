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
    version: '1.6.2',
    date: '2026-10-18',
    changes: {
      zh: [
        '修正延賽或取消的比賽在球隊頁被標成輸球，並被算進近 10 場戰績；現在標示「延賽」或「取消」',
        '比分卡、收藏球隊卡與收藏列遇到延賽或取消的比賽，也不再顯示「已結束」或敗場',
      ],
      en: [
        'Fixed postponed and cancelled games showing as losses on team pages and counting toward the last-10 record; they are now marked Postponed or Cancelled',
        'Scoreboards, favorite team cards and the favorites bar no longer show such games as final or lost',
      ],
    },
  },
  {
    version: '1.6.1',
    date: '2026-10-16',
    changes: {
      zh: [
        '球員頁不再等季後賽資料才顯示；例行賽期間不再發出必定是空的季後賽請求',
        '季後賽場次載入失敗時會提示，並在之後重新載入，不再默默只顯示例行賽',
        '二刀流球員切換打擊／投球時，逐場紀錄的篩選會重設',
        '換到另一位球員時，回到逐場紀錄分頁',
        '同一天的多筆轉隊異動，最新的一筆排在最前面',
        '小聯盟球員的資料卡不再查詢大聯盟排行榜',
      ],
      en: [
        'Player pages no longer wait on postseason data, and no postseason request is sent while the regular season is on',
        'A failed postseason load is now flagged and retried instead of silently showing only the regular season',
        'Game log filters reset when a two-way player switches between hitting and pitching',
        'Moving to another player opens on the game logs tab',
        'Several transactions on one day list the latest first',
        'Hover cards for minor leaguers no longer look up the MLB leaderboards',
      ],
    },
  },
  {
    version: '1.6.0',
    date: '2026-10-16',
    changes: {
      zh: [
        '滑鼠停在球員或球隊上會顯示資料卡：大聯盟球隊的分區排名、勝率與戰績，小聯盟球隊所屬的大聯盟體系，球員目前所屬球隊與有上榜的排行榜名次',
        '球員頁新增轉隊記錄：交易、簽約、升降、DFA、釋出、傷兵名單等異動，與逐場紀錄以分頁切換',
        '逐場紀錄可看本季全部場次，新增賽事、層級、主客場、對手、月份篩選，並顯示篩選後的合計成績',
        '收藏摘要與球員逐場紀錄納入季後賽出賽，並標示「季後」',
        '球員體型同時顯示公分／公斤與英呎／磅',
      ],
      en: [
        'Hover over a player or team for a quick card: a big league club’s division rank, win percentage and record, a minor league club’s parent organization, and a player’s current club and leaderboard ranks',
        'Player pages add a transactions tab (trades, signings, call-ups and options, DFAs, releases, injured list) beside the game logs',
        'Game logs cover the whole season, with filters for game type, level, home/away, opponent and month, and totals for the filtered games',
        'Postseason games now appear in the favorites summary and player game logs, marked PS',
        'Player height and weight show in metric and imperial',
      ],
    },
  },
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
