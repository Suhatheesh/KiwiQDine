import { IsNotEmpty, IsString, Length } from 'class-validator';


export class CreateOrderProcessingQueueDTO {
  @IsString()
  @IsNotEmpty()
  @Length(2, 128)
  readonly orderStatusId: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 128)
  readonly orderId: string;
}
