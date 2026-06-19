
import { IsString, IsOptional, IsNumber, IsArray, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAddonDTO {
    @ApiPropertyOptional({ example: 'Extra Cheese' })
    @IsString()
    @IsOptional()
    @MaxLength(128)
    readonly name?: string;

    @ApiPropertyOptional({ example: 100 })
    @IsNumber()
    @IsOptional()
    readonly quantity?: number;

    @ApiPropertyOptional({ example: 50.00 })
    @IsNumber()
    @IsOptional()
    readonly unitPrice?: number;

    @ApiPropertyOptional({ example: 'Delicious extra cheese' })
    @IsString()
    @MaxLength(256)
    @IsOptional()
    readonly description?: string;

    @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
    @IsString()
    @IsOptional()
    readonly image?: string;

    @ApiPropertyOptional({ example: ['menu-uuid-1', 'menu-uuid-2'] })
    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    readonly menuIds?: string[];
}
