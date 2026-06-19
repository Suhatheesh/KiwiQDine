import { Result } from 'src/domain';
import { IGenericTypeOrmRepository } from '../../../database/typeorm/generic-typeorm.interface';
import { OrderNote } from 'src/order_notes/order_note';
import { OrderNote as OrderNoteEntity } from '../../../database/entities/order-note.entity';

export interface IOrderNoteRespository extends IGenericTypeOrmRepository<OrderNote, OrderNoteEntity> {
  createOrderNote(note: OrderNote): Promise<Result<OrderNote>>;
}
