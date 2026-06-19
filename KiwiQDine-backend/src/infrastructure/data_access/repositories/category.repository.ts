import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { Category } from './../../../category/category';
import { CategoryMapper } from './../../../category/category.mapper';
import { Category as CategoryEntity } from '../../../infrastructure/database/entities/category.entity';

export class CategoryRepository extends GenericTypeOrmRepository<Category, CategoryEntity> {
  constructor(
    @InjectRepository(CategoryEntity) repository: Repository<CategoryEntity>,
    categoryMapper: CategoryMapper,
  ) {
    super(repository, categoryMapper);
  }
}
