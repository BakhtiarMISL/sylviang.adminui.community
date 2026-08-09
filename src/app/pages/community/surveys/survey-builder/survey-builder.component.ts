import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';
import { SURVEY_TYPE_OPTIONS } from '@core/constants/community/survey-types';
import { SurveyQuestionType } from '@core/interfaces/community/survey.interface';
import { SurveyAudienceType } from '@core/interfaces/community/survey-audience.interface';
import { SurveyService } from '@core/services/community/survey.service';
import { SurveyQuestionService } from '@core/services/community/survey-question.service';
import { SurveyAudienceService } from '@core/services/community/survey-audience.service';
import { ToastService } from '@core/services/misc/toast.service';

interface QuestionFormItem {
  /**
   * Stable client-side identity for Angular's *ngFor trackBy - needed because cdkDrag/cdkDropList
   * physically reorder DOM nodes during the drag preview, outside Angular's own rendering; without
   * a trackBy keyed on something stable, *ngFor's post-drop reconciliation can mismatch DOM nodes
   * to array items (observed as duplicated/lost question text after a drag). questionId can't serve
   * this purpose since it's null for every question until the survey is actually saved.
   */
  clientId: number;
  /** null = not yet saved to the backend (new question added in this editing session). */
  questionId: number | null;
  questionText: string;
  questionType: SurveyQuestionType;
  isRequired: boolean;
  options: string[];
}

export const QUESTION_TYPE_OPTIONS: { label: string; value: SurveyQuestionType }[] = [
  { label: 'Single Choice', value: 'SingleChoice' },
  { label: 'Multiple Choice', value: 'MultipleChoice' },
  { label: 'Text', value: 'Text' },
  { label: 'Rating', value: 'Rating' },
];

/**
 * US-5.2/5.3/5.4: HR/Admin survey builder - question list uses plain arrays with two-way
 * ngModel binding (not Angular reactive FormArray) to stay consistent with the composer
 * pattern already used elsewhere in this codebase (see post-composer.component.ts's
 * `pollOptions: string[]`), rather than introducing a second forms paradigm for no benefit.
 *
 * Editing an existing question's OPTIONS isn't supported by the backend (SurveyQuestionUpdateRequest
 * has no Options field - only SurveyQuestionAddCommand accepts inline options at creation time).
 * So in edit mode, existing choice questions' options are shown read-only; to change them the
 * question must be deleted and re-added.
 *
 * Audience targeting (SurveyAudienceAddCommand) is add-only on the backend - once a survey has
 * an audience row, this UI shows it read-only rather than letting the user silently pile up
 * additional/contradictory rows.
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

  title = '';
  description = '';
  surveyType = '';
  isAnonymous = false;
  isMandatory = false;

  /** true = links out to an external survey (e.g. Google Forms) instead of using CES-native questions. */
  isExternal = false;
  externalUrl = '';

  questions: QuestionFormItem[] = [];
  private nextClientId = 1;
  removedQuestionIds: number[] = [];

  audienceType: SurveyAudienceType | null = null;
  departmentId: number | null = null;
  branchId: number | null = null;
  existingAudienceType: string | null = null;

  surveyTypeOptions = SURVEY_TYPE_OPTIONS;
  questionTypeOptions = QUESTION_TYPE_OPTIONS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private surveyService: SurveyService,
    private surveyQuestionService: SurveyQuestionService,
    private surveyAudienceService: SurveyAudienceService,
    private toastService: ToastService,
  ) {}

  get canSubmit(): boolean {
    if (this.submitting || !this.title.trim() || !this.surveyType) return false;
    if (this.isExternal) return !!this.externalUrl.trim();
    return this.questions.every((q) => {
      if (!q.questionText.trim()) return false;
      if (this.isChoiceType(q.questionType)) {
        return q.options.filter((o) => o.trim()).length >= 2;
      }
      return true;
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.surveyId = Number(idParam);
      this.isEditMode = true;
      this.loadExisting(this.surveyId);
    }
  }

  isChoiceType(type: SurveyQuestionType): boolean {
    return type === 'SingleChoice' || type === 'MultipleChoice';
  }

  /** Switching to external mode drops any CES-native questions (existing ones get queued for deletion via the normal syncQuestions removal path). */
  onModeChange(external: boolean): void {
    this.isExternal = external;
    if (external) {
      for (const question of this.questions) {
        if (question.questionId !== null) this.removedQuestionIds.push(question.questionId);
      }
      this.questions = [];
    }
  }

  addQuestion(): void {
    this.questions.push({
      clientId: this.nextClientId++,
      questionId: null,
      questionText: '',
      questionType: 'SingleChoice',
      isRequired: false,
      options: ['', ''],
    });
  }

  trackByQuestion(_index: number, question: QuestionFormItem): number {
    return question.clientId;
  }

  removeQuestion(index: number): void {
    const question = this.questions[index];
    if (question.questionId !== null) {
      this.removedQuestionIds.push(question.questionId);
    }
    this.questions.splice(index, 1);
  }

  onQuestionDrop(event: CdkDragDrop<QuestionFormItem[]>): void {
    moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
  }

  addOption(questionIndex: number): void {
    this.questions[questionIndex].options.push('');
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.questions[questionIndex].options;
    if (options.length <= 2) return;
    options.splice(optionIndex, 1);
  }

  async saveDraft(): Promise<void> {
    await this.submit(false);
  }

  async publishNow(): Promise<void> {
    await this.submit(true);
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
        this.title = survey.title;
        this.description = survey.description ?? '';
        this.surveyType = survey.surveyType;
        this.isAnonymous = survey.isAnonymous;
        this.isMandatory = survey.isMandatory;
        this.isExternal = !!survey.externalUrl;
        this.externalUrl = survey.externalUrl ?? '';
      }

      if (!questionsResponse.hasError && questionsResponse.content) {
        this.questions = questionsResponse.content
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((q) => ({
            clientId: this.nextClientId++,
            questionId: q.questionId,
            questionText: q.questionText,
            questionType: q.questionType as SurveyQuestionType,
            isRequired: q.isRequired,
            options: q.options.slice().sort((a, b) => a.displayOrder - b.displayOrder).map((o) => o.optionText),
          }));
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
    if (!this.canSubmit) return;
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
    const response = await firstValueFrom(
      this.surveyService.create({
        title: this.title.trim(),
        description: this.description.trim() || null,
        surveyType: this.surveyType,
        isAnonymous: this.isAnonymous,
        isMandatory: this.isMandatory,
        externalUrl: this.isExternal ? this.externalUrl.trim() : null,
      }),
    );
    if (response.hasError || !response.content) throw new Error(response.decentMessage || 'Create failed');
    return response.content;
  }

  private async updateSurvey(surveyId: number): Promise<number> {
    const response = await firstValueFrom(
      this.surveyService.update(surveyId, {
        title: this.title.trim(),
        description: this.description.trim() || null,
        surveyType: this.surveyType,
        isAnonymous: this.isAnonymous,
        isMandatory: this.isMandatory,
        // '' (not null) when switching back to native mode - the backend treats an empty string as an
        // explicit "clear ExternalUrl" signal (null there means "leave unchanged", same as Description).
        externalUrl: this.isExternal ? this.externalUrl.trim() : '',
      }),
    );
    if (response.hasError) throw new Error(response.decentMessage || 'Update failed');
    return surveyId;
  }

  private async syncQuestions(surveyId: number): Promise<void> {
    for (const questionId of this.removedQuestionIds) {
      await firstValueFrom(this.surveyQuestionService.delete(surveyId, questionId));
    }

    for (let index = 0; index < this.questions.length; index++) {
      const question = this.questions[index];
      const trimmedOptions = question.options.map((o) => o.trim()).filter(Boolean);

      if (question.questionId === null) {
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
          this.surveyQuestionService.update(surveyId, question.questionId, {
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
