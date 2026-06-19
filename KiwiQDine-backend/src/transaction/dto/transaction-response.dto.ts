import { Transaction } from '../../infrastructure/database/entities/transaction.entity';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  date: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  attachmentUrl: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(entity: Transaction) {
    this.id = entity.id;
    this.invoiceId = entity.invoiceId;
    this.amount = Number(entity.amount);
    this.date = entity.date;
    this.description = entity.description;
    this.status = entity.status;
    this.type = entity.type;
    this.attachmentUrl = entity.attachmentUrl;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}
