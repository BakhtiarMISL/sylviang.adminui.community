import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

interface ToastOptions {
  detail: string;
  summary?: string;
  life?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly DEFAULT_LIFE = 2000;

  constructor(private messageService: MessageService) {}

  success(options: ToastOptions) {
    this.messageService.add({
      severity: 'success',
      summary: options.summary || 'Success!',
      detail: options.detail,
      life: options.life ?? this.DEFAULT_LIFE,
    });
  }

  error(options: ToastOptions) {
    this.messageService.add({
      severity: 'error',
      summary: options.summary || 'Something went wrong!',
      detail: options.detail,
      life: options.life ?? this.DEFAULT_LIFE,
    });
  }

  info(options: ToastOptions) {
    this.messageService.add({
      severity: 'info',
      summary: options.summary || 'Information',
      detail: options.detail,
      life: options.life ?? this.DEFAULT_LIFE,
    });
  }

  warn(options: ToastOptions) {
    this.messageService.add({
      severity: 'warn',
      summary: options.summary || 'Warning!',
      detail: options.detail,
      life: options.life ?? this.DEFAULT_LIFE,
    });
  }

  clear() {
    this.messageService.clear();
  }
}
