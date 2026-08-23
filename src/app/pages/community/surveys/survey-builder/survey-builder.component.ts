import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { QUESTION_TYPE_OPTIONS, SURVEY_TYPE_OPTIONS } from '@core/constants/community/survey-types';
import { SurveyQuestionType } from '@core/interfaces/community/survey.interface';
import { SurveyAudienceType } from '@core/interfaces/community/survey-audience.interface';
import { SurveyService } from '@core/services/community/survey.service';
import { SurveyQuestionService } from '@core/services/community/survey-question.service';
import { SurveyAudienceService } from '@core/services/community/survey-audience.service';
import { ToastService } from '@core/services/misc/toast.service';

/**
 * Per-question bookkeeping that isn't part of the reactive form itself:
 * - clientId: stable client-side identity for Angular's *ngFor trackBy - needed because
 *   cdkDrag/cdkDropList physically reorder DOM nodes during the drag preview, outside Angular's
 *   own rendering; without a trackBy keyed on something stable, *ngFor's post-drop reconciliation
 *   can mismatch DOM nodes to array items. questionId can't serve this purpose since it's null
 *   for every question until the survey is actually saved.
 * - questionId: null = not yet saved to the backend (new question added in this editing session).
 * Kept as a parallel array indexed 1:1 with questionsArray.controls, rather than folding into the
 * FormGroup itself, since neither value is user-editable form state.
 */
interface QuestionMeta {
  clientId: number;
  questionId: number | null;
}

function choiceOptionsValidator(group: AbstractControl): ValidationErrors | null {
  const type = group.get('questionType')?.value as SurveyQuestionType;
  const options = group.get('options') as FormArray;
  if (type === 'SingleChoice' || type === 'MultipleChoice') {
    const nonEmptyCount = options.controls.filter((c) => (c.value || '').trim().length > 0).length;
    if (nonEmptyCount < 2) return { minOptions: true };
  }
  return null;
}

/**
 * US-5.2/5.3/5.4: HR/Admin survey builder. Uses Angular reactive forms (FormGroup + FormArray)
 * for the survey details and question list, matching the validation/error-display pattern used
 * by manage-employee.component.ts (hasError()/getErrorMessage(), p-floatlabel, required-field
 * markers) rather than the plain-ngModel pattern this component used previously - see the survey
 * UI audit's C2 finding for why (no inline validation feedback, no required-field markers).
 *
 * Editing an existing question's OPTIONS isn't supported by the backend (SurveyQuestionUpdateRequest
 * has no Options field - only SurveyQuestionAddCommand accepts inline options at creation time).
 * So in edit mode, existing choice questions' option controls are disabled (shown read-only); to
 * change them the question must be deleted and re-added.
 *
 * Audience targeting (SurveyAudienceAddCommand) is add-only on the backend - once a survey has
 * an audience row, this UI shows it read-only rather than letting the user silently pile up
 * additional/contradictory rows. It's driven by its own component (app-survey-audience-targeting)
 * via plain two-way bindings, not folded into this reactive form.
 */
@Component({
  selector: 'app-survey-builder',
  standalone: false,
  templateUrl: './survey-builder.component.html',
  styleUrl: './survey-builder.component.scss',
})
export class SurveyBuilderComponent implements OnInit {
  surveyId: number | null = null;
  isEditMode = false;
  loading = false;
  submitting = false;
  formSubmitted = false;

  surveyForm!: FormGroup;
  private nextClientId = 1;
  questionMeta: QuestionMeta[] = [];
  removedQuestionIds: number[] = [];

  audienceType: SurveyAudienceType | null = null;
  departmentId: number | null = null;
  branchId: number | null = null;
  existingAudienceType: string | null = null;

  surveyTypeOptions = SURVEY_TYPE_OPTIONS;
  questionTypeOptions = QUESTION_TYPE_OPTIONS;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private surveyService: SurveyService,
    private surveyQuestionService: SurveyQuestionService,
    private surveyAudienceService: SurveyAudienceService,
    private toastService: ToastService,
  ) {}

  get f() {
    return this.surveyForm.controls;
  }

  get questionsArray(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  get isExternal(): boolean {
    return this.surveyForm.get('isExternal')!.value;
  }

  get canSubmit(): boolean {
    return !this.submitting && this.surveyForm.valid;
  }

  ngOnInit(): void {
    this.initForm();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.surveyId = Number(idParam);
      this.isEditMode = true;
      this.loadExisting(this.surveyId);
    }
  }

  hasError(fieldName: string): boolean {
    const field = this.surveyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.surveyForm.get(fieldName);
    const displayNames: { [key: string]: string } = {
      title: 'Title',
      surveyType: 'Type',
      externalUrl: 'External Survey Link',
    };
    const displayName = displayNames[fieldName] || fieldName;

    if (field?.errors) {
      if (field.errors['required']) return `${displayName} is required`;
    }
    return '';
  }

  questionHasError(index: number, fieldName: string): boolean {
    const field = this.questionGroupAt(index).get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.formSubmitted));
  }

  questionHasMinOptionsError(index: number): boolean {
    const group = this.questionGroupAt(index);
    return !!(group.errors?.['minOptions'] && (group.dirty || group.touched || this.formSubmitted));
  }

  isChoiceType(type: SurveyQuestionType): boolean {
    return type === 'SingleChoice' || type === 'MultipleChoice';
  }

  questionGroupAt(index: number): FormGroup {
    return this.questionsArray.at(index) as FormGroup;
  }

  optionsArrayAt(index: number): FormArray {
    return this.questionGroupAt(index).get('options') as FormArray;
  }

  /** Switching to external mode drops any CES-native questions (existing ones get queued for deletion via the normal syncQuestions removal path). */
  onModeChange(external: boolean): void {
    this.surveyForm.get('isExternal')!.setValue(external);

    const externalUrlControl = this.surveyForm.get('externalUrl')!;
    if (external) {
      externalUrlControl.setValidators([Validators.required]);
      for (const meta of this.questionMeta) {
        if (meta.questionId !== null) this.removedQuestionIds.push(meta.questionId);
      }
      this.questionsArray.clear();
      this.questionMeta = [];
    } else {
      externalUrlControl.clearValidators();
    }
    externalUrlControl.updateValueAndValidity();
  }

  addQuestion(): void {
    this.questionMeta.push({ clientId: this.nextClientId++, questionId: null });
    this.questionsArray.push(this.buildQuestionGroup());
  }

  /**
   * Tracks by the FormGroup instance itself, not an index or id derived from a parallel array -
   * this component never recreates a question's FormGroup (addQuestion/loadExisting each create
   * it once; onQuestionDrop only reorders the same references), so identity-based tracking is
   * both simpler and correct, and avoids indexing into questionMeta out of step with
   * questionsArray.controls during Angular's diff.
   */
  trackByQuestionGroup(_index: number, group: AbstractControl): AbstractControl {
    return group;
  }

  removeQuestion(index: number): void {
    const meta = this.questionMeta[index];
    if (meta.questionId !== null) {
      this.removedQuestionIds.push(meta.questionId);
    }
    this.questionMeta.splice(index, 1);
    this.questionsArray.removeAt(index);
  }

  onQuestionDrop(event: CdkDragDrop<QuestionMeta[]>): void {
    moveItemInArray(this.questionMeta, event.previousIndex, event.currentIndex);
    moveItemInArray(this.questionsArray.controls, event.previousIndex, event.currentIndex);
    this.questionsArray.updateValueAndValidity();
  }

  addOption(questionIndex: number): void {
    this.optionsArrayAt(questionIndex).push(this.fb.control(''));
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.optionsArrayAt(questionIndex);
    if (options.length <= 2) return;
    options.removeAt(optionIndex);
  }

  async saveDraft(): Promise<void> {
    await this.submit(false);
  }

  async publishNow(): Promise<void> {
    await this.submit(true);
  }

  private initForm(): void {
    this.surveyForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      surveyType: [null, [Validators.required]],
      isAnonymous: [false],
      isMandatory: [false],
      isExternal: [false],
      externalUrl: [''],
      questions: this.fb.array([]),
    });
  }

  private buildQuestionGroup(question?: {
    questionText: string;
    questionType: SurveyQuestionType;
    isRequired: boolean;
    options: string[];
    existing: boolean;
  }): FormGroup {
    const group = this.fb.group(
      {
        questionText: [question?.questionText ?? '', [Validators.required]],
        questionType: [question?.questionType ?? 'SingleChoice', [Validators.required]],
        isRequired: [question?.isRequired ?? false],
        options: this.fb.array((question?.options ?? ['', '']).map((text) => this.fb.control(text))),
      },
      { validators: choiceOptionsValidator },
    );

    if (question?.existing) {
      (group.get('options') as FormArray).disable();
    }

    return group;
  }

  private async loadExisting(surveyId: number): Promise<void> {
    this.loading = true;
    try {
      const [surveyResponse, questionsResponse, audienceResponse] = await Promise.all([
        firstValueFrom(this.surveyService.getById(surveyId)),
        firstValueFrom(this.surveyQuestionService.getAll(surveyId)),
        firstValueFrom(this.surveyAudienceService.getAll(surveyId)),
      ]);

      if (!surveyResponse.hasError && surveyResponse.content) {
        const survey = surveyResponse.content;
        const isExternal = !!survey.externalUrl;
        this.surveyForm.patchValue({
          title: survey.title,
          description: survey.description ?? '',
          surveyType: survey.surveyType,
          isAnonymous: survey.isAnonymous,
          isMandatory: survey.isMandatory,
          isExternal,
          externalUrl: survey.externalUrl ?? '',
        });
        if (isExternal) {
          this.surveyForm.get('externalUrl')!.setValidators([Validators.required]);
          this.surveyForm.get('externalUrl')!.updateValueAndValidity();
        }
      }

      if (!questionsResponse.hasError && questionsResponse.content) {
        const questions = questionsResponse.content.slice().sort((a, b) => a.displayOrder - b.displayOrder);
        for (const q of questions) {
          this.questionMeta.push({ clientId: this.nextClientId++, questionId: q.questionId });
          this.questionsArray.push(
            this.buildQuestionGroup({
              questionText: q.questionText,
              questionType: q.questionType as SurveyQuestionType,
              isRequired: q.isRequired,
              options: q.options.slice().sort((a, b) => a.displayOrder - b.displayOrder).map((o) => o.optionText),
              existing: true,
            }),
          );
        }
      }

      if (!audienceResponse.hasError && audienceResponse.content && audienceResponse.content.length > 0) {
        const audience = audienceResponse.content[0];
        this.existingAudienceType = audience.audienceType;
        this.audienceType = audience.audienceType as SurveyAudienceType;
        this.departmentId = audience.departmentId;
        this.branchId = audience.branchId;
      }
    } catch {
      this.toastService.error({ detail: 'Could not load survey for editing.' });
    } finally {
      this.loading = false;
    }
  }

  private async submit(publish: boolean): Promise<void> {
    this.formSubmitted = true;
    if (!this.canSubmit) {
      this.surveyForm.markAllAsTouched();
      return;
    }
    this.submitting = true;

    try {
      const surveyId = this.isEditMode && this.surveyId !== null ? await this.updateSurvey(this.surveyId) : await this.createSurvey();

      await this.syncQuestions(surveyId);

      if (this.audienceType && !this.existingAudienceType) {
        await firstValueFrom(
          this.surveyAudienceService.add(surveyId, {
            audienceType: this.audienceType,
            departmentId: this.audienceType === 'Department' ? this.departmentId : null,
            branchId: this.audienceType === 'Branch' ? this.branchId : null,
          }),
        );
      }

      if (publish) {
        await firstValueFrom(this.surveyService.publish(surveyId));
        this.toastService.success({ detail: 'Survey published.' });
      } else {
        this.toastService.success({ detail: 'Survey saved as draft.' });
      }

      this.router.navigate(['/community/surveys']);
    } catch {
      this.toastService.error({ detail: 'Could not save the survey. Please try again.' });
    } finally {
      this.submitting = false;
    }
  }

  private async createSurvey(): Promise<number> {
    const value = this.surveyForm.getRawValue();
    const response = await firstValueFrom(
      this.surveyService.create({
        title: (value.title as string).trim(),
        description: (value.description as string).trim() || null,
        surveyType: value.surveyType,
        isAnonymous: value.isAnonymous,
        isMandatory: value.isMandatory,
        externalUrl: value.isExternal ? (value.externalUrl as string).trim() : null,
      }),
    );
    if (response.hasError || !response.content) throw new Error(response.decentMessage || 'Create failed');
    return response.content;
  }

  private async updateSurvey(surveyId: number): Promise<number> {
    const value = this.surveyForm.getRawValue();
    const response = await firstValueFrom(
      this.surveyService.update(surveyId, {
        title: (value.title as string).trim(),
        description: (value.description as string).trim() || null,
        surveyType: value.surveyType,
        isAnonymous: value.isAnonymous,
        isMandatory: value.isMandatory,
        // '' (not null) when switching back to native mode - the backend treats an empty string as an
        // explicit "clear ExternalUrl" signal (null there means "leave unchanged", same as Description).
        externalUrl: value.isExternal ? (value.externalUrl as string).trim() : '',
      }),
    );
    if (response.hasError) throw new Error(response.decentMessage || 'Update failed');
    return surveyId;
  }

  private async syncQuestions(surveyId: number): Promise<void> {
    for (const questionId of this.removedQuestionIds) {
      await firstValueFrom(this.surveyQuestionService.delete(surveyId, questionId));
    }

    const questionValues = this.questionsArray.getRawValue() as {
      questionText: string;
      questionType: SurveyQuestionType;
      isRequired: boolean;
      options: string[];
    }[];

    for (let index = 0; index < questionValues.length; index++) {
      const question = questionValues[index];
      const meta = this.questionMeta[index];
      const trimmedOptions = question.options.map((o) => o.trim()).filter(Boolean);

      if (meta.questionId === null) {
        await firstValueFrom(
          this.surveyQuestionService.add(surveyId, {
            questionText: question.questionText.trim(),
            questionType: question.questionType,
            displayOrder: index,
            isRequired: question.isRequired,
            options: this.isChoiceType(question.questionType)
              ? trimmedOptions.map((optionText, optionIndex) => ({ optionText, displayOrder: optionIndex }))
              : [],
          }),
        );
      } else {
        await firstValueFrom(
          this.surveyQuestionService.update(surveyId, meta.questionId, {
            questionText: question.questionText.trim(),
            questionType: question.questionType,
            displayOrder: index,
            isRequired: question.isRequired,
          }),
        );
      }
    }
  }
}
