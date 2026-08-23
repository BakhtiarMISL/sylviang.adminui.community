import { SurveyQuestionType } from '@core/interfaces/community/survey.interface';

/**
 * SurveyType is an unenforced free-text field on the backend (no enum/whitelist) - this list
 * is the frontend's self-imposed contract, used both as the builder's Type dropdown options and
 * as the surveys list page's "All types" filter options (so the filter always shows every
 * possible type, not just ones currently in use). Existing surveys already persist the short
 * forms (Pulse/Engagement/Feedback/Onboarding/Exit) - keep those values stable rather than
 * renaming them, since a rename would make older surveys' Type field stop matching any option.
 */
export const SURVEY_TYPE_OPTIONS = [
  'Pulse',
  'Engagement',
  'Feedback',
  'Onboarding',
  'Exit',
  'eNPS',
  'Manager Effectiveness',
  'DEI',
  'Training/L&D Feedback',
];

/** Options for the survey builder's per-question "Question Type" dropdown. */
export const QUESTION_TYPE_OPTIONS: { label: string; value: SurveyQuestionType }[] = [
  { label: 'Single Choice', value: 'SingleChoice' },
  { label: 'Multiple Choice', value: 'MultipleChoice' },
  { label: 'Text', value: 'Text' },
  { label: 'Rating', value: 'Rating' },
];

/** The 1-5 star scale used by Rating-type questions, both when taking and when displaying results. */
export const RATING_SCALE = [1, 2, 3, 4, 5];
