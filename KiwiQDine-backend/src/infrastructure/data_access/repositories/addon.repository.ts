import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Addon } from '../../../addon';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { AddonMapper } from './../../../addon/addon.mapper';
import { IAddonRepository } from './interfaces/addon-repository.interface';
import { Addon as AddonEntity } from '../../../infrastructure/database/entities/addon.entity';

@Injectable()
export class AddonRepository extends GenericTypeOrmRepository<Addon, AddonEntity> implements IAddonRepository {
  addonMapper: AddonMapper;
  constructor(
    @InjectRepository(AddonEntity) repository: Repository<AddonEntity>,
    addonMapper: AddonMapper,
  ) {
    super(repository, addonMapper);
    this.addonMapper = addonMapper;
  }

  async getAddonsByIds(addonsIds: string[]): Promise<Addon[] | []> {
    const addonDocs = await this.repository.find({
      where: { id: In(addonsIds) },
      relations: ['menuAddons', 'menuAddons.menu']
    });
    let addons: Addon[] = [];
    if (addonDocs && addonDocs.length) {
      addons = addonDocs.map((doc) => this.addonMapper.toDomain(doc));
    }
    return addons;
  }

  async getAddonWithMenus(id: string): Promise<any> {
    return await this.repository.findOne({
      where: { id },
      relations: ['menuAddons', 'menuAddons.menu']
    });
  }

  async getAddonsByRestaurant(restaurantId: string): Promise<any[]> {
    return await this.repository.find({
      where: { restaurantId },
      relations: ['menuAddons', 'menuAddons.menu']
    });
  }

  async findAll(): Promise<any[]> {
    return await this.repository.find({
      relations: ['menuAddons', 'menuAddons.menu']
    });
  }

  // async getAddonsByIds(filterQuery: FilterQuery<Addon>): Promise<Result<Addon[]>> {
  //   const addonDocs = await this.anyModel.find(filterQuery);
  //   return Result.ok(addonDocs.map((doc) => this.addonMapper.toDomain(doc)));
  // }
}
