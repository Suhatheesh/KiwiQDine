import { IsNotEmpty, IsString, Length } from 'class-validator';


export class CreateOrderNoteDTO {
  @IsString()
  @IsNotEmpty()
  @Length(2, 256)
  note: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 128)
  readonly orderId: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 128)
  readonly menuId: string;
}
