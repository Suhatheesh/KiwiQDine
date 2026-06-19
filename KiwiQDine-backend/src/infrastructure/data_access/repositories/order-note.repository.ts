import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { OrderNote as OrderNoteEntity } from '../../../infrastructure/database/entities/order-note.entity';

@Injectable()
export class OrderNoteRepository extends GenericTypeOrmRepository<any, OrderNoteEntity> {
  constructor(
    @InjectRepository(OrderNoteEntity) repository: Repository<OrderNoteEntity>,
  ) {
    super(repository, null);
  }
}