import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge, Restaurant } from '../infrastructure/database/entities';
import { CreateBadgeDto, UpdateBadgeDto } from './dto/badge.dto';

// Default system badges that will be created for each restaurant
// Comprehensive list covering promotions, dietary, allergens, cuisine, and special indicators
const SYSTEM_BADGES = [
  // ============ PROMOTIONAL BADGES ============
  {
    code: 'new',
    name: 'New',
    description: 'Recently added item',
    icon: 'sparkle',
    backgroundColor: '#4CAF50',
    textColor: '#FFFFFF',
    displayOrder: 1,
  },
  {
    code: 'bestseller',
    name: 'Bestseller',
    description: 'Top selling item',
    icon: 'fire',
    backgroundColor: '#FF9800',
    textColor: '#FFFFFF',
    displayOrder: 2,
  },
  {
    code: 'popular',
    name: 'Popular',
    description: 'Customer favorite',
    icon: 'trending-up',
    backgroundColor: '#2196F3',
    textColor: '#FFFFFF',
    displayOrder: 3,
  },
  {
    code: 'chef_special',
    name: "Chef's Special",
    description: "Chef's recommendation",
    icon: 'chef-hat',
    backgroundColor: '#9C27B0',
    textColor: '#FFFFFF',
    displayOrder: 4,
  },
  {
    code: 'signature',
    name: 'Signature',
    description: 'House signature dish',
    icon: 'award',
    backgroundColor: '#FFD700',
    textColor: '#000000',
    displayOrder: 5,
  },
  {
    code: 'recommended',
    name: 'Recommended',
    description: 'Highly recommended',
    icon: 'thumbs-up',
    backgroundColor: '#00BCD4',
    textColor: '#FFFFFF',
    displayOrder: 6,
  },
  {
    code: 'limited',
    name: 'Limited Time',
    description: 'Limited time offer',
    icon: 'clock',
    backgroundColor: '#E91E63',
    textColor: '#FFFFFF',
    displayOrder: 7,
  },
  {
    code: 'seasonal',
    name: 'Seasonal',
    description: 'Seasonal special',
    icon: 'calendar',
    backgroundColor: '#FF7043',
    textColor: '#FFFFFF',
    displayOrder: 8,
  },
  {
    code: 'discount',
    name: 'On Sale',
    description: 'Discounted item',
    icon: 'tag',
    backgroundColor: '#F44336',
    textColor: '#FFFFFF',
    displayOrder: 9,
  },
  {
    code: 'combo',
    name: 'Combo Deal',
    description: 'Combo/bundle offer',
    icon: 'package',
    backgroundColor: '#673AB7',
    textColor: '#FFFFFF',
    displayOrder: 10,
  },

  // ============ DIETARY BADGES ============
  {
    code: 'vegetarian',
    name: 'Vegetarian',
    description: 'No meat or fish',
    icon: 'leaf',
    backgroundColor: '#8BC34A',
    textColor: '#FFFFFF',
    displayOrder: 11,
  },
  {
    code: 'vegan',
    name: 'Vegan',
    description: 'No animal products',
    icon: 'seedling',
    backgroundColor: '#4CAF50',
    textColor: '#FFFFFF',
    displayOrder: 12,
  },
  {
    code: 'pescatarian',
    name: 'Pescatarian',
    description: 'Fish/seafood, no meat',
    icon: 'fish',
    backgroundColor: '#03A9F4',
    textColor: '#FFFFFF',
    displayOrder: 13,
  },
  {
    code: 'keto',
    name: 'Keto',
    description: 'Keto-friendly, low carb',
    icon: 'zap',
    backgroundColor: '#795548',
    textColor: '#FFFFFF',
    displayOrder: 14,
  },
  {
    code: 'low_carb',
    name: 'Low Carb',
    description: 'Low carbohydrate',
    icon: 'minus-circle',
    backgroundColor: '#607D8B',
    textColor: '#FFFFFF',
    displayOrder: 15,
  },
  {
    code: 'low_calorie',
    name: 'Low Calorie',
    description: 'Under 500 calories',
    icon: 'activity',
    backgroundColor: '#009688',
    textColor: '#FFFFFF',
    displayOrder: 16,
  },
  {
    code: 'high_protein',
    name: 'High Protein',
    description: 'High protein content',
    icon: 'dumbbell',
    backgroundColor: '#3F51B5',
    textColor: '#FFFFFF',
    displayOrder: 17,
  },
  {
    code: 'organic',
    name: 'Organic',
    description: 'Made with organic ingredients',
    icon: 'leaf',
    backgroundColor: '#689F38',
    textColor: '#FFFFFF',
    displayOrder: 18,
  },
  {
    code: 'healthy',
    name: 'Healthy Choice',
    description: 'Nutritious and balanced',
    icon: 'heart',
    backgroundColor: '#E91E63',
    textColor: '#FFFFFF',
    displayOrder: 19,
  },

  // ============ ALLERGEN BADGES ============
  {
    code: 'gluten_free',
    name: 'Gluten Free',
    description: 'No gluten/wheat',
    icon: 'wheat-off',
    backgroundColor: '#FF5722',
    textColor: '#FFFFFF',
    displayOrder: 20,
  },
  {
    code: 'dairy_free',
    name: 'Dairy Free',
    description: 'No dairy products',
    icon: 'milk-off',
    backgroundColor: '#9E9E9E',
    textColor: '#FFFFFF',
    displayOrder: 21,
  },
  {
    code: 'nut_free',
    name: 'Nut Free',
    description: 'No nuts',
    icon: 'x-circle',
    backgroundColor: '#795548',
    textColor: '#FFFFFF',
    displayOrder: 22,
  },
  {
    code: 'egg_free',
    name: 'Egg Free',
    description: 'No eggs',
    icon: 'egg-off',
    backgroundColor: '#FFC107',
    textColor: '#000000',
    displayOrder: 23,
  },
  {
    code: 'soy_free',
    name: 'Soy Free',
    description: 'No soy products',
    icon: 'x-circle',
    backgroundColor: '#8D6E63',
    textColor: '#FFFFFF',
    displayOrder: 24,
  },
  {
    code: 'shellfish_free',
    name: 'Shellfish Free',
    description: 'No shellfish',
    icon: 'shell-off',
    backgroundColor: '#455A64',
    textColor: '#FFFFFF',
    displayOrder: 25,
  },
  {
    code: 'contains_nuts',
    name: 'Contains Nuts',
    description: 'Contains tree nuts or peanuts',
    icon: 'alert-triangle',
    backgroundColor: '#D84315',
    textColor: '#FFFFFF',
    displayOrder: 26,
  },
  {
    code: 'contains_dairy',
    name: 'Contains Dairy',
    description: 'Contains milk products',
    icon: 'info',
    backgroundColor: '#5D4037',
    textColor: '#FFFFFF',
    displayOrder: 27,
  },
  {
    code: 'contains_gluten',
    name: 'Contains Gluten',
    description: 'Contains wheat/gluten',
    icon: 'info',
    backgroundColor: '#6D4C41',
    textColor: '#FFFFFF',
    displayOrder: 28,
  },

  // ============ SPICE LEVEL BADGES ============
  {
    code: 'mild',
    name: 'Mild',
    description: 'Mild spice level',
    icon: 'flame',
    backgroundColor: '#FFEB3B',
    textColor: '#000000',
    displayOrder: 29,
  },
  {
    code: 'medium_spicy',
    name: 'Medium',
    description: 'Medium spice level',
    icon: 'flame',
    backgroundColor: '#FF9800',
    textColor: '#FFFFFF',
    displayOrder: 30,
  },
  {
    code: 'spicy',
    name: 'Spicy',
    description: 'Hot and spicy',
    icon: 'pepper',
    backgroundColor: '#F44336',
    textColor: '#FFFFFF',
    displayOrder: 31,
  },
  {
    code: 'extra_spicy',
    name: 'Extra Spicy',
    description: 'Very hot - not for the faint-hearted!',
    icon: 'flame',
    backgroundColor: '#B71C1C',
    textColor: '#FFFFFF',
    displayOrder: 32,
  },

  // ============ RELIGIOUS/CULTURAL BADGES ============
  {
    code: 'halal',
    name: 'Halal',
    description: 'Halal certified',
    icon: 'check-circle',
    backgroundColor: '#1B5E20',
    textColor: '#FFFFFF',
    displayOrder: 33,
  },
  {
    code: 'kosher',
    name: 'Kosher',
    description: 'Kosher certified',
    icon: 'check-circle',
    backgroundColor: '#1A237E',
    textColor: '#FFFFFF',
    displayOrder: 34,
  },
  {
    code: 'jain',
    name: 'Jain',
    description: 'Jain diet friendly (no root vegetables)',
    icon: 'check-circle',
    backgroundColor: '#F57F17',
    textColor: '#FFFFFF',
    displayOrder: 35,
  },

  // ============ CUISINE/ORIGIN BADGES ============
  {
    code: 'local_favorite',
    name: 'Local Favorite',
    description: 'Local specialty',
    icon: 'map-pin',
    backgroundColor: '#00796B',
    textColor: '#FFFFFF',
    displayOrder: 36,
  },
  {
    code: 'authentic',
    name: 'Authentic',
    description: 'Traditional authentic recipe',
    icon: 'award',
    backgroundColor: '#5D4037',
    textColor: '#FFFFFF',
    displayOrder: 37,
  },
  {
    code: 'fusion',
    name: 'Fusion',
    description: 'Fusion cuisine',
    icon: 'shuffle',
    backgroundColor: '#7B1FA2',
    textColor: '#FFFFFF',
    displayOrder: 38,
  },
  {
    code: 'homemade',
    name: 'Homemade',
    description: 'Made from scratch in-house',
    icon: 'home',
    backgroundColor: '#8D6E63',
    textColor: '#FFFFFF',
    displayOrder: 39,
  },

  // ============ PORTION/SIZE BADGES ============
  {
    code: 'shareable',
    name: 'Shareable',
    description: 'Great for sharing',
    icon: 'users',
    backgroundColor: '#00ACC1',
    textColor: '#FFFFFF',
    displayOrder: 40,
  },
  {
    code: 'family_size',
    name: 'Family Size',
    description: 'Serves 4-6 people',
    icon: 'users',
    backgroundColor: '#5C6BC0',
    textColor: '#FFFFFF',
    displayOrder: 41,
  },
  {
    code: 'small_portion',
    name: 'Small Portion',
    description: 'Perfect for light appetite',
    icon: 'minimize',
    backgroundColor: '#78909C',
    textColor: '#FFFFFF',
    displayOrder: 42,
  },
  {
    code: 'large_portion',
    name: 'Large Portion',
    description: 'Extra generous serving',
    icon: 'maximize',
    backgroundColor: '#546E7A',
    textColor: '#FFFFFF',
    displayOrder: 43,
  },

  // ============ PREPARATION BADGES ============
  {
    code: 'quick_prep',
    name: 'Quick Prep',
    description: 'Ready in under 10 minutes',
    icon: 'zap',
    backgroundColor: '#FFC107',
    textColor: '#000000',
    displayOrder: 44,
  },
  {
    code: 'slow_cooked',
    name: 'Slow Cooked',
    description: 'Slow cooked for rich flavor',
    icon: 'clock',
    backgroundColor: '#795548',
    textColor: '#FFFFFF',
    displayOrder: 45,
  },
  {
    code: 'grilled',
    name: 'Grilled',
    description: 'Flame grilled',
    icon: 'flame',
    backgroundColor: '#E65100',
    textColor: '#FFFFFF',
    displayOrder: 46,
  },
  {
    code: 'fried',
    name: 'Fried',
    description: 'Deep fried',
    icon: 'droplet',
    backgroundColor: '#F9A825',
    textColor: '#000000',
    displayOrder: 47,
  },
  {
    code: 'steamed',
    name: 'Steamed',
    description: 'Steamed cooking method',
    icon: 'cloud',
    backgroundColor: '#B0BEC5',
    textColor: '#000000',
    displayOrder: 48,
  },
  {
    code: 'raw',
    name: 'Raw',
    description: 'Contains raw ingredients',
    icon: 'alert-circle',
    backgroundColor: '#607D8B',
    textColor: '#FFFFFF',
    displayOrder: 49,
  },

  // ============ KIDS & SPECIAL BADGES ============
  {
    code: 'kids_favorite',
    name: 'Kids Favorite',
    description: 'Perfect for children',
    icon: 'smile',
    backgroundColor: '#FF4081',
    textColor: '#FFFFFF',
    displayOrder: 50,
  },
  {
    code: 'must_try',
    name: 'Must Try',
    description: 'Highly recommended experience',
    icon: 'star',
    backgroundColor: '#FFD700',
    textColor: '#000000',
    displayOrder: 51,
  },
  {
    code: 'award_winning',
    name: 'Award Winning',
    description: 'Award winning dish',
    icon: 'trophy',
    backgroundColor: '#FFC400',
    textColor: '#000000',
    displayOrder: 52,
  },
  {
    code: 'breakfast',
    name: 'Breakfast',
    description: 'Available for breakfast',
    icon: 'sunrise',
    backgroundColor: '#FFAB00',
    textColor: '#000000',
    displayOrder: 53,
  },
  {
    code: 'lunch_special',
    name: 'Lunch Special',
    description: 'Lunch time special',
    icon: 'sun',
    backgroundColor: '#FF6F00',
    textColor: '#FFFFFF',
    displayOrder: 54,
  },
  {
    code: 'dinner_special',
    name: 'Dinner Special',
    description: 'Dinner time special',
    icon: 'moon',
    backgroundColor: '#311B92',
    textColor: '#FFFFFF',
    displayOrder: 55,
  },
  {
    code: 'late_night',
    name: 'Late Night',
    description: 'Available late night',
    icon: 'moon',
    backgroundColor: '#1A237E',
    textColor: '#FFFFFF',
    displayOrder: 56,
  },
];

@Injectable()
export class BadgeService {
  constructor(
    @InjectRepository(Badge)
    private badgeRepository: Repository<Badge>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
  ) {}

  /**
   * Initialize system badges for a restaurant
   * Called when restaurant is created or when badges are first accessed
   */
  async initializeSystemBadges(restaurantId: string): Promise<Badge[]> {
    const existingBadges = await this.badgeRepository.find({
      where: { restaurantId, isSystem: true },
    });

    if (existingBadges.length > 0) {
      return existingBadges;
    }

    const systemBadges = SYSTEM_BADGES.map((badge) =>
      this.badgeRepository.create({
        ...badge,
        restaurantId,
        isSystem: true,
        isActive: true,
      }),
    );

    return this.badgeRepository.save(systemBadges);
  }

  /**
   * Get all badges for a restaurant (system + custom)
   */
  async findAll(restaurantId: string): Promise<Badge[]> {
    // Initialize system badges if needed
    await this.initializeSystemBadges(restaurantId);

    return this.badgeRepository.find({
      where: { restaurantId },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get active badges only
   */
  async findActive(restaurantId: string): Promise<Badge[]> {
    await this.initializeSystemBadges(restaurantId);

    return this.badgeRepository.find({
      where: { restaurantId, isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get a single badge
   */
  async findOne(id: string, restaurantId: string): Promise<Badge> {
    const badge = await this.badgeRepository.findOne({
      where: { id, restaurantId },
    });

    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    return badge;
  }

  /**
   * Get badge by code
   */
  async findByCode(code: string, restaurantId: string): Promise<Badge | null> {
    return this.badgeRepository.findOne({
      where: { code, restaurantId },
    });
  }

  /**
   * Create a custom badge
   */
  async create(restaurantId: string, dto: CreateBadgeDto): Promise<Badge> {
    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Check for duplicate code
    const existing = await this.findByCode(dto.code, restaurantId);
    if (existing) {
      throw new ConflictException(`Badge with code "${dto.code}" already exists`);
    }

    const badge = this.badgeRepository.create({
      ...dto,
      restaurantId,
      isSystem: false,
      isActive: dto.isActive ?? true,
    });

    return this.badgeRepository.save(badge);
  }

  /**
   * Update a badge
   */
  async update(id: string, restaurantId: string, dto: UpdateBadgeDto): Promise<Badge> {
    const badge = await this.findOne(id, restaurantId);

    // System badges can only have limited fields updated
    if (badge.isSystem) {
      // Only allow updating display properties, not code or isSystem
      if (dto.name !== undefined) badge.name = dto.name;
      if (dto.description !== undefined) badge.description = dto.description;
      if (dto.icon !== undefined) badge.icon = dto.icon;
      if (dto.backgroundColor !== undefined) badge.backgroundColor = dto.backgroundColor;
      if (dto.textColor !== undefined) badge.textColor = dto.textColor;
      if (dto.displayOrder !== undefined) badge.displayOrder = dto.displayOrder;
      if (dto.isActive !== undefined) badge.isActive = dto.isActive;
    } else {
      // Custom badges can be fully updated
      Object.assign(badge, dto);
    }

    return this.badgeRepository.save(badge);
  }

  /**
   * Delete a badge
   */
  async delete(id: string, restaurantId: string): Promise<void> {
    const badge = await this.findOne(id, restaurantId);

    if (badge.isSystem) {
      throw new BadRequestException('System badges cannot be deleted. You can deactivate them instead.');
    }

    await this.badgeRepository.remove(badge);
  }

  /**
   * Validate badge codes for a menu item
   * Returns valid badge codes, filtering out invalid ones
   */
  async validateBadgeCodes(codes: string[], restaurantId: string): Promise<string[]> {
    if (!codes || codes.length === 0) {
      return [];
    }

    const badges = await this.findActive(restaurantId);
    const validCodes = new Set(badges.map((b) => b.code));

    return codes.filter((code) => validCodes.has(code));
  }

  /**
   * Get badge details for codes
   * Returns badge details for display purposes
   */
  async getBadgeDetails(codes: string[], restaurantId: string): Promise<Badge[]> {
    if (!codes || codes.length === 0) {
      return [];
    }

    await this.initializeSystemBadges(restaurantId);

    return this.badgeRepository
      .createQueryBuilder('badge')
      .where('badge.restaurantId = :restaurantId', { restaurantId })
      .andWhere('badge.code IN (:...codes)', { codes })
      .andWhere('badge.isActive = :isActive', { isActive: true })
      .orderBy('badge.displayOrder', 'ASC')
      .getMany();
  }

  /**
   * Bulk update badge order
   */
  async updateOrder(
    restaurantId: string,
    badgeOrders: Array<{ id: string; displayOrder: number }>,
  ): Promise<Badge[]> {
    const badges = await this.badgeRepository.find({
      where: { restaurantId },
    });

    const badgeMap = new Map(badges.map((b) => [b.id, b]));

    for (const { id, displayOrder } of badgeOrders) {
      const badge = badgeMap.get(id);
      if (badge) {
        badge.displayOrder = displayOrder;
      }
    }

    return this.badgeRepository.save(Array.from(badgeMap.values()));
  }
}
