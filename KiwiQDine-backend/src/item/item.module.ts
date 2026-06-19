import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SingleClientRepository } from '../infrastructure/data_access/repositories/singleclient.repository';
import { AddonMapper } from './../addon/addon.mapper';
import { AddonService } from './../addon/addon.service';
import { TYPES } from './../application/constants/types';
import { AuditMapper } from './../audit/audit.mapper';
import { CategoryMapper } from './../category/category.mapper';
import { AuthService } from './../infrastructure/auth/auth.service';
import { ContextService } from './../infrastructure/context/context.service';
import { AddonRepository } from './../infrastructure/data_access/repositories/addon.repository';
import { CategoryRepository } from './../infrastructure/data_access/repositories/category.repository';
import { ITemRepository } from './../infrastructure/data_access/repositories/item.repository';
import { Category } from './../infrastructure/database/entities/category.entity';
import { Item } from './../infrastructure/database/entities/item.entity';
import { SingleClient } from './../infrastructure/database/entities/singleclient.entity';
import { Addon } from './../infrastructure/database/entities/addon.entity';
import { ContextMiddleWare } from './../infrastructure/middlewares/context.middleware';
import { SingleClientMapper } from './../singleclient/singleclient.mapper';
import { SingleClientService } from './../singleclient/singleclient.service';
import { ValidateUser } from './../utils/context-validation';
import { ItemController } from './item.controller';
import { ItemMapper } from './item.mapper';
import { ItemService } from './item.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, SingleClient, Addon, Category]),
  ],
  controllers: [ItemController],
  providers: [
    { provide: TYPES.IContextService, useClass: ContextService },
    { provide: TYPES.ISingleClientService, useClass: SingleClientService },
    { provide: TYPES.IAuthService, useClass: AuthService },
    { provide: TYPES.IValidateUser, useClass: ValidateUser },
    { provide: TYPES.IItemService, useClass: ItemService },
    { provide: TYPES.IAddonService, useClass: AddonService },
    { provide: TYPES.IaddonRepository, useClass: AddonRepository },
    ITemRepository,
    ItemMapper,
    SingleClientRepository,
    SingleClientMapper,
    JwtService,
    AuditMapper,
    AddonRepository,
    AddonMapper,
    AddonRepository,
    CategoryRepository,
    CategoryMapper,
  ],
})
export class ItemModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleWare).exclude().forRoutes(ItemController);
  }
}
