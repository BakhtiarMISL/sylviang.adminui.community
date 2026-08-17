import { Pipe, PipeTransform } from '@angular/core';

/**
 * Renders a timestamp as a short "time ago" string (e.g. "5m ago", "3d ago"). Pure pipe:
 * pass the current time (e.g. from TimeTickerService's now$ via the async pipe) as the
 * second argument so this recomputes as time passes instead of freezing at first render.
 *
 * Standalone so eagerly-loaded modules (e.g. ShellModule, for the notification bell) can
 * import just this pipe directly instead of pulling in all of SharedModule's PrimeNG
 * modules, which would bloat the initial bundle since ShellModule isn't lazy-loaded.
 */
@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, now: number | null): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    const diffSeconds = Math.round(((now ?? Date.now()) - date.getTime()) / 1000);

    if (diffSeconds < 5) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    if (diffDays < 30) return `${Math.round(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)}mo ago`;

    return `${Math.round(diffDays / 365)}y ago`;
  }
}
