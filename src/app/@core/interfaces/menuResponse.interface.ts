export interface IMenuItem {
  key?: string;
  title: string;
  href?: string;
  icon: string;
  flags?: string[];
  subItems?: IMenuItem[];
  active: boolean;
  expanded?: boolean;
  order?: number;
  divider?: boolean;
  /** Only shown when the current user is HR/Admin - see sidebar.component.ts filterHrOnlyItems. */
  hrOnly?: boolean;
}
