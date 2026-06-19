import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../shared/dto/pagination.dto';

export class GetCustomersQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
