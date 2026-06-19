import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiOkResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { OrderAlertsService } from './order-alerts.service';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { UserRole } from '../infrastructure/database/entities';
import { UpdateAlertConfigDto } from './dto/alert.dto';

@ApiTags('Order Alerts')
@Controller('order-alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrderAlertsController {
    constructor(private readonly orderAlertsService: OrderAlertsService) { }

    @Get('config/:restaurantId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get alert configuration for a restaurant' })
    @ApiParam({ name: 'restaurantId', description: 'Restaurant ID' })
    @ApiOkResponse({ description: 'Alert configuration retrieved successfully' })
    async getAlertConfig(@Param('restaurantId') restaurantId: string) {
        return await this.orderAlertsService.getAlertConfig(restaurantId);
    }

    @Post('config')
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Update alert configuration for a restaurant' })
    @ApiOkResponse({ description: 'Alert configuration updated successfully' })
    async updateAlertConfig(@Body() updateDto: UpdateAlertConfigDto) {
        return await this.orderAlertsService.updateAlertConfig(updateDto);
    }

    @Post('trigger/:restaurantId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
    @ApiOperation({ summary: 'Manually trigger alert check for a restaurant (for testing)' })
    @ApiParam({ name: 'restaurantId', description: 'Restaurant ID' })
    @ApiOkResponse({ description: 'Alert check triggered successfully' })
    async triggerAlertCheck(@Param('restaurantId') restaurantId: string) {
        await this.orderAlertsService.triggerAlertCheck(restaurantId);
        return { message: 'Alert check triggered successfully', restaurantId };
    }
}
