/**
 * Minimal typings for `/transactions?playerId=`: one entry per roster move
 * (trade, signing, option, release, injured list ...).
 */
export interface TransactionTeam {
  id?: number;
  name?: string;
}

export interface Transaction {
  id?: number;
  person?: { id?: number; fullName?: string };
  fromTeam?: TransactionTeam;
  toTeam?: TransactionTeam;
  date?: string;
  effectiveDate?: string;
  resolutionDate?: string;
  /** Short code, e.g. TR for a trade */
  typeCode?: string;
  /** English name of the move, e.g. "Trade", "Optioned" */
  typeDesc?: string;
  /** Full English sentence, e.g. "Texas Rangers traded LHP ... to ..." */
  description?: string;
}

export interface TransactionsResponse {
  transactions?: Transaction[];
}
