import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCustomerRatingsQueryDto {
    @ApiPropertyOptional({ description: 'Page number (default: 1)', type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page (default: 10, max: 100)', type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({ description: 'Filter by customer ID (UUID)', type: String })
    @IsOptional()
    @IsUUID()
    customerId?: string;

    @ApiPropertyOptional({ description: 'Filter by restaurant ID (UUID)', type: String })
    @IsOptional()
    @IsUUID()
    restaurantId?: string;

    @ApiPropertyOptional({ description: 'Filter by order ID (UUID)', type: String })
    @IsOptional()
    @IsUUID()
    orderId?: string;

    @ApiPropertyOptional({ description: 'Minimum rating (1-5)', type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    minRating?: number;

    @ApiPropertyOptional({ description: 'Maximum rating (1-5)', type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    maxRating?: number;
}
