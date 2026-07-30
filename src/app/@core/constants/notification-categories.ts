export interface INotificationCategoryOption {
  label: string;
  value: string;
  icon: string;
}

/**
 * Notification categories emitted by the Community backend. Used for the category filter
 * dropdown on the Notification Center and the per-category toggle rows on the Notification
 * Preferences page. Values are the exact strings the backend stores/sends - keep in sync
 * with the backend's NotificationCategory enum/constants.
 */
export const NOTIFICATION_CATEGORIES: INotificationCategoryOption[] = [
  { label: 'Recognition', value: 'Recognition', icon: 'fa-solid fa-award' },
  { label: 'Survey', value: 'Survey', icon: 'fa-solid fa-square-poll-vertical' },
  { label: 'Marketplace', value: 'Marketplace', icon: 'fa-solid fa-store' },
  { label: 'Social Mention', value: 'SocialMention', icon: 'fa-solid fa-at' },
  { label: 'Task', value: 'Task', icon: 'fa-solid fa-list-check' },
  { label: 'Team', value: 'Team', icon: 'fa-solid fa-people-group' },
];
