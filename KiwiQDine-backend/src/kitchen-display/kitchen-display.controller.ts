import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { KitchenDisplayService } from './kitchen-display.service';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { UserRole } from '../infrastructure/database/entities';

@Controller('kitchen-display')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KitchenDisplayController {
  constructor(private readonly kitchenDisplayService: KitchenDisplayService) {}

  @Get('orders')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
  )
  getKitchenOrders(
    @Query('restaurantId') restaurantId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: string,
  ) {
    return this.kitchenDisplayService.getKitchenOrders(restaurantId, vendorId, status);
  }

  @Get('order-items')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
  )
  getOrderItems(
    @Query('restaurantId') restaurantId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: string,
  ) {
    return this.kitchenDisplayService.getOrderItems(restaurantId, vendorId, status);
  }

  @Post('order-item/:orderItemId/start')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
  )
  startOrderItem(
    @Param('orderItemId') orderItemId: string,
    @CurrentUser() user: any,
  ) {
    return this.kitchenDisplayService.startOrderItem(orderItemId, user.id);
  }

  @Post('order-item/:orderItemId/ready')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
  )
  markOrderItemReady(
    @Param('orderItemId') orderItemId: string,
    @CurrentUser() user: any,
  ) {
    return this.kitchenDisplayService.markOrderItemReady(orderItemId, user.id);
  }

  @Post('order-item/:orderItemId/extend-time')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
  )
  extendOrderItemTime(
    @Param('orderItemId') orderItemId: string,
    @Body('additionalMinutes') additionalMinutes: number,
    @CurrentUser() user: any,
  ) {
    return this.kitchenDisplayService.extendOrderItemTime(
      orderItemId,
      additionalMinutes,
      user.id,
    );
  }

  @Get('statistics')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
  )
  getKitchenStatistics(
    @Query('restaurantId') restaurantId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('date') date?: string,
  ) {
    return this.kitchenDisplayService.getKitchenStatistics(restaurantId, vendorId, date);
  }
}
