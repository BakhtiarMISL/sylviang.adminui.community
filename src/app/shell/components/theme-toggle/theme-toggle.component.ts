import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { Theme, ThemeService } from '../../services/theme.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-theme-toggle',
  template: `
    <button
      class="border-2 border-borderLight dark:border-neutral rounded-full w-11 h-11 flex items-center justify-center cursor-pointer transition-all duration-300 text-borderDark dark:text-borderLight hover:border-primary hover:bg-primary hover:text-white hover:scale-105 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
      (click)="toggleTheme()"
      [attr.aria-label]="isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'"
      title="{{ isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme' }}"
    >
      <svg *ngIf="!isDarkTheme" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
      <svg *ngIf="isDarkTheme" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  `,
  styleUrls: ['./theme-toggle.component.scss'],
  imports: [NgIf],
})
export class ThemeToggleComponent {
  isDarkTheme = false;

  constructor(private readonly themeService: ThemeService) {
    this.themeService.currentTheme$.pipe(untilDestroyed(this)).subscribe((theme) => {
      this.isDarkTheme = theme === Theme.DARK;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
