import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { TenantGuard } from '../infrastructure/auth/guards/tenant.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { UserRole } from '../infrastructure/database/entities';
import { User } from '../infrastructure/database/entities';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { EnhancedPaginationDto } from '../shared/dto/enhanced-pagination.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly userManagementService: UserManagementService) { }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(@Query() filters: EnhancedPaginationDto | PaginationDto) {
    // If any enhanced filter parameters are provided, use the enhanced endpoint
    if ((filters as EnhancedPaginationDto).search || (filters as EnhancedPaginationDto).sortBy || (filters as EnhancedPaginationDto).sortOrder || (filters as EnhancedPaginationDto).role || (filters as EnhancedPaginationDto).status || (filters as EnhancedPaginationDto).tenantId || (filters as EnhancedPaginationDto).restaurantId) {
      return this.userManagementService.findAllUsersWithFilters(filters as EnhancedPaginationDto);
    }
    // Otherwise, use the simple endpoint for backward compatibility
    return this.userManagementService.findAllUsers(filters as PaginationDto);
  }
}

@Controller('tenants/:tenantId/users')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class TenantUsersController {
  constructor(private readonly userManagementService: UserManagementService) { }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  create(@Param('tenantId') tenantId: string, @Body() createUserDto: CreateUserDto) {
    return this.userManagementService.create(tenantId, createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  findAll(@Param('tenantId') tenantId: string, @Query() filters: EnhancedPaginationDto | PaginationDto) {
    // If any enhanced filter parameters are provided, use the enhanced endpoint
    if ((filters as EnhancedPaginationDto).search || (filters as EnhancedPaginationDto).sortBy || (filters as EnhancedPaginationDto).sortOrder || (filters as EnhancedPaginationDto).role || (filters as EnhancedPaginationDto).status || (filters as EnhancedPaginationDto).restaurantId) {
      return this.userManagementService.findAllWithFilters(tenantId, filters as EnhancedPaginationDto);
    }
    // Otherwise, use the simple endpoint for backward compatibility
    return this.userManagementService.findAll(tenantId, filters as PaginationDto);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  findOne(@Param('id') id: string) {
    return this.userManagementService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.userManagementService.update(id, updateUserDto, currentUser);
  }

  @Post(':id/archive')
  @Roles(UserRole.SUPER_ADMIN)
  archive(@Param('id') id: string) {
    return this.userManagementService.archive(id);
  }

  @Post(':id/unarchive')
  @Roles(UserRole.SUPER_ADMIN)
  unarchive(@Param('id') id: string) {
    return this.userManagementService.unarchive(id);
  }

  @Post(':id/reactivate')
  @Roles(UserRole.SUPER_ADMIN)
  reactivate(@Param('id') id: string) {
    return this.userManagementService.reactivate(id);
  }

  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  resetPassword(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.userManagementService.resetPassword(id, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  async delete(@Param('id') id: string) {
    return this.userManagementService.delete(id);
  }
}
