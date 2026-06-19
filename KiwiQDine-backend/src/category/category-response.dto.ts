
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IAudit } from './../infrastructure/database/mongoDB/base-document.interface';
export interface ICategoryResponseDTO extends IAudit {
  id: string;
  name: string;
  code: string;
  description?: string;
  image?: string;
  imageKey?: string;
  restaurantId: string;
  displayOrder: number;
  isShowcase: boolean;
  isActive: boolean;
  itemCount?: number;
}

export class CategoryResponseDoc {
  @ApiProperty({ description: 'Unique identifier for the category', example: 'category-uuid' })
  id: string;

  @ApiProperty({ description: 'Display name of the category', example: 'Starters' })
  name: string;

  @ApiProperty({ description: 'Automatically generated code derived from the name', example: 'STARTERS' })
  code: string;

  @ApiProperty({ description: 'Restaurant identifier this category belongs to', example: 'restaurant-uuid' })
  restaurantId: string;

  @ApiPropertyOptional({ description: 'Optional category description', example: 'Light appetizers to begin the meal.' })
  description?: string;

  @ApiPropertyOptional({ description: 'Optional category image URL', example: 'https://example.com/category-image.jpg' })
  image?: string;

  @ApiPropertyOptional({ description: 'Optional S3 key for the category image', example: 'categories/restaurant-id/image-name.jpg' })
  imageKey?: string;

  @ApiProperty({ description: 'Order for category display (lower = higher priority)', example: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Whether the category is featured/showcase', example: false })
  isShowcase: boolean;

  @ApiProperty({ description: 'Whether the category is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp when the category was created', example: '2024-03-24T10:15:30.000Z' })
  auditCreatedDateTime: string;

  @ApiProperty({ description: 'Identifier of the user who created the category', example: 'admin-user' })
  auditCreatedBy: string;

  @ApiPropertyOptional({ description: 'Identifier of the user who last modified the category', example: 'manager-12' })
  auditModifiedBy?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp of the last update', example: '2024-04-15T12:00:00.000Z' })
  auditModifiedDateTime?: string;

  @ApiPropertyOptional({ description: 'Identifier of the user who deleted the category', example: 'system-user' })
  auditDeletedBy?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp when the category was deleted', example: '2024-04-20T08:30:00.000Z' })
  auditDeletedDateTime?: string;

  @ApiPropertyOptional({ description: 'Number of menu items in this category', example: 5 })
  itemCount?: number;
}

export class CategoryResultDoc {
  @ApiProperty({ description: 'Indicates whether the operation succeeded', example: true })
  isSuccess: boolean;

  @ApiPropertyOptional({ description: 'Payload containing category information', type: () => CategoryResponseDoc })
  data?: CategoryResponseDoc;

  @ApiPropertyOptional({ description: 'Additional message describing the outcome', example: 'Category created successfully.' })
  message?: string;

  @ApiPropertyOptional({ description: 'HTTP error code provided when the request fails', example: 400 })
  errorCode?: number;
}

export class CategoryListResultDoc {
  @ApiProperty({ description: 'Indicates whether the operation succeeded', example: true })
  isSuccess: boolean;

  @ApiPropertyOptional({ description: 'Collection of categories', type: () => [CategoryResponseDoc] })
  data?: CategoryResponseDoc[];

  @ApiPropertyOptional({ description: 'Additional message describing the outcome', example: 'Categories retrieved successfully.' })
  message?: string;

  @ApiPropertyOptional({ description: 'HTTP error code provided when the request fails', example: 400 })
  errorCode?: number;
}

export class CategoryBooleanResultDoc {
  @ApiProperty({ description: 'Indicates whether the operation succeeded', example: true })
  isSuccess: boolean;

  @ApiPropertyOptional({ description: 'Boolean flag indicating the deletion result', example: true })
  data?: boolean;

  @ApiPropertyOptional({ description: 'Additional message describing the outcome', example: 'Categories deleted successfully.' })
  message?: string;

  @ApiPropertyOptional({ description: 'HTTP error code provided when the request fails', example: 400 })
  errorCode?: number;
}
