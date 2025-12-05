import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Output() toggleDarkMode = new EventEmitter<boolean>();
  @Output() openInstructions = new EventEmitter<void>();

  isDarkMode = false;
  showInstructions = false;

  onToggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.toggleDarkMode.emit(this.isDarkMode);
    
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  onOpenInstructions(): void {
    this.showInstructions = true;
    this.openInstructions.emit();
  }

  onCloseInstructions(): void {
    this.showInstructions = false;
  }
}