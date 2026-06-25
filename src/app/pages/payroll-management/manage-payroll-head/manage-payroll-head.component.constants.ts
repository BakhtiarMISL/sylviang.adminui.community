import { PayrollHeadCalculationEnum, PayrollHeadTypeEnum } from '@app/@core/enums/payroll.enum';

export const PayrollHeadTypeOptions = [
  { label: 'Earning', value: PayrollHeadTypeEnum.Earning },
  { label: 'Deduction', value: PayrollHeadTypeEnum.Deduction },
  { label: 'Net Pay', value: PayrollHeadTypeEnum.NetPay },
];

export const PayrollHeadCalculationOptions = [
  { label: 'Fixed Amount', value: PayrollHeadCalculationEnum.Fixed },
  { label: 'Percentage', value: PayrollHeadCalculationEnum.Percentage },
  { label: 'Formula', value: PayrollHeadCalculationEnum.Formula },
];
