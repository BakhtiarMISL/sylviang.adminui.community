export interface IPollOptionResponse {
  pollOptionId: number;
  pollId: number;
  optionText: string;
  voteCount: number;
}

export interface IPollResponse {
  pollId: number;
  postId: number;
  allowVoteChange: boolean;
  expirationDate: string | null;
  options: IPollOptionResponse[];
}

export interface IPollCreateRequest {
  allowVoteChange: boolean;
  expirationDate: string | null;
  options: string[];
}

export interface IPollVoteRequest {
  employeeId: number;
  pollOptionId: number;
}
