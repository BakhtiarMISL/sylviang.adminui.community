import { Injectable } from '@angular/core';
import { map, shareReplay, timer } from 'rxjs';

/**
 * Shared "current time" tick for RelativeTimePipe bindings, consumed via the async pipe
 * (e.g. `| relativeTime : (timeTicker.now$ | async)`). shareReplay + refCount means every
 * subscriber shares one 30s interval, and it stops entirely when nothing is subscribed.
 */
@Injectable({
  providedIn: 'root',
})
export class TimeTickerService {
  readonly now$ = timer(0, 30000).pipe(
    map(() => Date.now()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
