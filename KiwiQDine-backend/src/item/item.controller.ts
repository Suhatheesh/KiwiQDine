import { Body, Controller, Inject, Post, Get, Param, UseGuards } from '@nestjs/common';
import { TYPES } from './../application/constants/types';
import { Result } from './../domain/result/result';
import { CreateItemDTO } from './create-item-schema';
import { ITemResponseDTO } from './item-response.dto';
import { IItemService } from './item-service.interface';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { UserRole } from '../infrastructure/database/entities';

@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemController {
  constructor(@Inject(TYPES.IItemService) private readonly itemService: IItemService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  async createItem(@Body() request: CreateItemDTO): Promise<Result<ITemResponseDTO>> {
    return await this.itemService.createItem(request);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  async getItems(): Promise<Result<ITemResponseDTO[]>> {
    return await this.itemService.getItems();
  }

  @Get('/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  async getItemById(@Param('id') itemId: string): Promise<Result<ITemResponseDTO>> {
    return await this.itemService.getItemById(itemId);
  }
}
