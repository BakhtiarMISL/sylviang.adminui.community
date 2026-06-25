import { PayrollHeadCalculationEnum, PayrollHeadTypeEnum } from '@app/@core/enums/payroll.enum';

export interface IPayrollHeadCreateRequest {
  headCode: string;
  headName: string;
  headType: PayrollHeadTypeEnum;
  calculationType: PayrollHeadCalculationEnum;
  amount?: number;
  percentage?: number;
  isActive: boolean;
  description?: string;
}

export interface IPayrollHeadResponse {
  payrollHeadId: number;
  headCode: string;
  headName: string;
  headType: PayrollHeadTypeEnum;
  calculationType: PayrollHeadCalculationEnum;
  amount?: number;
  percentage?: number;
  isActive: boolean;
  description?: string;
}

export interface IPayrollHeadUpdateRequest extends IPayrollHeadCreateRequest {
  payrollHeadId: number;
}
