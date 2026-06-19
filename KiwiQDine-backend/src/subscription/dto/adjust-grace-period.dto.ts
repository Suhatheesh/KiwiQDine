import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class AdjustGracePeriodDto {
    @ApiProperty({
        description: 'The end date of the grace period in YYYY-MM-DD format',
        example: '2026-02-01',
    })
    @IsNotEmpty()
    @IsDateString()
    gracePeriodEndDate: string;
}
