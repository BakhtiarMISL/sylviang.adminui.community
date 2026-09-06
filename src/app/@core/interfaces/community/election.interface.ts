/** Kept as plain strings on the backend (Election entity doc comment) - these unions are the frontend's self-imposed contract. */
export type ElectionVotingType = 'SingleChoice' | 'MultipleChoice';
export type ElectionCandidateType = 'Employee' | 'Team';
export type ElectionAudienceScope = 'Organization' | 'Branch' | 'Department' | 'Team' | 'SelectedEmployees';
export type ElectionStatus = 'Draft' | 'Open' | 'Closed';

export interface IElectionResponse {
  electionId: number;
  title: string;
  description: string | null;
  electionType: ElectionVotingType | string;
  candidateType: ElectionCandidateType | string;
  audienceScope: ElectionAudienceScope | string;
  isAnonymous: boolean;
  allowMultipleChoice: boolean;
  minSelection: number;
  maxSelection: number;
  startDate: string;
  endDate: string | null;
  status: ElectionStatus | string;
  createdBy: number | null;
}

/** US-9.8: an Open election the calling employee is eligible to vote in. */
export interface IElectionEligibleResponse {
  electionId: number;
  title: string;
  description: string | null;
  electionType: ElectionVotingType | string;
  candidateType: ElectionCandidateType | string;
  allowMultipleChoice: boolean;
  minSelection: number;
  maxSelection: number;
  startDate: string;
  endDate: string | null;
  hasVoted: boolean;
}

export interface IElectionCreateRequest {
  title: string;
  description?: string | null;
  electionType: ElectionVotingType | string;
  candidateType: ElectionCandidateType | string;
  audienceScope: ElectionAudienceScope | string;
  isAnonymous: boolean;
  allowMultipleChoice: boolean;
  minSelection: number;
  maxSelection: number;
  startDate: string;
  endDate?: string | null;
}

export interface IElectionUpdateRequest {
  title?: string;
  description?: string | null;
  electionType?: ElectionVotingType | string;
  candidateType?: ElectionCandidateType | string;
  audienceScope?: ElectionAudienceScope | string;
  isAnonymous?: boolean;
  allowMultipleChoice?: boolean;
  minSelection?: number;
  maxSelection?: number;
  startDate?: string;
  endDate?: string | null;
}

export interface IElectionFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
}

export interface IElectionAudienceTargetResponse {
  electionAudienceTargetId: number;
  electionId: number;
  targetId: string;
}

export interface IElectionAudienceTargetAddRequest {
  targetId: string;
}

export interface IElectionCandidateResponse {
  electionCandidateId: number;
  electionId: number;
  employeeId: number | null;
  teamId: number | null;
  candidateType: ElectionCandidateType | string;
  manifesto: string | null;
  nominatedAt: string;
}

export interface IElectionCandidateNominateRequest {
  employeeId?: number | null;
  teamId?: number | null;
  candidateType: ElectionCandidateType | string;
  manifesto?: string | null;
}

/** Bulk-nominates every active employee matching a scope at once; targetIds is ignored for Organization scope. */
export interface IElectionCandidateNominateBulkRequest {
  scope: ElectionAudienceScope | string;
  targetIds: number[];
}

export interface IElectionVoteCastRequest {
  candidateIds: number[];
}

export interface IElectionVoteResponse {
  electionVoteId: number;
  electionId: number;
  candidateId: number;
  /** Null when the election is anonymous. */
  voterId: number | null;
  votedAt: string;
}

export interface IElectionCandidateTally {
  electionCandidateId: number;
  employeeId: number | null;
  teamId: number | null;
  voteCount: number;
}

export interface IElectionVoterDetail {
  voterId: number;
  candidateIds: number[];
  votedAt: string;
}

/** VoterDetails is null for anonymous elections - never populated then stripped, never computed at all. */
export interface IElectionResultsResponse {
  electionId: number;
  isAnonymous: boolean;
  status: ElectionStatus | string;
  totalVotes: number;
  candidateTallies: IElectionCandidateTally[];
  voterDetails: IElectionVoterDetail[] | null;
}
