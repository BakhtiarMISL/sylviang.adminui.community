import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ELECTION_CANDIDATE_TYPE_OPTIONS, ELECTION_VOTING_TYPE_OPTIONS } from '@core/constants/community/election-types';
import { ElectionAudienceScope, ElectionVotingType } from '@core/interfaces/community/election.interface';
import { ElectionService } from '@core/services/community/election.service';
import { ToastService } from '@core/services/misc/toast.service';

/**
 * US-9.1/9.2/9.3/9.4: HR/Admin election builder (create + edit). Publishing is deliberately
 * NOT an action here - a freshly-created election has no candidates yet (they're nominated via
 * a separate step on the Candidates page, which needs a real electionId to attach to), so
 * Publish lives on the elections list/card instead, once candidates have been added and
 * approved. This mirrors the real dependency order: scope+rules -> candidates -> publish.
 *
 * Audience targeting (ElectionAudienceTargetAddCommand) is add-only on the backend, so once the
 * election already has at least one target, the picker is shown read-only - same tradeoff as
 * survey-audience-targeting.component.ts.
 */
@Component({
  selector: 'app-election-builder',
  standalone: false,
  templateUrl: './election-builder.component.html',
  styleUrl: './election-builder.component.scss',
})
export class ElectionBuilderComponent implements OnInit {
  electionId: number | null = null;
  isEditMode = false;
  loading = false;
  submitting = false;
  formSubmitted = false;

  electionForm!: FormGroup;

  audienceScope: ElectionAudienceScope | null = null;
  targetIds: string[] = [];
  hasExistingAudience = false;

  votingTypeOptions = ELECTION_VOTING_TYPE_OPTIONS;
  candidateTypeOptions = ELECTION_CANDIDATE_TYPE_OPTIONS;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private electionService: ElectionService,
    private toastService: ToastService,
  ) {}

  get f() {
    return this.electionForm.controls;
  }

  get isMultipleChoice(): boolean {
    return this.electionForm.get('electionType')!.value === 'MultipleChoice';
  }

  get canSubmit(): boolean {
    return !this.submitting && this.electionForm.valid;
  }

  ngOnInit(): void {
    this.initForm();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.electionId = Number(idParam);
      this.isEditMode = true;
      this.loadExisting(this.electionId);
    }
  }

  hasError(fieldName: string): boolean {
    const field = this.electionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  getErrorMessage(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      title: 'Title',
      electionType: 'Voting type',
      candidateType: 'Candidate type',
      startDate: 'Start date',
      minSelection: 'Minimum selectable',
      maxSelection: 'Maximum selectable',
    };
    const displayName = displayNames[fieldName] || fieldName;
    const field = this.electionForm.get(fieldName);
    if (field?.errors?.['required']) return `${displayName} is required`;
    if (field?.errors?.['min']) return `${displayName} must be at least ${field.errors['min'].min}`;
    return '';
  }

  onVotingTypeChange(type: ElectionVotingType): void {
    this.electionForm.get('electionType')!.setValue(type);
    if (type === 'SingleChoice') {
      this.electionForm.patchValue({ minSelection: 1, maxSelection: 1 });
    }
  }

  async save(): Promise<void> {
    this.formSubmitted = true;
    if (!this.canSubmit) {
      this.electionForm.markAllAsTouched();
      return;
    }
    this.submitting = true;

    try {
      const electionId = this.isEditMode && this.electionId !== null ? await this.updateElection(this.electionId) : await this.createElection();

      if (this.audienceScope && !this.hasExistingAudience && this.audienceScope !== 'Organization') {
        for (const targetId of this.targetIds) {
          await firstValueFrom(this.electionService.addAudience(electionId, { targetId }));
        }
      } else if (this.audienceScope === 'Organization' && !this.hasExistingAudience) {
        await this.updateElection(electionId, { audienceScope: 'Organization' });
      }

      this.toastService.success({ detail: this.isEditMode ? 'Election updated.' : 'Election created as a draft.' });

      if (this.isEditMode) {
        this.router.navigate(['/community/elections']);
      } else {
        this.router.navigate(['/community/elections', electionId, 'candidates']);
      }
    } catch {
      this.toastService.error({ detail: 'Could not save the election. Please try again.' });
    } finally {
      this.submitting = false;
    }
  }

  private initForm(): void {
    this.electionForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      electionType: ['SingleChoice', [Validators.required]],
      candidateType: ['Employee', [Validators.required]],
      isAnonymous: [false],
      minSelection: [1, [Validators.required, Validators.min(1)]],
      maxSelection: [1, [Validators.required, Validators.min(1)]],
      startDate: [new Date(), [Validators.required]],
      endDate: [null],
    });
  }

  private async loadExisting(electionId: number): Promise<void> {
    this.loading = true;
    try {
      const [electionResponse, audienceResponse] = await Promise.all([
        firstValueFrom(this.electionService.getById(electionId)),
        firstValueFrom(this.electionService.getAudience(electionId)),
      ]);

      if (!electionResponse.hasError && electionResponse.content) {
        const election = electionResponse.content;
        this.electionForm.patchValue({
          title: election.title,
          description: election.description ?? '',
          electionType: election.electionType,
          candidateType: election.candidateType,
          isAnonymous: election.isAnonymous,
          minSelection: election.minSelection,
          maxSelection: election.maxSelection,
          startDate: new Date(election.startDate),
          endDate: election.endDate ? new Date(election.endDate) : null,
        });
        this.audienceScope = election.audienceScope as ElectionAudienceScope;
      }

      if (!audienceResponse.hasError && audienceResponse.content && audienceResponse.content.length > 0) {
        this.hasExistingAudience = true;
        this.targetIds = audienceResponse.content.map((t) => t.targetId);
      }
    } catch {
      this.toastService.error({ detail: 'Could not load election for editing.' });
    } finally {
      this.loading = false;
    }
  }

  private async createElection(): Promise<number> {
    const value = this.electionForm.getRawValue();
    const response = await firstValueFrom(
      this.electionService.create({
        title: (value.title as string).trim(),
        description: (value.description as string).trim() || null,
        electionType: value.electionType,
        candidateType: value.candidateType,
        audienceScope: this.audienceScope ?? 'Organization',
        isAnonymous: value.isAnonymous,
        allowMultipleChoice: value.electionType === 'MultipleChoice',
        minSelection: value.minSelection,
        maxSelection: value.maxSelection,
        startDate: (value.startDate as Date).toISOString(),
        endDate: value.endDate ? (value.endDate as Date).toISOString() : null,
      }),
    );
    if (response.hasError || !response.content) throw new Error(response.decentMessage || 'Create failed');
    return response.content;
  }

  private async updateElection(electionId: number, overrides: { audienceScope?: string } = {}): Promise<number> {
    const value = this.electionForm.getRawValue();
    const response = await firstValueFrom(
      this.electionService.update(electionId, {
        title: (value.title as string).trim(),
        description: (value.description as string).trim() || null,
        electionType: value.electionType,
        candidateType: value.candidateType,
        audienceScope: overrides.audienceScope ?? this.audienceScope ?? undefined,
        isAnonymous: value.isAnonymous,
        allowMultipleChoice: value.electionType === 'MultipleChoice',
        minSelection: value.minSelection,
        maxSelection: value.maxSelection,
        startDate: (value.startDate as Date).toISOString(),
        endDate: value.endDate ? (value.endDate as Date).toISOString() : null,
      }),
    );
    if (response.hasError) throw new Error(response.decentMessage || 'Update failed');
    return electionId;
  }
}
