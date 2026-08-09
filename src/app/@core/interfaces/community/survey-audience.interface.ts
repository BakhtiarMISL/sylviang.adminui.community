/** Kept in sync with the backend's SurveyAudienceTypes whitelist (Application/Features/Surveys/SurveyAudienceTypes.cs). */
export type SurveyAudienceType = 'EntireCompany' | 'Department' | 'Branch';

export interface ISurveyAudienceCreateRequest {
  audienceType: SurveyAudienceType;
  departmentId?: number | null;
  branchId?: number | null;
}

export interface ISurveyAudienceResponse {
  audienceId: number;
  surveyId: number;
  audienceType: SurveyAudienceType | string;
  departmentId: number | null;
  branchId: number | null;
}
