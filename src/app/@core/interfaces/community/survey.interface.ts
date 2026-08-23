/**
 * The backend stores QuestionType as a free-text string (no server-side whitelist) - this
 * union type is a frontend-only contract. The backend will accept any string, so this is a
 * self-imposed convention, not something the API enforces.
 */
export type SurveyQuestionType = 'SingleChoice' | 'MultipleChoice' | 'Text' | 'Rating';

export type SurveyStatus = 'Draft' | 'Published' | 'Closed';

export interface ISurveyResponse {
  surveyId: number;
  title: string;
  description: string | null;
  surveyType: string;
  status: SurveyStatus;
  isAnonymous: boolean;
  isMandatory: boolean;
  createdBy: number | null;
  publishedAt: string | null;
  closedAt: string | null;
  /** When set, this survey has no CES-native questions - it links out to an external survey (e.g. a Google Form) instead. */
  externalUrl: string | null;
}

export interface ISurveyCreateRequest {
  title: string;
  description?: string | null;
  surveyType: string;
  isAnonymous: boolean;
  isMandatory: boolean;
  externalUrl?: string | null;
}

export interface ISurveyUpdateRequest {
  title?: string;
  description?: string | null;
  surveyType?: string;
  isAnonymous?: boolean;
  isMandatory?: boolean;
  externalUrl?: string | null;
}

export interface ISurveyFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
}

export interface ISurveyOptionResponse {
  optionId: number;
  questionId: number;
  optionText: string;
  displayOrder: number;
}

export interface ISurveyQuestionResponse {
  questionId: number;
  surveyId: number;
  questionText: string;
  questionType: SurveyQuestionType | string;
  displayOrder: number;
  isRequired: boolean;
  options: ISurveyOptionResponse[];
}

export interface ISurveyOptionCreateRequest {
  optionText: string;
  displayOrder: number;
}

export interface ISurveyQuestionCreateRequest {
  questionText: string;
  questionType: SurveyQuestionType | string;
  displayOrder: number;
  isRequired: boolean;
  options: ISurveyOptionCreateRequest[];
}

export interface ISurveyQuestionUpdateRequest {
  questionText?: string;
  questionType?: SurveyQuestionType | string;
  displayOrder?: number;
  isRequired?: boolean;
}

export interface ISurveyOptionResultResponse {
  optionId: number;
  optionText: string;
  count: number;
  /** Percentage of respondents who answered THIS question (not the survey's total response count). */
  percentage: number;
}

export interface ISurveyRatingResultResponse {
  averageValue: number;
  /** Count of responses per distinct rating value, e.g. { 1: 0, 2: 1, 3: 4, 4: 6, 5: 2 }. */
  distribution: Record<number, number>;
}

export interface ISurveyQuestionResultResponse {
  questionId: number;
  questionText: string;
  questionType: SurveyQuestionType | string;
  options: ISurveyOptionResultResponse[];
  textAnswers: string[];
  /** Populated only for Rating-type questions. */
  rating: ISurveyRatingResultResponse | null;
}

export interface ISurveyResultsResponse {
  surveyId: number;
  totalResponses: number;
  /** Null when the survey isn't EntireCompany-scoped - no eligible-headcount source exists yet for Department/Branch scopes. */
  participationRate: number | null;
  questions: ISurveyQuestionResultResponse[];
}
