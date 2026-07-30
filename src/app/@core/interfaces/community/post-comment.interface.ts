export interface IPostCommentResponse {
  commentId: number;
  postId: number;
  employeeId: number;
  parentCommentId: number | null;
  content: string;
  createdAt: string | null;
}

/** Client-side view model - flat IPostCommentResponse rows reassembled into a reply tree. */
export interface IPostCommentNode extends IPostCommentResponse {
  replies: IPostCommentNode[];
}

export interface IPostCommentAddRequest {
  employeeId: number;
  parentCommentId?: number | null;
  content: string;
  mentionedEmployeeIds?: number[] | null;
}

export interface IPostCommentUpdateRequest {
  content: string;
  mentionedEmployeeIds?: number[] | null;
}
