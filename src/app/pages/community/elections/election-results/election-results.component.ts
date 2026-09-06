import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IElectionCandidateTally,
  IElectionResponse,
  IElectionResultsResponse,
  IElectionVoterDetail,
} from '@core/interfaces/community/election.interface';
import { ElectionService } from '@core/services/community/election.service';
import { EmployeeLookupService } from '@core/services/community/employee-lookup.service';
import { TeamService } from '@core/services/community/team.service';

/**
 * US-9.12: HR/Admin-only results view. Aggregated per-candidate totals are always shown; the
 * per-voter table only renders when the election isn't anonymous - ElectionResultsResponse.voterDetails
 * is null for anonymous elections (the backend never computes it in that case), so there's
 * nothing to leak even if this view were somehow reached for one. The per-nominee voter
 * drill-down dialog reuses that same null/anonymous guard.
 */
@Component({
  selector: 'app-election-results',
  standalone: false,
  templateUrl: './election-results.component.html',
  styleUrl: './election-results.component.scss',
})
export class ElectionResultsComponent implements OnInit {
  electionId!: number;
  election: IElectionResponse | null = null;
  results: IElectionResultsResponse | null = null;
  candidateNames = new Map<number, string>();
  voterNames = new Map<number, string>();
  loading = true;
  loadError = false;

  /** Table-friendly view of candidateTallies - PrimeNG sort/filter need real field values, not template function calls. */
  resultsView: (IElectionCandidateTally & { candidateName: string; percentage: number })[] = [];

  selectedTally: IElectionCandidateTally | null = null;
  showVoterDialog = false;

  constructor(
    private route: ActivatedRoute,
    private electionService: ElectionService,
    private employeeLookupService: EmployeeLookupService,
    private teamService: TeamService,
  ) {}

  percentage(tally: IElectionCandidateTally): number {
    if (!this.results || this.results.totalVotes === 0) return 0;
    return (tally.voteCount / this.results.totalVotes) * 100;
  }

  candidateName(candidateId: number): string {
    return this.candidateNames.get(candidateId) ?? `Candidate #${candidateId}`;
  }

  voterName(voterId: number): string {
    return this.voterNames.get(voterId) ?? `Employee #${voterId}`;
  }

  /** Voter drill-down is only ever offered when per-voter detail actually exists (non-anonymous elections). */
  get canDrilldown(): boolean {
    return !!this.results && !this.results.isAnonymous && !!this.results.voterDetails;
  }

  get votersForSelected(): IElectionVoterDetail[] {
    if (!this.selectedTally || !this.results?.voterDetails) return [];
    return this.results.voterDetails.filter((v) => v.candidateIds.includes(this.selectedTally!.electionCandidateId));
  }

  openVoterDrilldown(tally: IElectionCandidateTally): void {
    if (!this.canDrilldown) return;
    this.selectedTally = tally;
    this.showVoterDialog = true;
  }

  ngOnInit(): void {
    this.electionId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  private buildResultsView(): void {
    if (!this.results) {
      this.resultsView = [];
      return;
    }
    this.resultsView = this.results.candidateTallies.map((tally) => ({
      ...tally,
      candidateName: this.candidateName(tally.electionCandidateId),
      percentage: this.percentage(tally),
    }));
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

    this.electionService.getCandidates(this.electionId).subscribe((response) => {
      const candidates = !response.hasError && response.content ? response.content : [];
      for (const candidate of candidates) {
        if (candidate.employeeId !== null) {
          this.employeeLookupService.getById(candidate.employeeId).subscribe((employee) => {
            this.candidateNames.set(candidate.electionCandidateId, employee?.employeeName ?? `Employee #${candidate.employeeId}`);
            this.buildResultsView();
          });
        } else if (candidate.teamId !== null) {
          this.teamService.getById(candidate.teamId).subscribe((teamResponse) => {
            const name = !teamResponse.hasError && teamResponse.content ? teamResponse.content.name : `Team #${candidate.teamId}`;
            this.candidateNames.set(candidate.electionCandidateId, name);
            this.buildResultsView();
          });
        }
      }
    });

    this.electionService.getResults(this.electionId).subscribe({
      next: (response) => {
        this.results = !response.hasError && response.content ? response.content : null;
        if (!this.results) this.loadError = true;
        this.loading = false;
        this.buildResultsView();
        this.resolveVoterNames();
      },
      error: () => {
        this.results = null;
        this.loadError = true;
        this.loading = false;
      },
    });
  }

  private resolveVoterNames(): void {
    if (!this.results?.voterDetails) return;

    for (const voter of this.results.voterDetails) {
      if (this.voterNames.has(voter.voterId)) continue;
      this.employeeLookupService.getById(voter.voterId).subscribe((employee) => {
        this.voterNames.set(voter.voterId, employee?.employeeName ?? `Employee #${voter.voterId}`);
      });
    }
  }
}
