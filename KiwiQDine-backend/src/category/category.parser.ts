import { Injectable } from '@nestjs/common';
import { AuditParser } from './../audit/audit.parser';
import { Category } from './category';
import { ICategoryResponseDTO } from './category-response.dto';

@Injectable()
export class CategoryParser {
  static createCategoryResponse(category: Category, itemCount?: number): ICategoryResponseDTO {
    const { name, description, code, id, image, imageKey, restaurantId, displayOrder, isShowcase, isActive } = category;
    const categoryResponse: ICategoryResponseDTO = {
      id,
      name,
      description,
      code,
      image,
      imageKey,
      restaurantId,
      displayOrder,
      isShowcase,
      isActive,
      itemCount,
      ...AuditParser.createAuditResponse(category.audit),
    };
    return categoryResponse;
  }

  static createCategoriesResponse(categories: Category[], itemCounts?: Record<string, number>): ICategoryResponseDTO[] {
    return categories.map((category) => CategoryParser.createCategoryResponse(category, itemCounts ? itemCounts[category.id] : undefined));
  }
}
