export interface ISurveyAnswerSubmitRequest {
  questionId: number;
  optionId?: number | null;
  answerText?: string | null;
  ratingValue?: number | null;
}

export interface ISurveySubmissionRequest {
  answers: ISurveyAnswerSubmitRequest[];
}

export interface ISurveyAnswerResponse {
  answerId: number;
  responseId: number;
  questionId: number;
  optionId: number | null;
  answerText: string | null;
  ratingValue: number | null;
}

export interface ISurveySubmissionResponse {
  responseId: number;
  surveyId: number;
  /** Null when the parent survey is anonymous - the backend never exposes identity for those. */
  employeeId: number | null;
  /** Resolved server-side from the employee record - null when anonymous, or if the employee can't be found. */
  employeeName: string | null;
  submittedAt: string;
  completionStatus: string;
  answers: ISurveyAnswerResponse[];
}
