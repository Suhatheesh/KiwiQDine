import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

export class InvoiceFilterDto {
    @ApiPropertyOptional({ description: 'Filter by restaurant ID' })
    @IsOptional()
    @IsString()
    restaurantId?: string;

    @ApiPropertyOptional({ description: 'Filter by restaurant name (partial match)' })
    @IsOptional()
    @IsString()
    restaurantName?: string;

    @ApiPropertyOptional({ description: 'Filter by invoice status', enum: ['pending', 'paid', 'overdue', 'cancelled'] })
    @IsOptional()
    @IsIn(['pending', 'paid', 'overdue', 'cancelled'])
    status?: string;

    @ApiPropertyOptional({ description: 'Filter by plan name' })
    @IsOptional()
    @IsString()
    plan?: string;

    @ApiPropertyOptional({ description: 'Filter by billing period (e.g., 2024-01)' })
    @IsOptional()
    @IsString()
    billingPeriod?: string;

    @ApiPropertyOptional({ description: 'Filter invoices from this date (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional({ description: 'Filter invoices to this date (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    toDate?: string;

    @ApiPropertyOptional({ description: 'Minimum amount' })
    @IsOptional()
    minAmount?: number;

    @ApiPropertyOptional({ description: 'Maximum amount' })
    @IsOptional()
    maxAmount?: number;

    @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
    @IsOptional()
    limit?: number;

    @ApiPropertyOptional({ description: 'Sort by field', enum: ['created_at', 'due_date', 'amount', 'status', 'invoiceName'] })
    @IsOptional()
    @IsIn(['created_at', 'due_date', 'amount', 'status', 'invoiceName'])
    sortBy?: string;

    @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC';
}
