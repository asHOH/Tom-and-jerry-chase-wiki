type Faction = '猫' | '鼠';

type Rate = `${number}.${number}%`;
type Rank =
  | '酷炫铂金'
  | '霸气钻石'
  | '至尊传奇'
  | '无敌猫鼠皇'
  | '机智黄金'
  | '顽皮白银'
  | '呆萌青铜'
  | '全部'
  | '皇0分-皇2000分'
  | '皇2000分以上';

interface CharacterRow {
  character: string;
  pickRate: Rate;
  winRate: Rate;
  banRate?: Rate;
}

interface WinRateSummaryRow {
  rank: Rank;
  teamType: '双排' | '四排' | '路人' | '双排*2' | '三排' | '总体';
  percent?: Rate;
  catWin: Rate;
  mouseWin: Rate;
}

export interface CharacterTable {
  rank: Rank;
  faction?: Faction;
  rows: CharacterRow[];
}

interface SummaryTable {
  rank: Rank;
  rows: WinRateSummaryRow[];
}

type TableEntry = CharacterTable | SummaryTable;

export interface WinRatesEntry {
  timeRange: string;
  winRateSummary?: WinRateSummaryRow[];
  tables?: TableEntry[];
  characterTables?: CharacterTable[];
}

export interface CharacterWinRateEntry {
  timeRange: string;
  rank: string;
  faction?: Faction;
  pickRate: string;
  winRate: string;
  banRate?: string;
}
