import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IElectionEligibleResponse, IElectionResponse } from '@core/interfaces/community/election.interface';
import { ElectionService } from '@core/services/community/election.service';
import { ToastService } from '@core/services/misc/toast.service';
import { TimeTickerService } from '@core/services/misc/time-ticker.service';

/**
 * Renders either an admin-mode card (IElectionResponse, from GET .../paged - edit/publish/
 * close/delete/candidates/results actions) or an eligible-mode card (IElectionEligibleResponse,
 * from GET .../eligible - a Vote action or a "Voted" badge), selected via `mode`. Kept as one
 * component rather than two since most of the display (title/description/badges) is shared.
 */
@Component({
  selector: 'app-election-card',
  standalone: false,
  templateUrl: './election-card.component.html',
  styleUrl: './election-card.component.scss',
})
export class ElectionCardComponent {
  @Input({ required: true }) election!: IElectionResponse | IElectionEligibleResponse;
  @Input() mode: 'admin' | 'eligible' = 'admin';
  @Output() changed = new EventEmitter<void>();

  submitting = false;

  constructor(
    private electionService: ElectionService,
    private toastService: ToastService,
    public timeTicker: TimeTickerService,
  ) {}

  get asAdmin(): IElectionResponse {
    return this.election as IElectionResponse;
  }

  get asEligible(): IElectionEligibleResponse {
    return this.election as IElectionEligibleResponse;
  }

  publish(): void {
    if (this.submitting) return;
    this.submitting = true;
    this.electionService.publish(this.asAdmin.electionId).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Election published - eligible voters have been notified.' });
          this.changed.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not publish this election.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not publish this election.' });
      },
    });
  }

  close(): void {
    if (this.submitting) return;
    if (!window.confirm(`Close "${this.asAdmin.title}"? It will no longer accept votes.`)) return;

    this.submitting = true;
    this.electionService.close(this.asAdmin.electionId).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Election closed.' });
          this.changed.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not close this election.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not close this election.' });
      },
    });
  }

  deleteElection(): void {
    if (this.submitting) return;
    if (!window.confirm(`Permanently delete "${this.asAdmin.title}"? This cannot be undone.`)) return;

    this.submitting = true;
    this.electionService.delete(this.asAdmin.electionId).subscribe({
      next: (response) => {
        this.submitting = false;
        if (!response.hasError) {
          this.toastService.success({ detail: 'Election deleted.' });
          this.changed.emit();
        } else {
          this.toastService.error({ detail: response.decentMessage || 'Could not delete this election.' });
        }
      },
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not delete this election.' });
      },
    });
  }
}
