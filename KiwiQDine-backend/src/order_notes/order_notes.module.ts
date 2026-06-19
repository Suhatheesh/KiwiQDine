import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TYPES } from 'src/application';
import { AuditMapper } from 'src/audit';
import { ContextService } from 'src/infrastructure';
import { OrderNoteRepository } from 'src/infrastructure/data_access/repositories/order-note.repository';
import { OrderNote } from '../infrastructure/database/entities/order-note.entity';
import { OrderNotesController } from './order_note.controller';
import { OrderNoteMapper } from './order_note.mapper';
import { OrderNoteService } from './order_note.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderNote])],
  controllers: [OrderNotesController],
  providers: [
    { provide: TYPES.IOrderNoteService, useClass: OrderNoteService },
    { provide: TYPES.IOrderNoteRepository, useClass: OrderNoteRepository },
    { provide: TYPES.IContextService, useClass: ContextService },
    OrderNoteMapper,
    AuditMapper,
  ],
})
export class OrderNotesModule {}
