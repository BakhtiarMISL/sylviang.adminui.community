export interface IMentionTag {
  employeeId: number;
  employeeName: string;
}

export interface IMentionResponse {
  mentionId: number;
  mentionedEmployeeId: number;
  mentionedBy: number;
  entityType: string;
  entityId: number;
  createdAt: string | null;
}
