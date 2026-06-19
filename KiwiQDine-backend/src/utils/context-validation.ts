import { throwApplicationError } from './../infrastructure/utilities/exception-instance';
import { OrderManager } from './../order_manager/order.manager';
import { IValidateUser } from './context-validation.interface';
import { Result } from './../domain/result/result';
import { GenericTypeOrmRepository } from './../infrastructure/database/typeorm/generic-typeorm.repository';
import { HttpStatus } from '@nestjs/common';
import { OrderManager as OrderManagerEntity } from '../infrastructure/database/entities/order-manager.entity';
import { User, User as UserEntity } from '@/infrastructure/database/entities';

type EntityType = UserEntity;
type Domain = User;
export class ValidateUser implements IValidateUser<Domain, EntityType> {
  async getUser(
    model: GenericTypeOrmRepository<Domain, EntityType>,
    props: { email: string; role?: string },
  ): Promise<boolean> {
    const { email, role } = props;
    let user: Result<any>;
    if (Object.hasOwnProperty.call(props, 'email')) {
      user = await model.findOne({ where: { email } });
      console.log(user);
    } else {
      user = await model.findOne({ where: { role: role as any } });
    }
    if (!user.isSuccess) {
      throwApplicationError(HttpStatus.FORBIDDEN, 'Invalid User');
    }
    return Boolean(user.isSuccess);
  }
}
