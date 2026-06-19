import { Injectable } from '@nestjs/common';
import { IMapper } from './../domain/mapper/mapper';
import { Menu as MenuEntity } from './../infrastructure/database/entities/menu.entity';
import { Menu } from './menu';

@Injectable()
export class MenuMapper implements IMapper<Menu, MenuEntity> {
  constructor() {}
  
  toPersistence(entity: Menu): MenuEntity {
    const {
      name,
      imageUrl,
      basePrice,
      restaurantId,
    } = entity;
    
    // Map category from domain to categoryId for entity
    const categoryId = entity.category?.id || '';
    
    const menuEntity = new MenuEntity();
    menuEntity.id = entity.id;
    menuEntity.name = name;
    menuEntity.categoryId = categoryId;
    menuEntity.price = basePrice;
    menuEntity.image = imageUrl;
    menuEntity.restaurantId = restaurantId;
    
    return menuEntity;
  }

  toDomain(model: MenuEntity): Menu {
    // Create a minimal category object for domain compatibility
    const category = {
      id: model.category?.id || '',
      name: model.category?.name || '',
    };
    
    const entity: Menu = Menu.create(
      {
        name: model.name,
        restaurantId: model.restaurantId,
        description: '',
        items: [],
        discount: 0,
        imageUrl: model.image || '',
        basePrice: model.price,
        category: category as any,
        quantityAvailable: 0,
        audit: {} as any,
      },
      model.id,
    ).getValue();
    return entity;
  }
}
