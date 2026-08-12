export interface IRecognitionCommentResponse {
  commentId: number;
  recognitionId: number;
  employeeId: number;
  parentCommentId: number | null;
  comment: string;
  createdAt: string | null;
}

export interface IRecognitionCommentAddRequest {
  parentCommentId?: number | null;
  comment: string;
}

export interface IRecognitionCommentNode extends IRecognitionCommentResponse {
  replies: IRecognitionCommentNode[];
}
