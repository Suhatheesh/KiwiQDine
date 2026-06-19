import { Controller, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AccessAuthGuard } from '@/infrastructure';
import { Result } from '@/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { InvoiceSchedulerService } from './invoice-scheduler.service';
import { Invoice } from '@/infrastructure/database/entities';
import { Repository } from 'typeorm';
import { InvoiceFilterDto } from './dto/invoice-filter.dto';
import { Roles } from '@/infrastructure/auth/decorators/roles.decorator';
import { UserRole } from '@/infrastructure/database/entities';
import { RolesGuard } from '@/infrastructure/auth/guards/roles.guard';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(AccessAuthGuard, RolesGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService,
    private readonly invoiceSchedulerService: InvoiceSchedulerService,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) { }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all invoices with filters (Super Admin only)' })
  async findAllWithFilters(@Query() filters: InvoiceFilterDto): Promise<Result<{
    data: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    const result = await this.invoiceService.findAllWithFilters(filters);
    return Result.ok(result);
  }

  @Get('restaurant/:restaurantId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all invoices for a specific restaurant' })
  @ApiParam({ name: 'restaurantId', required: true, type: String })
  async findAll(@Param('restaurantId') restaurantId?: string): Promise<Result<InvoiceResponseDto[]>> {
    const invoices = await this.invoiceService.findByRestaurantId(restaurantId);
    return Result.ok(invoices);
  }

  @Post('test-generate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test endpoint to generate invoices immediately' })
  async testGenerateInvoices() {
    await this.invoiceSchedulerService.generateInvoicesForDueSubscriptions();
    return { message: 'Invoices generated (test)' };
  }

  @Get('summary')
  @UseGuards(AccessAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice summary (total revenue, monthly revenue, pending, overdue)' })
  async getInvoiceSummary() {
    const summary = await this.invoiceService.getInvoiceSummary();
    return Result.ok(summary);
  }

  @Get('restaurant/:restaurantId/summary')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice summary for a specific restaurant (total revenue, monthly revenue, pending, overdue)' })
  async getRestaurantInvoiceSummary(@Param('restaurantId') restaurantId: string) {
    const summary = await this.invoiceService.getInvoiceSummaryForRestaurant(restaurantId);
    return Result.ok(summary);
  }

  @Get(':id/pdf')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice PDF by invoice ID' })
  @ApiParam({ name: 'id', required: true, type: String })
  async getInvoicePdf(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice || !invoice.invoiceAttachmentUrl) {
      return res.status(404).send('PDF not found');
    }
    // Redirect to S3 public URL (or signed URL)
    return res.redirect(invoice.invoiceAttachmentUrl);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice details by invoice ID' })
  @ApiParam({ name: 'id', required: true, type: String, description: 'Invoice UUID' })
  async findById(@Param('id') id: string): Promise<Result<InvoiceResponseDto>> {
    const invoice = await this.invoiceService.findById(id);
    if (!invoice) {
      return Result.fail('Invoice not found', 404);
    }
    return Result.ok(invoice);
  }

  @Patch(':id/mark-paid')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark invoice as paid (Super Admin only)' })
  @ApiParam({ name: 'id', required: true, type: String, description: 'Invoice UUID' })
  async markAsPaid(@Param('id') id: string): Promise<Result<InvoiceResponseDto>> {
    const invoice = await this.invoiceService.markAsPaid(id);
    if (!invoice) {
      return Result.fail('Invoice not found', 404);
    }
    return Result.ok(invoice);
  }

  @Post('generate-overage')
  @UseGuards(AccessAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate overage invoices for subscriptions ending today' })
  async generateOverageInvoices() {
    await this.invoiceSchedulerService.generateOverageInvoicesForEndingSubscriptions();
    return { message: 'Overage invoices generated for subscriptions ending today' };
  }
}

