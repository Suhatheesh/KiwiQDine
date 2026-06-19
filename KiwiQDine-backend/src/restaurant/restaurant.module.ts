import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant, Menu, Invoice, SubscriptionPlanEntity } from '../infrastructure/database/entities';
import { RestaurantsController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { RestaurantMapper } from './restaurant.mapper';
import { RestaurantRepository } from './../infrastructure/data_access/repositories/restaurant.repository';
import { TYPES } from './../application/constants/types';
import { LocationMapper } from '../location/location.mapper';
import { AuditMapper } from '../audit/audit.mapper';
import { ContextService } from '../infrastructure/context/context.service';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { AuthService } from '../infrastructure/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ValidateUser } from '../utils/context-validation';
import { AccessControlService } from '../shared/services/access_control.service';
import { RoleService } from '../shared/services/role_service';
import { MenuMapper } from '../menu/menu.mapper';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ContextMiddleWare } from '../infrastructure/middlewares/context.middleware';
import { S3Service } from '@/shared/services/s3.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, Menu, Invoice, SubscriptionPlanEntity]),
    AuthModule,
    SubscriptionModule
  ],
  controllers: [RestaurantsController],
  providers: [
    RestaurantService,
    { provide: TYPES.IRestaurantService, useClass: RestaurantService },
    { provide: TYPES.IRestaurantRepository, useClass: RestaurantRepository },
    { provide: TYPES.IContextService, useClass: ContextService },
    { provide: TYPES.IAuthService, useClass: AuthService },
    { provide: TYPES.IValidateUser, useClass: ValidateUser },
    { provide: TYPES.IAccessControlService, useClass: AccessControlService },
    { provide: TYPES.IRoleService, useClass: RoleService },
    RestaurantMapper,
    RestaurantRepository,
    MenuMapper,
    LocationMapper,
    AuditMapper,
    ContextService,
    AuthService,
    JwtService,
    ConfigService,
    ValidateUser,
    AccessControlService,
    RoleService,
    S3Service
  ],
  exports: [RestaurantService, S3Service],
})
export class RestaurantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleWare).forRoutes(RestaurantsController);
  }
}
