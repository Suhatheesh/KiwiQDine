import { Invoice } from "@/infrastructure/database/entities";
import { ApiProperty } from "@nestjs/swagger";

export class InvoiceResponseDto {

  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceName: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty({ required: false })
  restaurantName?: string;

  @ApiProperty()
  billing_period: string;

  @ApiProperty()
  plan: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  base_amount: number;

  @ApiProperty()
  fees: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  due_date: string;

  @ApiProperty({ required: false })
  paid_date?: string | null;

  @ApiProperty()
  invoiceAttachmentUrl?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  constructor(entity: Invoice) {
    this.id = entity.id;
    this.invoiceName = entity.invoiceName;
    this.restaurantId = entity.restaurantId;
    this.restaurantName = entity.restaurant?.name;
    this.billing_period = entity.billing_period;
    this.plan = entity.plan?.name || 'Unknown';
    this.amount = Number(entity.amount);
    this.base_amount = Number(entity.base_amount);
    this.fees = Number(entity.fees);
    this.status = entity.status;
    this.due_date = entity.due_date;
    this.paid_date = entity.paid_date;
    this.invoiceAttachmentUrl = entity.invoiceAttachmentUrl;
    this.created_at = entity.created_at;
    this.updated_at = entity.updated_at;
  }
}