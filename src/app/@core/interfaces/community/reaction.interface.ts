export type ReactionType = 'Like' | 'Love' | 'Celebrate' | 'Support' | 'Insightful';

export interface IPostReactionResponse {
  reactionId: number;
  postId: number;
  employeeId: number;
  reactionType: ReactionType;
}

export interface ICommentReactionResponse {
  reactionId: number;
  commentId: number;
  employeeId: number;
  reactionType: ReactionType;
}

export interface IPostReactionAddRequest {
  employeeId: number;
  reactionType: ReactionType;
}

export interface ICommentReactionAddRequest {
  employeeId: number;
  reactionType: ReactionType;
}

/** Client-aggregated view of raw reaction rows - grouped by type, with the caller's own reaction highlighted. */
export interface IReactionSummary {
  reactionType: ReactionType;
  count: number;
  reactedByMe: boolean;
}
