import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { SelectedCartItem as SelectedCartItemEntity } from '../../../infrastructure/database/entities/selected-cart-item.entity';

@Injectable()
export class SelectedCartItemRepository extends GenericTypeOrmRepository<any, SelectedCartItemEntity> {
  constructor(
    @InjectRepository(SelectedCartItemEntity) repository: Repository<SelectedCartItemEntity>,
  ) {
    super(repository, null);
  }
}