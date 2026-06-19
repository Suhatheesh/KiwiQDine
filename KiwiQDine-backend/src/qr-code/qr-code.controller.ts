import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { QRCodeService } from './qr-code.service';
import { CreateQRCodeDto, UpdateQRCodeDto } from './dto/qr-code.dto';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { UserRole, QRCodeStatus } from '../infrastructure/database/entities';
import { PaginationDto } from '../shared/dto/pagination.dto';

@Controller('qr-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QRCodeController {
  constructor(private readonly qrCodeService: QRCodeService) { }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER)
  create(@Body() createQRCodeDto: CreateQRCodeDto) {
    return this.qrCodeService.createQRCode(createQRCodeDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tenantId') tenantId?: string,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const pagination: PaginationDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };

    // Priority: restaurantId > tenantId > all
    if (restaurantId) {
      return this.qrCodeService.findByRestaurantId(restaurantId, pagination);
    }
    if (tenantId) {
      return this.qrCodeService.findByTenantId(tenantId, pagination);
    }
    return this.qrCodeService.findAll(pagination);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  findOne(@Param('id') id: string) {
    return this.qrCodeService.findOne(id);
  }

  @Get('code/:code')
  findOneByCode(@Param('code') code: string) {
    return this.qrCodeService.findByCode(code);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER)
  updateStatus(@Param('id') id: string, @Body('status') status: QRCodeStatus) {
    return this.qrCodeService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async remove(@Param('id') id: string) {
    await this.qrCodeService.deleteQRCode(id);
    return { message: 'QR code deleted successfully' };
  }
}