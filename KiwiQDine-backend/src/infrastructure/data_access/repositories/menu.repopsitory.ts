// Note: This repository needs refactoring for the new Menu entity structure
// The new Menu entity has: id, restaurantId, category (string), name, price, image, createdAt, updatedAt
// Old structure referenced: items, categories, description, discount, etc.

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { IMenuRepository } from '../repositories/interfaces/menu-repository.interface';
import { TYPES } from './../../../application/constants/types';
import { Result } from './../../../domain/result/result';
import { Menu } from './../../../menu/menu';
import { MenuMapper } from './../../../menu/menu.mapper';
import { Menu as MenuEntity } from '../../../infrastructure/database/entities/menu.entity';

@Injectable()
export class MenuRepository extends GenericTypeOrmRepository<Menu, MenuEntity> implements IMenuRepository {
  menuMapper: MenuMapper;
  constructor(
    @InjectRepository(MenuEntity) repository: Repository<MenuEntity>,
    menuMapper: MenuMapper,
  ) {
    super(repository, menuMapper);
    this.menuMapper = menuMapper;
  }

  async getMenus(filterQuery: any): Promise<Result<Menu[]>> {
    const documents = await this.repository.find({ 
      where: filterQuery,
    });
    if (!documents) {
      return Result.fail('Error getting Menus from database', HttpStatus.NOT_FOUND);
    }
    const menus = documents.map((doc) => this.menuMapper.toDomain(doc));
    return Result.ok(menus);
  }

  async getMenuById(id: string): Promise<Result<Menu>> {
    const document = await this.repository.findOne({ 
      where: { id },
    });
    if (!document) {
      return Result.fail('Error getting menu from database', HttpStatus.NOT_FOUND);
    }
    const menu: Menu = this.menuMapper.toDomain(document);
    return Result.ok(menu);
  }

  async createMenu(menuModel: Partial<MenuEntity>): Promise<Result<any>> {
    const doc = this.repository.create(menuModel);
    const result = await this.repository.save(doc);
    if (!result) {
      return Result.fail('An Error occured, unable to save document in the db', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return Result.ok(result);
  }

  async updateMenu(filter: any, query: any): Promise<Menu | Result<Menu>> {
    const result = await this.repository.update(filter, query);
    if (result.affected === 0) {
      return Result.fail('Error while updating menu', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const updatedany = await this.repository.findOne({ where: filter });
    if (!updatedany) {
      return Result.fail('Error while updating menu', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const menu = (await this.getMenuById(updatedany.id)).getValue();
    return menu;
  }

  async deleteMenu(id: string): Promise<Result<boolean>> {
    try {
      await this.deleteOne({ id });
      return Result.ok(true);
    } catch (error) {
      console.error(error);
      return Result.fail('Error deleting menu', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getMenuByRestaurantId(restaurantId: string): Promise<Result<Menu[]>> {
    const documents = await this.repository.find({ 
      where: { restaurantId },
    });
    if (!documents) {
      return Result.fail(
        `An Error occured, unable to retrieve ${restaurantId} menus from db`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const menus = documents.map((doc) => this.menuMapper.toDomain(doc));
    return Result.ok(menus);
  }

  // Note: The following method is removed as it referenced items which no longer exist in Menu
  // async deleteAndSetItemsAndAddons - removed
}