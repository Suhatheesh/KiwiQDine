import { IAddonResponseDTO } from './addon-response.dto';
import { AddonParser } from './addon.parser';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { TYPES } from '../application';
import { Audit } from './../domain/audit/audit';
import { Result } from './../domain/result/result';
import { Context } from './../infrastructure/context/context';
import { IContextService } from './../infrastructure/context/context-service.interface';
import { AddonRepository } from './../infrastructure/data_access/repositories/addon.repository';
import { throwApplicationError } from './../infrastructure/utilities/exception-instance';
import { Addon } from './addon';
import { IAddonService } from './addon-service.interface';
import { AddonMapper } from './addon.mapper';
import { CreateAddonDTO } from './create-addon.dto';
import { UpdateAddonDTO } from './update-addon.dto';
import { ISingleClientService } from '../singleclient/interface/singleclient-service.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MenuAddon } from '../infrastructure/database/entities/menu-addon.entity';
import { Menu } from '../infrastructure/database/entities/menu.entity';
import { SingleClient } from '../infrastructure/database/entities/singleclient.entity';

@Injectable()
export class AddonService implements IAddonService {
  private context: Context;
  constructor(
    @Inject(TYPES.IContextService)
    private readonly contextService: IContextService,
    @Inject(TYPES.ISingleClientService) private readonly singleclientService: ISingleClientService,
    private readonly addonRepository: AddonRepository,
    private readonly addonMapper: AddonMapper,
    @InjectRepository(MenuAddon)
    private readonly menuAddonRepository: Repository<MenuAddon>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(SingleClient)
    private readonly singleClientRepository: Repository<SingleClient>,
  ) {
    this.context = this.contextService.getContext();
  }

  async createAddon(props: CreateAddonDTO, user: any): Promise<Result<IAddonResponseDTO>> {
    try {
      const { name, menuIds } = props;

      // Get restaurantId from authenticated user
      let restaurantId = user.restaurantId;

      // If user is SUPER_ADMIN and doesn't have a restaurantId, get it from the first menu
      if (!restaurantId) {
        const firstMenu = await this.menuRepository.findOne({ where: { id: menuIds[0] } });
        if (!firstMenu) {
          throwApplicationError(HttpStatus.NOT_FOUND, 'Menu item not found');
        }
        restaurantId = firstMenu.restaurantId;
      }

      // Check if addon with same name already exists for this restaurant
      const existingItem = await this.addonRepository.findOne({
        where: { name, restaurantId }
      });

      if (existingItem && existingItem.isSuccess) {
        throwApplicationError(HttpStatus.BAD_REQUEST, `Addon "${name}" already exists for this restaurant`);
      }

      // Validate that all menu items exist and belong to the same restaurant
      const menus = await this.menuRepository.find({
        where: { id: In(menuIds) }
      });

      if (menus.length !== menuIds.length) {
        throwApplicationError(HttpStatus.NOT_FOUND, 'One or more menu items do not exist');
      }

      // Verify all menus belong to the same restaurant
      const invalidMenus = menus.filter(menu => menu.restaurantId !== restaurantId);
      if (invalidMenus.length > 0) {
        throwApplicationError(HttpStatus.FORBIDDEN, 'All menu items must belong to the same restaurant');
      }

      const context = new Context(user.email, undefined, undefined, user.role);
      const audit: Audit = Audit.createInsertContext(context);

      // Create the addon
      const addon: Addon = Addon.create({ ...props, audit, restaurantId });
      const addonModel = this.addonMapper.toPersistence(addon);
      const result: Result<Addon> = await this.addonRepository.create(addonModel);

      if (!result.isSuccess) {
        throwApplicationError(HttpStatus.SERVICE_UNAVAILABLE, 'Error while creating addon, please try again later');
      }

      const createdAddon = result.getValue();

      // Create MenuAddon associations
      const menuAddonAssociations = menuIds.map(menuId =>
        this.menuAddonRepository.create({
          addonId: createdAddon.id,
          menuId,
        })
      );

      await this.menuAddonRepository.save(menuAddonAssociations);

      // Fetch the addon with menu associations
      const addonWithMenus = await this.addonRepository.getAddonWithMenus(createdAddon.id);
      const newAddon = this.addonMapper.toDomain(addonWithMenus);
      const addonResponse = AddonParser.createAddonResponse(newAddon, addonWithMenus.menuAddons);

      return Result.ok(addonResponse);
    } catch (error) {
      console.error('Error in createAddon:', error.message);
      throwApplicationError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Addon creation failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  async getAddons(user: any): Promise<Result<IAddonResponseDTO[]>> {
    try {
      const restaurantId = user.restaurantId;
      const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.role === 0 || user.role?.toString().toUpperCase() === 'SUPER_ADMIN';

      let addonsDoc;
      if (isSuperAdmin && !restaurantId) {
        addonsDoc = await this.addonRepository.findAll();
      } else if (restaurantId) {
        addonsDoc = await this.addonRepository.getAddonsByRestaurant(restaurantId);
      } else {
        throwApplicationError(HttpStatus.FORBIDDEN, 'User does not have access to any restaurant');
      }

      const response: IAddonResponseDTO[] = addonsDoc.map(addonDoc => {
        const addon = this.addonMapper.toDomain(addonDoc);
        return AddonParser.createAddonResponse(addon, addonDoc.menuAddons || []);
      });

      return Result.ok(response);
    } catch (error) {
      console.error('Error in getAddons:', error.message);
      return Result.fail(`Failed to get addons: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAddonsGroupedByRestaurant(): Promise<Result<any>> {
    try {
      const allAddons = await this.addonRepository.findAll();

      // Group addons by restaurant
      const groupedByRestaurant = allAddons.reduce((acc, addonDoc) => {
        const restaurantId = addonDoc.restaurantId;

        if (!acc[restaurantId]) {
          acc[restaurantId] = {
            restaurantId: restaurantId,
            restaurantName: addonDoc.restaurant?.name || 'Unknown',
            addons: []
          };
        }

        const addon = this.addonMapper.toDomain(addonDoc);
        const addonResponse = AddonParser.createAddonResponse(addon, addonDoc.menuAddons || []);
        acc[restaurantId].addons.push(addonResponse);

        return acc;
      }, {});

      // Convert to array
      const result = Object.values(groupedByRestaurant);

      return Result.ok(result);
    } catch (error) {
      console.error('Error in getAddonsGroupedByRestaurant:', error.message);
      return Result.fail(`Failed to get addons by restaurant: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPublicAddons(restaurantId?: string, menuId?: string): Promise<Result<IAddonResponseDTO[]>> {
    try {
      let addonsDoc;

      if (menuId) {
        // Get addons for a specific menu item
        const menuAddons = await this.menuAddonRepository.find({
          where: { menuId },
          relations: ['addon', 'addon.menuAddons'],
        });

        addonsDoc = menuAddons.map(ma => ma.addon).filter(addon => addon !== null);
      } else if (restaurantId) {
        // Get all addons for a restaurant with relations
        addonsDoc = await this.addonRepository.getAddonsByRestaurant(restaurantId);
      } else {
        // No filter provided, return empty array
        return Result.ok([]);
      }

      const response: IAddonResponseDTO[] = addonsDoc.map(addonDoc => {
        const addon = this.addonMapper.toDomain(addonDoc);
        return AddonParser.createAddonResponse(addon, addonDoc.menuAddons || []);
      });

      return Result.ok(response);
    } catch (error) {
      console.error('Error in getPublicAddons:', error);
      throwApplicationError(HttpStatus.INTERNAL_SERVER_ERROR, `Failed to get public addons: ${error.message}`);
    }
  }

  async updateAddon(id: string, props: UpdateAddonDTO, user: any): Promise<Result<IAddonResponseDTO>> {
    try {
      const { menuIds, ...addonProps } = props;
      const restaurantId = user.restaurantId;

      // Fetch existing addon
      const existingAddonDoc = await this.addonRepository.getAddonWithMenus(id);
      if (!existingAddonDoc) {
        throwApplicationError(HttpStatus.NOT_FOUND, 'Addon not found');
      }

      // Check access
      if (restaurantId && existingAddonDoc.restaurantId !== restaurantId) {
        throwApplicationError(HttpStatus.FORBIDDEN, 'You do not have permission to update this addon');
      }

      // Update basic fields
      const addon = this.addonMapper.toDomain(existingAddonDoc);
      Addon.update(addonProps, addon);
      const addonModel = this.addonMapper.toPersistence(addon);
      await this.addonRepository.updateOne({ id }, addonModel);

      // Update menu associations if provided
      if (menuIds && Array.isArray(menuIds)) {
        // Remove old associations
        await this.menuAddonRepository.delete({ addonId: id });

        // Add new associations
        if (menuIds.length > 0) {
          const menuAddonAssociations = menuIds.map(menuId =>
            this.menuAddonRepository.create({
              addonId: id,
              menuId,
            })
          );
          await this.menuAddonRepository.save(menuAddonAssociations);
        }
      }

      // Return updated addon
      const updatedAddonDoc = await this.addonRepository.getAddonWithMenus(id);
      const updatedAddon = this.addonMapper.toDomain(updatedAddonDoc);
      return Result.ok(AddonParser.createAddonResponse(updatedAddon, updatedAddonDoc.menuAddons));
    } catch (error) {
      console.error('Error in updateAddon:', error);
      throwApplicationError(HttpStatus.INTERNAL_SERVER_ERROR, `Failed to update addon: ${error.message}`);
    }
  }

  async deleteAddon(id: string, user: any): Promise<Result<boolean>> {
    try {
      const restaurantId = user.restaurantId;

      // Fetch existing addon
      const existingAddonDoc = await this.addonRepository.getAddonWithMenus(id);
      if (!existingAddonDoc) {
        throwApplicationError(HttpStatus.NOT_FOUND, 'Addon not found');
      }

      // Check access
      if (restaurantId && existingAddonDoc.restaurantId !== restaurantId) {
        throwApplicationError(HttpStatus.FORBIDDEN, 'You do not have permission to delete this addon');
      }

      // Delete the addon (MenuAddon associations will be deleted via cascade)
      await this.addonRepository.deleteOne({ id });

      return Result.ok(true);
    } catch (error) {
      console.error('Error in deleteAddon:', error);
      throwApplicationError(HttpStatus.INTERNAL_SERVER_ERROR, `Failed to delete addon: ${error.message}`);
    }
  }
}
