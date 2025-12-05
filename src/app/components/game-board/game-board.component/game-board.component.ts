import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../header/header.component/header.component';
import { BoardModel, CellModel, GameHistory, GameLevel } from '../../../models/game.models';
import { MinesweeperService } from '../../../services/minesweeper.service';


@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent implements OnInit, OnDestroy {
  gameId: string | null = null;
  board: BoardModel | null = null;
  loading = false;
  

  levels: GameLevel[] = [
    { name: 'Fácil', rows: 8, cols: 8, mines: 10 },
    { name: 'Médio', rows: 12, cols: 12, mines: 20 },
    { name: 'Difícil', rows: 16, cols: 16, mines: 40 },
    { name: 'Personalizado', rows: 8, cols: 8, mines: 10 }
  ];
  
  selectedLevel: GameLevel = this.levels[0];
  customConfig = {
    rows: 8,
    cols: 8,
    mines: 10
  };

  isDarkMode = false;
  showManualInstructions = false;
  showGameStats = false;

  elapsedTime = 0;
  clickCount = 0;
  private timerInterval: any;
  private gameStarted = false;

  gameHistory: GameHistory[] = [];

  constructor(private minesweeperService: MinesweeperService) {}

  ngOnInit() {
    this.loadGameHistory();
    this.startNewGame();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  onLevelChange(): void {
    if (this.selectedLevel.name !== 'Personalizado') {
      this.startNewGame();
    } else {
      this.customConfig = {
        rows: this.selectedLevel.rows,
        cols: this.selectedLevel.cols,
        mines: this.selectedLevel.mines
      };
    }
  }

  startNewGame(): void {
    this.loading = true;
    this.resetCounters();
    
    let rows, cols, mines;
    
    if (this.selectedLevel.name === 'Personalizado') {
      rows = this.customConfig.rows;
      cols = this.customConfig.cols;
      mines = this.customConfig.mines;
    } else {
      rows = this.selectedLevel.rows;
      cols = this.selectedLevel.cols;
      mines = this.selectedLevel.mines;
    }

    if (mines >= rows * cols) {
      alert('Número de minas deve ser menor que o total de células!');
      this.loading = false;
      return;
    }

    this.minesweeperService.newGame(rows, cols, mines).subscribe({
      next: (id) => {
        this.gameId = id;
        this.loadGame();
      },
      error: (error) => {
        console.error('Erro ao criar novo jogo:', error);
        this.loading = false;
      }
    });
  }

  loadGame(): void {
    if (!this.gameId) return;
    
    this.minesweeperService.getGame(this.gameId).subscribe({
      next: (board) => {
        this.board = board;
        this.loading = false;
        this.resetCounters();
      },
      error: (error) => {
        console.error('Erro ao carregar jogo:', error);
        this.loading = false;
      }
    });
  }

  onCellClick(cell: CellModel, event: MouseEvent): void {
    if (!this.gameId || !this.board || this.board.gameOver || this.board.won || cell.revealed) {
      return;
    }

    // Inicia o timer no primeiro clique
    if (!this.gameStarted) {
      this.startTimer();
      this.gameStarted = true;
    }

    // Incrementa contador de cliques (apenas clique esquerdo)
    if (!event.ctrlKey && event.button !== 2) {
      this.clickCount++;
    }

    if (event.ctrlKey || event.button === 2) {
      this.toggleFlag(cell);
      event.preventDefault();
    } else {
      this.revealCell(cell);
    }
  }

  revealCell(cell: CellModel): void {
    if (!this.gameId || cell.flagged) return;

    this.minesweeperService.reveal(this.gameId, cell.row, cell.column).subscribe({
      next: (board) => {
        this.board = board;
        
        const clickedCell = this.getCell(cell.row, cell.column);
        if (clickedCell && !clickedCell.mine && clickedCell.adjacentMines === 0) {
          this.revealAdjacentCells(cell.row, cell.column);
        }
        
        this.checkGameStatus();
      },
      error: (error) => {
        console.error('Erro ao revelar célula:', error);
      }
    });
  }
  
//celula adjacente
  revealAdjacentCells(row: number, col: number): void {
    if (!this.gameId || !this.board) return;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow < this.board.rows && newCol >= 0 && newCol < this.board.cols) {
        const adjacentCell = this.getCell(newRow, newCol);
        
        if (adjacentCell && !adjacentCell.revealed && !adjacentCell.flagged && !adjacentCell.mine) {
          this.minesweeperService.reveal(this.gameId!, newRow, newCol).subscribe({
            next: (board) => {
              this.board = board;
              
              const updatedCell = this.getCell(newRow, newCol);
              if (updatedCell && updatedCell.adjacentMines === 0) {
                setTimeout(() => this.revealAdjacentCells(newRow, newCol), 10);
              }
            },
            error: (error) => {
              console.error('Erro ao revelar célula adjacente:', error);
            }
          });
        }
      }
    }
  }

  toggleFlag(cell: CellModel): void {
    if (!this.gameId || cell.revealed) return;

    this.minesweeperService.flag(this.gameId, cell.row, cell.column).subscribe({
      next: (board) => {
        this.board = board;
      },
      error: (error) => {
        console.error('Erro ao alternar bandeira:', error);
      }
    });
  }

  checkGameStatus(): void {
    if (!this.board) return;

    if (this.board.gameOver) {
      this.stopTimer();
      this.addGameToHistory('lost');
      setTimeout(() => {
        this.showGameStats = true;
      }, 500);
    } else if (this.checkWinCondition()) {
      this.stopTimer();
      this.board.won = true;
      this.addGameToHistory('won');
      setTimeout(() => {
        this.showGameStats = true;
      }, 500);
    }
  }

  checkWinCondition(): boolean {
    if (!this.board) return false;

    const unrevealedSafeCells = this.board.cells.filter(cell => 
      !cell.revealed && !cell.mine
    );

    return unrevealedSafeCells.length === 0;
  }

  getCell(row: number, col: number): CellModel | undefined {
    return this.board?.cells.find(c => c.row === row && c.column === col);
  }

  getGridTemplate(): string {
    if (!this.board) return '';
    return `repeat(${this.board.rows}, 40px) / repeat(${this.board.cols}, 40px)`;
  }

  getRemainingMines(): number {
    if (!this.board) return 0;
    const flaggedCells = this.board.cells.filter(cell => cell.flagged).length;
    return this.board.totalMines - flaggedCells;
  }

  onToggleDarkMode(darkMode: boolean): void {
    this.isDarkMode = darkMode;
  }

  onOpenInstructions(): void {
    this.showManualInstructions = true;
  }

  onCloseGameStats(): void {
    this.showGameStats = false;
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.elapsedTime++;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private resetCounters(): void {
    this.stopTimer();
    this.elapsedTime = 0;
    this.clickCount = 0;
    this.gameStarted = false;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getGameResultMessage(): string {
    if (!this.board) return '';
    
    if (this.board.won) {
      return 'Parabéns! Você Venceu!';
    } else if (this.board.gameOver) {
      return 'Game Over!';
    }
    return '';
  }

  restartGame(): void {
    this.onCloseGameStats();
    this.startNewGame();
  }

  private loadGameHistory(): void {
    const savedHistory = localStorage.getItem('minesweeperHistory');
    if (savedHistory) {
      this.gameHistory = JSON.parse(savedHistory).map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
    }
  }

  private saveGameHistory(): void {
    // Mantém apenas as últimas 3 partidas
    if (this.gameHistory.length > 3) {
      this.gameHistory = this.gameHistory.slice(0, 3);
    }
    localStorage.setItem('minesweeperHistory', JSON.stringify(this.gameHistory));
  }

  private addGameToHistory(result: 'won' | 'lost'): void {
    if (!this.board) return;

    const gameRecord: GameHistory = {
      id: this.generateGameId(),
      level: this.selectedLevel.name,
      result: result,
      duration: this.elapsedTime,
      clicks: this.clickCount,
      date: new Date(),
      size: `${this.board.rows}x${this.board.cols}`,
      mines: this.board.totalMines
    };

    // Adiciona no início do array (partida mais recente primeiro)
    this.gameHistory.unshift(gameRecord);
    this.saveGameHistory();
  }

  private generateGameId(): string {
    return 'game_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getResultIcon(result: 'won' | 'lost'): string {
    return result === 'won' ? '🎉' : '💥';
  }

  getResultText(result: 'won' | 'lost'): string {
    return result === 'won' ? 'Vitória' : 'Derrota';
  }

  getResultClass(result: 'won' | 'lost'): string {
    return result === 'won' ? 'history-won' : 'history-lost';
  }

  formatHistoryTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  formatHistoryDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    
    return date.toLocaleDateString('pt-BR');
  }

  clearHistory(): void {
    this.gameHistory = [];
    localStorage.removeItem('minesweeperHistory');
  }

  hasHistory(): boolean {
    return this.gameHistory.length > 0;
  }

  getGameStatus(): string {
    if (!this.board) return 'Não Iniciado';
    
    if (this.board.gameOver) {
      return 'Game Over';
    } else if (this.board.won) {
      return 'Vitória!';
    } else if (this.gameStarted) {
      return 'Em Andamento';
    } else {
      return 'Não Iniciado';
    }
  }

  getStatusIcon(): string {
    if (!this.board) return 'play_arrow';
    
    if (this.board.gameOver) {
      return 'dangerous';
    } else if (this.board.won) {
      return 'celebration';
    } else if (this.gameStarted) {
      return 'hourglass_empty';
    } else {
      return 'play_arrow';
    }
  }

  getStatusClass(): string {
    if (!this.board) return '';
    
    if (this.board.gameOver) {
      return 'game-over';
    } else if (this.board.won) {
      return 'won';
    } else if (this.gameStarted) {
      return 'in-progress';
    } else {
      return 'not-started';
    }
  }
}