import { IMenuItem } from '../interfaces/menuResponse.interface';

export const webSidebarMenuItems: IMenuItem[] = [
  {
    href: '/dashboard',
    title: 'Dashboard',
    active: false,
    icon: 'fa-solid fa-chart-line',
  },
  {
    title: 'Attendance',
    active: false,
    icon: 'fa-solid fa-clock',
    subItems: [
      {
        href: '/attendance/shift-list',
        title: 'Shift List',
        active: false,
        icon: 'fa-solid fa-random',
      },
    ],
  },
  {
    title: 'Payroll',
    active: false,
    icon: 'fa-solid fa-money-bill-wave',
    subItems: [
      {
        href: '/payroll/payroll-head-list',
        title: 'Payroll Head',
        active: false,
        icon: 'fa-solid fa-list',
      },
    ],
  },
  {
    title: 'Employee Directory',
    active: false,
    icon: 'fa-solid fa-id-badge',
    subItems: [
      {
        href: '/employee-directory/directory',
        title: 'Directory',
        active: false,
        icon: 'fa-solid fa-address-book',
      },
      {
        href: '/employee-directory/profile/me',
        title: 'My Profile',
        active: false,
        icon: 'fa-solid fa-user',
      },
      {
        href: '/employee-directory/user-management',
        title: 'User Management',
        active: false,
        icon: 'fa-solid fa-users-gear',
        hrOnly: true,
      },
      {
        href: '/employee-directory/manage-employee',
        title: 'Add Employee',
        active: false,
        icon: 'fa-solid fa-user-plus',
        hrOnly: true,
      },
    ],
  },
  {
    title: 'Community',
    active: false,
    icon: 'fa-solid fa-people-group',
    subItems: [
      {
        href: '/community/feed',
        title: 'Feed',
        active: false,
        icon: 'fa-solid fa-stream',
      },
      {
        href: '/community/recognitions',
        title: 'Recognitions',
        active: false,
        icon: 'fa-solid fa-award',
      },
      {
        href: '/community/profile/me',
        title: 'Profile',
        active: false,
        icon: 'fa-solid fa-address-card',
      },
      {
        href: '/community/moderation',
        title: 'Moderation Queue',
        active: false,
        icon: 'fa-solid fa-shield-halved',
        hrOnly: true,
      },
    ],
  },
];
