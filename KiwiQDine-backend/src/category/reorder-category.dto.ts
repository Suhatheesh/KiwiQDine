import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryOrderItemDTO {
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({ example: '902e8c9d-34c6-4884-9ca1-27186bf22887' })
    id: string;

    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ example: 1 })
    displayOrder: number;
}

export class ReorderCategoryDTO {
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ example: 'c964ac6d-d18f-4ab4-9c6e-b83bf42c7991' })
    restaurantId?: string;

    @IsArray()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CategoryOrderItemDTO)
    @ApiProperty({ type: [CategoryOrderItemDTO] })
    orders: CategoryOrderItemDTO[];
}
