export interface CellModel {
  row: number;
  column: number;
  mine: boolean;
  flagged: boolean;
  adjacentMines: number;
  revealed: boolean;
}

export interface BoardModel {
  rows: number;
  cols: number;
  totalMines: number;
  gameOver: boolean;
  won: boolean;
  cells: CellModel[];
}

export interface GameLevel {
  name: string;
  rows: number;
  cols: number;
  mines: number;
}

export interface GameHistory {
  id: string;
  level: string;
  result: 'won' | 'lost';
  duration: number;
  clicks: number;
  date: Date;
  size: string;
  mines: number;
}