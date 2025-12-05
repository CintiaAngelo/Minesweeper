import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BoardModel } from '../models/game.models';

@Injectable({
  providedIn: 'root'
})
export class MinesweeperService {
  private apiUrl = 'http://localhost:8080/api/minesweeper';

  constructor(private http: HttpClient) {}

  newGame(rows: number = 8, cols: number = 8, mines: number = 10): Observable<string> {
    return this.http.post(`${this.apiUrl}/new`, null, {
      params: { rows, cols, mines },
      responseType: 'text'
    });
  }

  getGame(id: string): Observable<BoardModel> {
    return this.http.get<BoardModel>(`${this.apiUrl}/${id}`);
  }

  reveal(id: string, row: number, col: number): Observable<BoardModel> {
    return this.http.post<BoardModel>(`${this.apiUrl}/${id}/reveal`, null, {
      params: { row, col }
    });
  }

  flag(id: string, row: number, col: number): Observable<BoardModel> {
    return this.http.post<BoardModel>(`${this.apiUrl}/${id}/flag`, null, {
      params: { row, col }
    });
  }
}