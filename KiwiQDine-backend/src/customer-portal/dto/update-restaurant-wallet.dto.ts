import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber } from 'class-validator';

export class UpdateRestaurantWalletDto {
  @ApiProperty({ format: 'uuid', description: 'Restaurant identifier to update wallet for' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ description: 'Amount to add to the restaurant wallet (decimal)' })
  @IsNumber()
  totalBalance: number;

  @ApiProperty({ description: 'Total earned by the restaurant (decimal)', required: false })
  @IsNumber()
  walletTotalEarned?: number;

  @ApiProperty({ description: 'Total withdrawn by the restaurant (decimal)', required: false })
  @IsNumber()
  walletTotalWithdrawn?: number;
}
