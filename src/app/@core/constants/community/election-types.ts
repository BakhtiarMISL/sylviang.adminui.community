import { ElectionAudienceScope, ElectionCandidateType, ElectionVotingType } from '@core/interfaces/community/election.interface';

export const ELECTION_VOTING_TYPE_OPTIONS: { label: string; value: ElectionVotingType }[] = [
  { label: 'Single Choice', value: 'SingleChoice' },
  { label: 'Multiple Choice', value: 'MultipleChoice' },
];

export const ELECTION_CANDIDATE_TYPE_OPTIONS: { label: string; value: ElectionCandidateType }[] = [
  { label: 'Employee', value: 'Employee' },
  { label: 'Team', value: 'Team' },
];

export const ELECTION_AUDIENCE_SCOPE_OPTIONS: { label: string; value: ElectionAudienceScope }[] = [
  { label: 'Entire Organization', value: 'Organization' },
  { label: 'Branch', value: 'Branch' },
  { label: 'Department', value: 'Department' },
  { label: 'Team', value: 'Team' },
  { label: 'Selected Employees', value: 'SelectedEmployees' },
];

/** Scopes bulk candidate nomination supports - no "Selected Employees" since the individual search+nominate form already covers that case. */
export const ELECTION_BULK_NOMINATE_SCOPE_OPTIONS: { label: string; value: ElectionAudienceScope }[] = [
  { label: 'Entire Organization', value: 'Organization' },
  { label: 'Branch', value: 'Branch' },
  { label: 'Department', value: 'Department' },
  { label: 'Team', value: 'Team' },
];
