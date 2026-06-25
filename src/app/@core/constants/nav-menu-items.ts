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
];
