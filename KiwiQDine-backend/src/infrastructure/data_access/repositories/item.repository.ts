import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { ItemMapper } from '../../../item/item.mapper';
import { Result } from './../../../domain/result/result';
import { Item } from './../../../item/item';
import { IItemRepository } from '../repositories/interfaces/item-repository.interface';
import { Item as ItemEntity } from '../../../infrastructure/database/entities/item.entity';

@Injectable()
export class ITemRepository extends GenericTypeOrmRepository<Item, ItemEntity> implements IItemRepository {
  itemMapper: ItemMapper;
  constructor(
    @InjectRepository(ItemEntity) repository: Repository<ItemEntity>,
    itemMapper: ItemMapper,
  ) {
    super(repository, itemMapper);
    this.itemMapper = itemMapper;
  }

  async getItemById(id: string): Promise<Result<Item>> {
    const itemDoc: Result<Item> = await this.findById(id);
    if (!itemDoc) {
      return Result.fail('Error getting document from database', HttpStatus.NOT_FOUND);
    }
    return itemDoc;
  }

  async createItem(itemModel: Partial<ItemEntity>): Promise<Result<Item>> {
    const doc = await this.create(itemModel);
    if (!doc) {
      return Result.fail('An Error occured, unable to save document in the db', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return doc;
  }

  async getItem(name: string): Promise<Result<Item>> {
    const itemDoc = await this.repository.findOne({ where: { name } });
    if (!itemDoc) {
      return Result.fail('Error getting document from database', HttpStatus.NOT_FOUND);
    }
    const item: Item = this.itemMapper.toDomain(itemDoc);
    return Result.ok(item);
  }

  async getItems(filterQuery: any): Promise<Result<Item[]>> {
    const itemDocs = await this.repository.find({ where: filterQuery });
    if (!itemDocs) {
      return Result.fail('Error getting document from database', HttpStatus.NOT_FOUND);
    }
    const items: Item[] = itemDocs?.length ? itemDocs.map((document) => this.itemMapper.toDomain(document)) : [];
    return Result.ok(items);
  }

  async getItemsByIds(itemIds: string[]): Promise<Result<Item[]>> {
    const itemDocs = await this.repository.find({
      where: { id: In(itemIds) },
    });
    let items: Item[] = [];
    if (itemDocs?.length) {
      items = itemDocs.map((doc) => this.itemMapper.toDomain(doc));
    }
    return Result.ok(items);
  }
}
