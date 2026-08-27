export enum TodayEventTypeEnum {
  Birthday = 'Birthday',
  Anniversary = 'Anniversary',
}

export interface ITodayEventResponse {
  employeeId: number;
  employeeName: string | null;
  photoUrl: string | null;
  eventType: TodayEventTypeEnum;
  yearsOfService: number | null;
}

export interface INewJoineeResponse {
  employeeId: number;
  employeeName: string | null;
  photoUrl: string | null;
  dateOfJoining: string;
}
