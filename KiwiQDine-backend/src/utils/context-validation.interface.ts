
import { GenericTypeOrmRepository } from '../infrastructure/database/typeorm/generic-typeorm.repository';
export interface IValidateUser<TEntity, T extends any> {
  getUser(model: GenericTypeOrmRepository<TEntity, T>, props: { email: string; role?: string }): Promise<boolean>;
}
