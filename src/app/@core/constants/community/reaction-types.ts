import { ReactionType } from '@core/interfaces/community/reaction.interface';

export interface IReactionTypeOption {
  value: ReactionType;
  label: string;
  icon: string;
  color: string;
}

/** Mirrors the backend's ReactionTypeEnum (Domain/Enums/Enum.cs) - keep in sync. */
export const REACTION_TYPES: IReactionTypeOption[] = [
  { value: 'Like', label: 'Like', icon: 'fa-solid fa-thumbs-up', color: '#1877F2' },
  { value: 'Love', label: 'Love', icon: 'fa-solid fa-heart', color: '#F33E58' },
  { value: 'Care', label: 'Care', icon: 'fa-solid fa-face-kiss-wink-heart', color: '#F7B125' },
  { value: 'Haha', label: 'Haha', icon: 'fa-solid fa-face-laugh-squint', color: '#F7B125' },
  { value: 'Wow', label: 'Wow', icon: 'fa-solid fa-face-surprise', color: '#F7B125' },
  { value: 'Sad', label: 'Sad', icon: 'fa-solid fa-face-sad-tear', color: '#F7B125' },
  { value: 'Angry', label: 'Angry', icon: 'fa-solid fa-face-angry', color: '#E9710F' },
];
