import { ReactionType } from '@core/interfaces/community/reaction.interface';

export interface IReactionTypeOption {
  value: ReactionType;
  label: string;
  icon: string;
  color: string;
}

/** Mirrors the backend's ReactionTypeEnum (Domain/Enums/Enum.cs) - keep in sync. */
export const REACTION_TYPES: IReactionTypeOption[] = [
  { value: 'Like', label: 'Like', icon: 'fa-solid fa-thumbs-up', color: '#2563eb' },
  { value: 'Love', label: 'Love', icon: 'fa-solid fa-heart', color: '#e11d48' },
  { value: 'Celebrate', label: 'Celebrate', icon: 'fa-solid fa-champagne-glasses', color: '#f59e0b' },
  { value: 'Support', label: 'Support', icon: 'fa-solid fa-hand-fist', color: '#16a34a' },
  { value: 'Insightful', label: 'Insightful', icon: 'fa-solid fa-lightbulb', color: '#7c3aed' },
];
