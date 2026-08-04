import { ReactionType } from '@core/interfaces/community/reaction.interface';

export interface IRecognitionReactionResponse {
  reactionId: number;
  recognitionId: number;
  employeeId: number;
  reactionType: ReactionType;
}

export interface IRecognitionReactionAddRequest {
  reactionType: ReactionType;
}
