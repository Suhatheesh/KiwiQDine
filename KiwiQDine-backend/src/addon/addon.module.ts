import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlService } from 'src/shared/services/access_control.service';
import { RoleService } from 'src/shared/services/role_service';
import { AddonRepository } from '../infrastructure/data_access/repositories/addon.repository';
import { MenuRepository } from '../infrastructure/data_access/repositories/menu.repopsitory';
import { SingleClientRepository } from '../infrastructure/data_access/repositories/singleclient.repository';
import { TYPES } from '../application/constants/types';
import { AuditMapper } from '../audit/audit.mapper';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { AuthService } from '../infrastructure/auth/auth.service';
import { ContextService } from '../infrastructure/context/context.service';
import { Addon } from '../infrastructure/database/entities/addon.entity';
import { Menu } from '../infrastructure/database/entities/menu.entity';
import { MenuAddon } from '../infrastructure/database/entities/menu-addon.entity';
import { SingleClient } from '../infrastructure/database/entities/singleclient.entity';
import { ContextMiddleWare } from '../infrastructure/middlewares/context.middleware';
import { SingleClientMapper } from '../singleclient/singleclient.mapper';
import { SingleClientService } from '../singleclient/singleclient.service';
import { ValidateUser } from '../utils/context-validation';
import { AddonController } from './addon.controller';
import { AddonMapper } from './addon.mapper';
import { AddonService } from './addon.service';
import { MenuMapper } from '../menu/menu.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Addon, Menu, MenuAddon, SingleClient]),
    AuthModule
  ],
  providers: [
    AddonRepository,
    MenuRepository,
    SingleClientRepository,
    AddonMapper,
    MenuMapper,
    SingleClientMapper,
    AuditMapper,
    ContextService,
    JwtService,
    { provide: TYPES.IAddonService, useClass: AddonService },
    { provide: TYPES.ISingleClientService, useClass: SingleClientService },
    { provide: TYPES.IAuthService, useClass: AuthService },
    { provide: TYPES.IContextService, useClass: ContextService },
    { provide: TYPES.IValidateUser, useClass: ValidateUser },
    { provide: TYPES.IMapper, useClass: AddonMapper },
    { provide: TYPES.IAccessControlService, useClass: AccessControlService },
    { provide: TYPES.IRoleService, useClass: RoleService },
  ],
  controllers: [AddonController],
})
export class AddonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContextMiddleWare)
      .forRoutes({ path: 'addons', method: RequestMethod.POST });
  }
}
