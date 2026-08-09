export interface ISurveyAnswerSubmitRequest {
  questionId: number;
  optionId?: number | null;
  answerText?: string | null;
}

export interface ISurveySubmissionRequest {
  employeeId: number;
  answers: ISurveyAnswerSubmitRequest[];
}

export interface ISurveyAnswerResponse {
  answerId: number;
  responseId: number;
  questionId: number;
  optionId: number | null;
  answerText: string | null;
}

export interface ISurveySubmissionResponse {
  responseId: number;
  surveyId: number;
  employeeId: number;
  submittedAt: string;
  completionStatus: string;
  answers: ISurveyAnswerResponse[];
}
