import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

/* The ThemeService class provides methods to set light and dark theme colors by updating
CSS variables in the document root element. */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private readonly _currentThemeSubject = new BehaviorSubject<Theme>(
    Theme.LIGHT,
  );

  public readonly currentTheme$ = this._currentThemeSubject.asObservable();
  private readonly _lightThemeColors: { [key: string]: string } = {
    // Primary theme colors
    '--orange': '#E9380B',
    '--yellow': '#FBC52D',
    '--dark-charcoal': '#333843',
    '--deep-gray': '#393B3D',
    '--slate-gray': '#667085',
    '--surface-1': '#F5F5F5',
    '--text-color-light': '#ffffff',
    '--text-color-medium': '#667085',
    '--text-color-dark': '#333843',
    // Grayscale
    '--white': '#fff',
    '--gray-100': '#f8f9fa',
    '--gray-200': '#e9ecef',
    '--gray-300': '#dee2e6',
    '--gray-400': '#ced4da',
    '--gray-500': '#adb5bd',
    '--gray-600': '#868e96',
    '--gray-700': '#495057',
    '--gray-800': '#343a40',
    '--gray-900': '#212529',
    '--black': '#000',

    // Login page specific colors
    '--primary-50': '#f0f9ff',
    '--primary-500': '#0ea5e9',
    '--primary-600': '#0284c7',
    '--primary-700': '#0369a1',
    '--secondary-50': '#faf5ff',
    '--error-50': '#fef2f2',
    '--error-500': '#ef4444',
    '--error-600': '#dc2626',
    '--success-500': '#22c55e',
    '--warning-500': '#f59e0b',

    // Surface colors
    '--surface-elevated': '#ffffff',
    '--surface-secondary': '#f8f9fa',

    // Text colors
    '--text-primary': '#171717',
    '--text-secondary': '#404040',
    '--text-tertiary': '#737373',

    // Border colors
    '--border-primary': '#e5e5e5',
    '--border-secondary': '#d4d4d4',

    // Gradients
    '--gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '--gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '--gradient-success': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '--gradient-glass':
      'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',

    // Shadows
    '--shadow-lg':
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '--shadow-colored':
      '0 20px 25px -5px rgba(102, 126, 234, 0.1), 0 8px 10px -6px rgba(102, 126, 234, 0.1)',

    // Spacing (assuming 1rem = 16px)
    '--space-1': '0.25rem',
    '--space-2': '0.5rem',
    '--space-3': '0.75rem',
    '--space-4': '1rem',
    '--space-6': '1.5rem',
    '--space-8': '2rem',
    '--space-10': '2.5rem',
  };

  private readonly _darkThemeColors: { [key: string]: string } = {
    // Adjusted primary theme colors for dark theme
    '--orange': '#D15F41',
    '--yellow': '#C2A44D',
    '--dark-charcoal': '#2B2F33',
    '--deep-gray': '#2F3134',
    '--slate-gray': '#4A5059',
    '--surface-1': '#202124',
    '--text-color-light': '#212529',
    '--text-color-medium': '#ced4da',
    '--text-color-dark': '#f8f9fa',
    // Inverted Grayscale for Dark Theme
    '--white': '#1f2937',
    '--gray-100': '#374151',
    '--gray-200': '#4b5563',
    '--gray-300': '#6b7280',
    '--gray-400': '#9ca3af',
    '--gray-500': '#d1d5db',
    '--gray-600': '#e5e7eb',
    '--gray-700': '#f3f4f6',
    '--gray-800': '#f9fafb',
    '--gray-900': '#ffffff',
    '--black': '#f8f9fa',

    // Login page specific colors for dark theme
    '--primary-50': '#1e293b',
    '--primary-500': '#38bdf8',
    '--primary-600': '#0ea5e9',
    '--primary-700': '#0284c7',
    '--secondary-50': '#1e1b4b',
    '--error-50': '#7f1d1d',
    '--error-500': '#f87171',
    '--error-600': '#ef4444',
    '--success-500': '#4ade80',
    '--warning-500': '#fbbf24',

    // Surface colors for dark theme
    '--surface-elevated': '#374151',
    '--surface-secondary': '#2d3748',

    // Text colors for dark theme
    '--text-primary': '#f9fafb',
    '--text-secondary': '#d1d5db',
    '--text-tertiary': '#9ca3af',

    // Border colors for dark theme
    '--border-primary': '#4b5563',
    '--border-secondary': '#6b7280',

    // Gradients for dark theme
    '--gradient-primary': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    '--gradient-secondary': 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
    '--gradient-success': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    '--gradient-glass':
      'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',

    // Shadows for dark theme (lighter for visibility on dark backgrounds)
    '--shadow-lg':
      '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
    '--shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    '--shadow-colored':
      '0 20px 25px -5px rgba(79, 70, 229, 0.3), 0 8px 10px -6px rgba(79, 70, 229, 0.3)',

    // Spacing (same for both themes)
    '--space-1': '0.25rem',
    '--space-2': '0.5rem',
    '--space-3': '0.75rem',
    '--space-4': '1rem',
    '--space-6': '1.5rem',
    '--space-8': '2rem',
    '--space-10': '2.5rem',
  };

  constructor() {
    // Initialize with saved theme or default to light
    this.initializeTheme();
  }

  get currentTheme(): Theme {
    return this._currentThemeSubject.value;
  }

  get isDarkTheme(): boolean {
    return this.currentTheme === Theme.DARK;
  }

  private initializeTheme(): void {
    const savedTheme = this.getSavedTheme();
    this._currentThemeSubject.next(savedTheme);
    this.applyTheme(savedTheme);
  }

  private getSavedTheme(): Theme {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    return savedTheme || Theme.LIGHT;
  }

  private saveTheme(theme: Theme): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }

  toggleTheme(): void {
    const newTheme =
      this.currentTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    this.setTheme(newTheme);
  }

  setTheme(theme: Theme): void {
    this.applyTheme(theme);
    this.saveTheme(theme);
    this._currentThemeSubject.next(theme);
  }

  private applyTheme(theme: Theme): void {
    if (theme === Theme.DARK) {
      this._setTheme(this._darkThemeColors, theme);
    } else {
      this._setTheme(this._lightThemeColors, theme);
    }
  }

  private _setTheme(colors: Record<string, string>, theme: Theme): void {
    const root = document.documentElement;

    Object.keys(colors).forEach((key) => {
      root.style.setProperty(key, colors[key]);
    });

    if (theme === Theme.DARK) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
