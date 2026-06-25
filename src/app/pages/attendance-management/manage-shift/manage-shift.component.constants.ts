import { DayOfWeekEnum, OvertimeRoundingModeEnum } from '@app/@core/enums/attendance.enum';

export const OvertimeRoundingModeOptions = [
  { label: 'Round Up', value: OvertimeRoundingModeEnum.RoundUp },
  { label: 'Round Down', value: OvertimeRoundingModeEnum.RoundDown },
  { label: 'Exact', value: OvertimeRoundingModeEnum.Exact },
  { label: 'Nearest', value: OvertimeRoundingModeEnum.Nearest },
];

export const WeekendOptions = [
  { label: 'Sunday', value: DayOfWeekEnum.Sunday },
  { label: 'Monday', value: DayOfWeekEnum.Monday },
  { label: 'Tuesday', value: DayOfWeekEnum.Tuesday },
  { label: 'Wednesday', value: DayOfWeekEnum.Wednesday },
  { label: 'Thursday', value: DayOfWeekEnum.Thursday },
  { label: 'Friday', value: DayOfWeekEnum.Friday },
  { label: 'Saturday', value: DayOfWeekEnum.Saturday },
];
