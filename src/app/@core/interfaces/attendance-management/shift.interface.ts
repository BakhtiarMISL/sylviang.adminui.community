export interface IShiftCreateRequest {
  shiftName: string;
  shiftCode: string;
  loginTime: string;
  logoutTime: string;
  graceInMinutes: number;
  breakInMinutes: number;
  considerableInMinutes: number;
  loginLimitTime: string;
  logoutLimitTime: string;
  workingTimeInMinutes: number;
  minimumWorkingTimeInMinutes: number;
  minimumOvertimeMinutes: number;
  maximumOvertimeMinutes: number;
  overtimeRoundingMode: 'RoundDown' | 'RoundUp' | 'Nearest';
  overtimeRoundingInterval: number;
  friendlyName: string;
  isCrossDateShift: boolean;
  defaultSelection: boolean;
  isActive: boolean;
  firstHalfStartTime: string;
  firstHalfEndTime: string;
  firstHalfLoginLimitTime: string;
  firstHalfMinimumWorkingMinutes: number;
  secondHalfStartTime: string;
  secondHalfEndTime: string;
  secondHalfLoginLimitTime: string;
  secondHalfMinimumWorkingMinutes: number;
}

export interface IShiftResponse extends IShiftCreateRequest {
  shiftId: number;
}

export interface IShiftUpdateRequest extends IShiftCreateRequest {
  shiftId: number;
}
