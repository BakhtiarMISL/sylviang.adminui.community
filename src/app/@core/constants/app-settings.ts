export const DATE_TIME_FORMATS = {
  commonDate: 'dd-MMM-yyyy',
  commonDateTime: 'dd-MMM-yyyy HH:mm',
  commonMonth: 'MMM-yyyy',
  commonTime: 'HH:mm',
  commonInputDate: 'dd-M-yy',
  commonInputMonth: 'M-yy',
} as const;

export const UI_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
  searchDebounceTime: 300,
  scrollThreshold: 0.7,
} as const;
