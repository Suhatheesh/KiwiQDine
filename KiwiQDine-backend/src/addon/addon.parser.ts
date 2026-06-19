import { MenuParser } from '../menu/menu.parser';
import { AuditParser } from '../audit';
import { Addon } from './addon';
import { IAddonResponseDTO } from './addon-response.dto';

export class AddonParser {
  static createAddonResponse(addon: Addon, menuAddons: any[] = []): IAddonResponseDTO {
    const { name, description, audit, id, quantity, restaurantId, unitPrice, image } = addon;

    // Extract menu items from menuAddons junction table
    const menus = menuAddons
      .filter(ma => ma.menu) // Filter out any null menus
      .map(ma => MenuParser.createMenuResponse(ma.menu));

    const auditData = audit ? AuditParser.createAuditResponse(audit) : {
      auditCreatedDateTime: '',
      auditCreatedBy: '',
    };

    return {
      id,
      name,
      description,
      quantity,
      unitPrice,
      restaurantId,
      image,
      menus,
      ...auditData,
    };
  }

  static createAddonsResponse(addons: Addon[], menuAddonsMap: Map<string, any[]> = new Map()): IAddonResponseDTO[] {
    return addons.map((addon) => {
      const menuAddons = menuAddonsMap.get(addon.id) || [];
      return this.createAddonResponse(addon, menuAddons);
    });
  }
}
