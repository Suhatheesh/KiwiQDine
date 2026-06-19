import { ApiProperty } from '@nestjs/swagger';

export class UsageSummaryCardDto {
  @ApiProperty({ type: String, description: 'Order usage record ID associated with this summary' })
  orderUsageId: string;

  @ApiProperty({ type: String, description: 'Restaurant ID associated with this usage summary' })
  restaurantId: string;

  @ApiProperty({ type: String, description: 'Month for which the usage summary is calculated (format: YYYY-MM)' })
  month: string;

  @ApiProperty({ type: Number, description: 'Total overage cost for invoices' })
  overageInvoiceCost: number;

  @ApiProperty({ type: Number, description: 'Total overage cost for tables' })
  overageTableCost: number;

  @ApiProperty({ type: Number, description: 'Total overage cost for QR codes' })
  overageQRCost: number;

  @ApiProperty({ type: Number, description: 'Total overage cost for users' })
  overageUserCost: number;

  @ApiProperty({ type: Number, description: 'Sum of all overage costs for this cycle' })
  totalOverageCost: number;

  @ApiProperty({ type: String, description: 'Billing date for this usage summary (format: YYYY-MM-DD)' })
  billingDate: string;
}
