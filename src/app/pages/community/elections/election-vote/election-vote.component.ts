import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IElectionCandidateResponse, IElectionResponse } from '@core/interfaces/community/election.interface';
import { ElectionService } from '@core/services/community/election.service';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { TeamService } from '@core/services/community/team.service';
import { CurrentUserService } from '@core/services/current-user.service';
import { ToastService } from '@core/services/misc/toast.service';

/**
 * US-9.9/9.10: cast a ballot. Every nominated candidate is ballot-eligible immediately -
 * there's no separate approval step. Eligibility, the voting window, and one-ballot-per-employee
 * are all enforced server-side; this page just surfaces whatever error message comes back
 * (ineligible, already voted, outside window, wrong selection count) rather than duplicating
 * that logic client-side.
 */
@Component({
  selector: 'app-election-vote',
  standalone: false,
  templateUrl: './election-vote.component.html',
  styleUrl: './election-vote.component.scss',
})
export class ElectionVoteComponent implements OnInit {
  electionId!: number;
  election: IElectionResponse | null = null;
  candidates: IElectionCandidateResponse[] = [];
  candidateNames = new Map<number, string>();
  loading = true;
  loadError = false;
  submitting = false;

  selectedCandidateId: number | null = null;
  selectedCandidateIds = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private electionService: ElectionService,
    private employeeLookupService: EmployeeLookupService,
    private teamService: TeamService,
    private currentUserService: CurrentUserService,
    private toastService: ToastService,
  ) {}

  get currentEmployeeId(): number | null {
    return this.currentUserService.currentUser.employeeId;
  }

  /**
   * A notification link (or a stale tab) can point at an election that's no longer votable -
   * the ballot itself was already protected server-side (CastVoteAsync's window/status check),
   * but nothing stopped the candidate list/manifestos from still rendering client-side. Mirrors
   * the server's own Votable-status + EndDate check so this shows the same verdict without
   * waiting for a failed submit attempt.
   */
  get isExpired(): boolean {
    if (!this.election) return false;
    if (this.election.status !== 'Open' && this.election.status !== 'Active') return true;
    return !!this.election.endDate && new Date(this.election.endDate).getTime() <= Date.now();
  }

  get isNotYetOpen(): boolean {
    return !!this.election && !this.isExpired && new Date(this.election.startDate).getTime() > Date.now();
  }

  get isVotable(): boolean {
    return !this.isExpired && !this.isNotYetOpen;
  }

  get selectedCount(): number {
    return this.election?.allowMultipleChoice ? this.selectedCandidateIds.size : this.selectedCandidateId !== null ? 1 : 0;
  }

  get canSubmit(): boolean {
    if (this.submitting || !this.election) return false;
    return this.selectedCount >= this.election.minSelection && this.selectedCount <= this.election.maxSelection;
  }

  ngOnInit(): void {
    this.electionId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  displayName(candidate: IElectionCandidateResponse): string {
    return this.candidateNames.get(candidate.electionCandidateId) ?? 'Loading...';
  }

  isSelected(candidateId: number): boolean {
    return this.election?.allowMultipleChoice ? this.selectedCandidateIds.has(candidateId) : this.selectedCandidateId === candidateId;
  }

  /** Disables not-yet-checked checkboxes once maxSelection is reached, so the cap is enforced up front instead of just silently disabling Submit. */
  isSelectionCapped(candidateId: number): boolean {
    return !!this.election && !this.isSelected(candidateId) && this.selectedCandidateIds.size >= this.election.maxSelection;
  }

  toggleSelection(candidateId: number, checked: boolean): void {
    if (checked) {
      if (this.election && this.selectedCandidateIds.size >= this.election.maxSelection) {
        this.toastService.info({ detail: `You can select up to ${this.election.maxSelection} candidate(s).` });
        return;
      }
      this.selectedCandidateIds.add(candidateId);
    } else {
      this.selectedCandidateIds.delete(candidateId);
    }
  }

  submit(): void {
    if (!this.canSubmit) return;

    const candidateIds = this.election?.allowMultipleChoice
      ? Array.from(this.selectedCandidateIds)
      : this.selectedCandidateId !== null
        ? [this.selectedCandidateId]
        : [];

    this.submitting = true;
    this.electionService.castVote(this.electionId, { candidateIds }).subscribe({
      next: (response) => this.handleVoteResponse(response),
      error: () => {
        this.submitting = false;
        this.toastService.error({ detail: 'Could not submit your vote. Please try again.' });
      },
    });
  }

  private handleVoteResponse(response: ApiResponse<number[]>): void {
    this.submitting = false;
    if (!response.hasError) {
      this.toastService.success({ detail: 'Your vote has been recorded.' });
      this.router.navigate(['/community/elections']);
    } else {
      this.toastService.error({ detail: response.decentMessage || 'Could not submit your vote.' });
    }
  }

  private load(): void {
    this.loading = true;
    this.loadError = false;

    this.electionService.getById(this.electionId).subscribe({
      next: (response) => {
        this.election = !response.hasError && response.content ? response.content : null;
        if (!this.election) this.loadError = true;
      },
      error: () => {
        this.election = null;
        this.loadError = true;
      },
    });

    this.electionService.getCandidates(this.electionId).subscribe({
      next: (response) => {
        this.candidates = !response.hasError && response.content ? response.content : [];
        this.loading = false;
        this.resolveCandidateNames();
      },
      error: () => {
        this.candidates = [];
        this.loadError = true;
        this.loading = false;
      },
    });
  }

  private resolveCandidateNames(): void {
    for (const candidate of this.candidates) {
      if (this.candidateNames.has(candidate.electionCandidateId)) continue;

      if (candidate.employeeId !== null) {
        this.employeeLookupService.getById(candidate.employeeId).subscribe((employee) => {
          this.candidateNames.set(candidate.electionCandidateId, employee?.employeeName ?? `Employee #${candidate.employeeId}`);
        });
      } else if (candidate.teamId !== null) {
        this.teamService.getById(candidate.teamId).subscribe((response) => {
          const name = !response.hasError && response.content ? response.content.name : `Team #${candidate.teamId}`;
          this.candidateNames.set(candidate.electionCandidateId, name);
        });
      }
    }
  }
}
