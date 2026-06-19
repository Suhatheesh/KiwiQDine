import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiParam, ApiOkResponse, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Transaction } from '../infrastructure/database/entities/transaction.entity';
import { TransactionService } from './transaction.service';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { AccessAuthGuard } from '@/infrastructure';
import { Result } from '@/domain';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { UserRole } from '../infrastructure/database/entities/user.entity';
@ApiTags('transactions')
@Controller('transactions')
@UseGuards(AccessAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
  ) { }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all transactions (Super Admin only)' })
  @ApiOkResponse({ type: TransactionResponseDto, isArray: true })
  async getAllTransactions(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Result<TransactionResponseDto[]>> {
    const transactions = await this.transactionService.getAll({ status, startDate, endDate });
    const transactionDtos = transactions.map(tx => new TransactionResponseDto(tx));
    return Result.ok(transactionDtos);
  }

  @Get(':restaurantId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all transactions for a specific restaurant' })
  @ApiParam({ name: 'restaurantId', required: true, type: String })
  @ApiOkResponse({ type: TransactionResponseDto, isArray: true })
  async getRestaurantTransactions(
    @Param('restaurantId') restaurantId: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Result<TransactionResponseDto[]>> {
    const transactions = await this.transactionService.getAllByRestaurantId(restaurantId, { status, startDate, endDate });
    const transactionDtos = transactions.map(tx => new TransactionResponseDto(tx));
    return Result.ok(transactionDtos);
  }

  @Post(':restaurantId/upload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Upload a transaction for a restaurant' })
  @ApiParam({ name: 'restaurantId', required: true, type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        attachmentUrl: { type: 'string' },
        amount: { type: 'number' },
        status: { type: 'string', default: 'Completed' },
        type: { type: 'string', default: 'payout', enum: ['payout', 'earned', 'adjustment'] },
      },
      required: ['amount'],
    },
  })
  @ApiOkResponse({ description: 'Transaction saved successfully', type: Transaction })
  async uploadTransaction(
    @Param('restaurantId') restaurantId: string,
    @Body() body: { description?: string; attachmentUrl?: string; amount: number; status?: string; type?: string },
  ): Promise<Transaction> {
    if (!restaurantId || !body.amount) {
      throw new BadRequestException('restaurantId and amount are required');
    }
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const invoiceId = `INV-${dateStr}-${timeStr}`;

    return await this.transactionService.createTransaction({
      restaurantId,
      invoiceId,
      amount: body.amount,
      date: dateStr,
      description: body.description,
      status: body.status || 'Completed',
      type: body.type || 'payout',
      attachmentUrl: body.attachmentUrl,
    });
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update transaction status' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['Pending', 'Completed', 'Cancelled', 'Failed'] },
      },
      required: ['status'],
    },
  })
  @ApiOkResponse({ description: 'Transaction status updated successfully', type: TransactionResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<Result<TransactionResponseDto>> {
    const updated = await this.transactionService.updateStatus(id, status);
    if (!updated) {
      throw new BadRequestException('Transaction not found');
    }
    return Result.ok(new TransactionResponseDto(updated));
  }
}
