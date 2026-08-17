export interface IContactLinkPlatformOption {
  label: string;
  value: string;
}

export const CONTACT_LINK_OTHER_VALUE = 'Other';

export const ContactLinkPlatformOptions: IContactLinkPlatformOption[] = [
  { label: 'LinkedIn', value: 'LinkedIn' },
  { label: 'Facebook', value: 'Facebook' },
  { label: 'Twitter / X', value: 'Twitter/X' },
  { label: 'GitHub', value: 'GitHub' },
  { label: 'Instagram', value: 'Instagram' },
  { label: 'Other', value: CONTACT_LINK_OTHER_VALUE },
];
