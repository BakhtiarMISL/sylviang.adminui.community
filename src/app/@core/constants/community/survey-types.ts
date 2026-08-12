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
