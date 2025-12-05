import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { GameBoardComponent } from './components/game-board/game-board.component/game-board.component';
import { HeaderComponent } from './components/header/header.component/header.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, GameBoardComponent, HeaderComponent],
  template: `
    <app-game-board></app-game-board>
  `,
  styles: []
})
export class AppComponent {
  title = 'minesweeper-frontend';
}