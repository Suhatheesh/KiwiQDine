import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';

export class GetCashierPendingOrdersDto {
    @ApiProperty({ required: true, description: 'Restaurant ID' })
    @IsString()
    restaurantId: string;

    @ApiProperty({ required: false, description: 'Filter by order type', enum: ['takeaway', 'parking', 'dine_in'] })
    @IsOptional()
    @IsEnum(['takeaway', 'parking', 'dine_in'])
    orderType?: string;

    @ApiProperty({ required: false, description: 'Filter by payment status', enum: ['pending', 'paid'] })
    @IsOptional()
    @IsEnum(['pending', 'paid'])
    paymentStatus?: string;

    @ApiProperty({ required: false, description: 'Show only served orders (for pay-last restaurants)', type: Boolean })
    @IsOptional()
    @IsBoolean()
    servedOnly?: boolean;

    @ApiProperty({ required: false, description: 'Date filter (YYYY-MM-DD), defaults to today' })
    @IsOptional()
    @IsString()
    date?: string;
}
