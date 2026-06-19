import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { Public } from '../infrastructure/auth/decorators/public.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { UserRole } from '../infrastructure/database/entities';
import { BadgeService } from './badge.service';
import { CreateBadgeDto, UpdateBadgeDto, BadgeResponseDto } from './dto/badge.dto';

@ApiTags('Badges')
@Controller('badges')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get('public/:restaurantId')
  @Public()
  @ApiOperation({ summary: 'Get all active badges for a restaurant (public)' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'List of active badges', type: [BadgeResponseDto] })
  async getPublicBadges(@Param('restaurantId') restaurantId: string) {
    return this.badgeService.findActive(restaurantId);
  }

  @Get('public/:restaurantId/details')
  @Public()
  @ApiOperation({ summary: 'Get badge details for specific codes (public)' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiQuery({ name: 'codes', description: 'Comma-separated badge codes', example: 'new,spicy,vegetarian' })
  @ApiOkResponse({ description: 'Badge details for requested codes', type: [BadgeResponseDto] })
  async getBadgeDetails(
    @Param('restaurantId') restaurantId: string,
    @Query('codes') codes: string,
  ) {
    if (!codes) {
      return [];
    }
    const codeArray = codes.split(',').map((c) => c.trim()).filter(Boolean);
    return this.badgeService.getBadgeDetails(codeArray, restaurantId);
  }

  // ==================== MANAGER ENDPOINTS ====================

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all badges for a restaurant (including inactive)' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN)' })
  @ApiOkResponse({ description: 'List of all badges', type: [BadgeResponseDto] })
  async getAllBadges(
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.badgeService.findAll(targetRestaurantId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a specific badge' })
  @ApiParam({ name: 'id', description: 'Badge identifier', format: 'uuid' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN)' })
  @ApiOkResponse({ description: 'Badge details', type: BadgeResponseDto })
  async getBadge(
    @Param('id') id: string,
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.badgeService.findOne(id, targetRestaurantId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a custom badge' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN)' })
  @ApiBody({ type: CreateBadgeDto })
  @ApiOkResponse({ description: 'Created badge', type: BadgeResponseDto })
  async createBadge(
    @Body() dto: CreateBadgeDto,
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.badgeService.create(targetRestaurantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a badge' })
  @ApiParam({ name: 'id', description: 'Badge identifier', format: 'uuid' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN)' })
  @ApiBody({ type: UpdateBadgeDto })
  @ApiOkResponse({ description: 'Updated badge', type: BadgeResponseDto })
  async updateBadge(
    @Param('id') id: string,
    @Body() dto: UpdateBadgeDto,
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.badgeService.update(id, targetRestaurantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete a custom badge (system badges cannot be deleted)' })
  @ApiParam({ name: 'id', description: 'Badge identifier', format: 'uuid' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN)' })
  @ApiOkResponse({ description: 'Badge deleted successfully' })
  async deleteBadge(
    @Param('id') id: string,
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    await this.badgeService.delete(id, targetRestaurantId);
    return { message: 'Badge deleted successfully' };
  }

  @Patch('order/bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update display order for multiple badges' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        badges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              displayOrder: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Updated badges', type: [BadgeResponseDto] })
  async updateBadgeOrder(
    @Body() body: { badges: Array<{ id: string; displayOrder: number }> },
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.badgeService.updateOrder(targetRestaurantId, body.badges);
  }

  @Post('initialize')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Initialize system badges for a restaurant' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN)' })
  @ApiOkResponse({ description: 'Initialized system badges', type: [BadgeResponseDto] })
  async initializeBadges(
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.badgeService.initializeSystemBadges(targetRestaurantId);
  }

  /**
   * Get authorized restaurantId based on user role
   */
  private getAuthorizedRestaurantId(restaurantId: string | undefined, user: any): string {
    if (user.role === UserRole.SUPER_ADMIN) {
      if (!restaurantId) {
        throw new BadRequestException('restaurantId is required for super admin');
      }
      return restaurantId;
    }

    if (!user.restaurantId) {
      throw new ForbiddenException('User does not have an associated restaurant');
    }

    if (restaurantId && restaurantId !== user.restaurantId) {
      throw new ForbiddenException('You can only access badges for your own restaurant');
    }

    return user.restaurantId;
  }
}
