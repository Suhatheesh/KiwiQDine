import { IAddonService } from './addon-service.interface';
import { IAddonResponseDTO } from './addon-response.dto';
import { Result } from './../domain/result/result';
import { CreateAddonDTO } from './create-addon.dto';
import { UpdateAddonDTO } from './update-addon.dto';
import { TYPES } from '../application';
import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { Public } from '../infrastructure/auth/decorators/public.decorator';
import { UserRole } from '../infrastructure/database/entities';

@Controller('addons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AddonController {
  constructor(@Inject(TYPES.IAddonService) private readonly addonService: IAddonService) { }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  async createAddon(
    @Body() request: CreateAddonDTO,
    @CurrentUser() user: any
  ): Promise<Result<IAddonResponseDTO>> {
    return await this.addonService.createAddon(request, user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  async getAddons(@CurrentUser() user: any): Promise<Result<IAddonResponseDTO[]>> {
    return await this.addonService.getAddons(user);
  }

  @Get('by-restaurant')
  @Roles(UserRole.SUPER_ADMIN)
  async getAddonsByRestaurant(@CurrentUser() user: any): Promise<Result<any>> {
    return await this.addonService.getAddonsGroupedByRestaurant();
  }

  @Public()
  @Get('public')
  async getPublicAddons(
    @Query('restaurantId') restaurantId?: string,
    @Query('menuId') menuId?: string,
  ): Promise<Result<IAddonResponseDTO[]>> {
    return await this.addonService.getPublicAddons(restaurantId, menuId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  async updateAddon(
    @Param('id') id: string,
    @Body() request: UpdateAddonDTO,
    @CurrentUser() user: any
  ): Promise<Result<IAddonResponseDTO>> {
    return await this.addonService.updateAddon(id, request, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  async deleteAddon(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<Result<boolean>> {
    return await this.addonService.deleteAddon(id, user);
  }
}
