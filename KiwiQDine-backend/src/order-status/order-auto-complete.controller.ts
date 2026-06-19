import {
    Controller,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
} from '@nestjs/swagger';
import { OrderAutoCompleteService } from './order-auto-complete.service';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { UserRole } from '../infrastructure/database/entities';

@ApiTags('Order Auto-Complete')
@ApiBearerAuth()
@Controller('order-auto-complete')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderAutoCompleteController {
    constructor(private readonly orderAutoCompleteService: OrderAutoCompleteService) { }

    @Post('bulk-complete')
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
    @ApiOperation({
        summary: 'Bulk auto-complete all eligible orders',
        description: 'Automatically marks all SERVED orders with PAID payments as COMPLETED. Useful for fixing existing orders or running as a manual cleanup.',
    })
    @ApiOkResponse({
        description: 'Bulk auto-complete operation completed successfully.',
        schema: {
            type: 'object',
            properties: {
                completed: {
                    type: 'number',
                    description: 'Number of orders that were auto-completed',
                    example: 15,
                },
                orders: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of order numbers that were completed',
                    example: ['ORD000231', 'ORD000228', 'ORD000225'],
                },
            },
        },
    })
    @ApiUnauthorizedResponse({ description: 'User authentication required.' })
    @ApiForbiddenResponse({ description: 'User does not have permission to perform bulk auto-complete.' })
    async bulkAutoComplete() {
        return this.orderAutoCompleteService.bulkAutoComplete();
    }
}
