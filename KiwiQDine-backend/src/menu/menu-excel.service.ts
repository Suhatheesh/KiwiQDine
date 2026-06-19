import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Menu, Restaurant, Category } from '../infrastructure/database/entities';

@Injectable()
export class MenuExcelService {
  private readonly logger = new Logger(MenuExcelService.name);

  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) { }

  /**
   * Export menus to Excel
   * @param restaurantId Restaurant ID
   * @returns Excel workbook buffer
   */
  async exportMenusToExcel(restaurantId: string): Promise<Buffer> {
    const restaurant = await this.restaurantRepository.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const menus = await this.menuRepository.find({
      where: { restaurantId },
      relations: ['category'],
      order: { name: 'ASC' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Menus');

    // 1. Define Column Keys and Widths (DO NOT set 'header' here to avoid auto-injection issues)
    const columns = [
      { key: 'name', width: 35 },
      { key: 'category', width: 25 },
      { key: 'description', width: 50 },
      { key: 'price', width: 15 },
      { key: 'discount', width: 15 },
      { key: 'quantityAvailable', width: 20 },
      { key: 'isAvailable', width: 15 },
      { key: 'preparationTime', width: 25 },
      { key: 'availableFrom', width: 18 },
      { key: 'availableTo', width: 18 },
      { key: 'note', width: 35 },
    ];
    worksheet.columns = columns;

    // 2. Add Header Content Manually for Row 1
    const headers = [
      'Menu Name', 'Category', 'Description', 'Price', 'Discount',
      'Quantity Available', 'Is Available', 'Preparation Time (min)',
      'Available From', 'Available To', 'Note'
    ];

    const headerRow = worksheet.getRow(1);
    headers.forEach((h, i) => {
      headerRow.getCell(i + 1).value = h;
    });

    // 3. Style Header Row
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // 4. Add Menu Data
    menus.forEach((menu) => {
      const rowData = {
        name: menu.name ?? '',
        category: menu.category?.name ?? '',
        description: menu.description ?? '',
        price: menu.price !== null && menu.price !== undefined ? parseFloat(menu.price.toString()) : 0,
        discount: menu.discount !== null && menu.discount !== undefined ? parseFloat(menu.discount.toString()) : 0,
        quantityAvailable: menu.quantityAvailable ?? '',
        isAvailable: menu.isAvailable ? 'Yes' : 'No',
        preparationTime: menu.preparationTime ?? '',
        availableFrom: menu.availableFrom ?? '',
        availableTo: menu.availableTo ?? '',
        note: menu.note ?? '',
      };

      const row = worksheet.addRow(rowData);

      // Formatting
      row.getCell(4).numFmt = '#,##0.00';
      row.getCell(5).numFmt = '#,##0.00';
      row.alignment = { vertical: 'middle' };
    });

    // 5. Finalize Sheet
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as any);
  }

  /**
   * Export categories to Excel
   * @param restaurantId Restaurant ID
   * @returns Excel workbook buffer
   */
  async exportCategoriesToExcel(restaurantId: string): Promise<Buffer> {
    const restaurant = await this.restaurantRepository.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const categories = await this.categoryRepository.find({
      where: { restaurantId },
      order: { name: 'ASC' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Categories');

    // 1. Column structure
    const columns = [
      { key: 'name', width: 40 },
      { key: 'description', width: 60 },
    ];
    worksheet.columns = columns;

    // 2. Manual Header
    const headers = ['Category Name', 'Description'];
    const headerRow = worksheet.getRow(1);
    headers.forEach((h, i) => {
      headerRow.getCell(i + 1).value = h;
    });

    // 3. Styling
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // 4. Data
    categories.forEach((category) => {
      worksheet.addRow({
        name: category.name ?? '',
        description: category.description ?? '',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as any);
  }

  /**
   * Import menus from Excel
   * @param restaurantId Restaurant ID
   * @param fileBuffer Excel file buffer
   * @param userId User ID performing the import
   * @returns Import result with success/error counts
   */
  async importMenusFromExcel(
    restaurantId: string,
    fileBuffer: Buffer,
    userId?: string,
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    // Verify restaurant exists
    const restaurant = await this.restaurantRepository.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Load workbook with better error handling
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(fileBuffer as any);
    } catch (error) {
      throw new BadRequestException(
        'Invalid Excel file format. Please ensure the file is a valid .xlsx file and not corrupted.'
      );
    }

    const worksheet = workbook.getWorksheet('Menus');

    if (!worksheet) {
      throw new BadRequestException(
        'Worksheet "Menus" not found in the Excel file. Please use the template provided or ensure the sheet is named "Menus".'
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // Get all categories for this restaurant
    const categories = await this.categoryRepository.find({ where: { restaurantId } });
    if (categories.length === 0) {
      throw new BadRequestException(
        'No categories found for this restaurant. Please create categories first before importing menus.'
      );
    }
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase().trim(), c]));

    // Process rows (skip header)
    const totalRows = worksheet.rowCount;
    if (totalRows <= 1) {
      throw new BadRequestException('Excel file is empty. Please add menu data to import.');
    }

    for (let rowNumber = 2; rowNumber <= totalRows; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      // Skip completely empty rows
      if (!row.hasValues) {
        continue;
      }

      try {
        // Helper function to safely get cell value
        const getCellValue = (cellNumber: number): string => {
          const cell = row.getCell(cellNumber);
          if (!cell || cell.value === null || cell.value === undefined) {
            return '';
          }
          // Handle rich text
          if (typeof cell.value === 'object' && 'richText' in cell.value) {
            return cell.value.richText.map((t: any) => t.text).join('');
          }
          return cell.value.toString().trim();
        };

        const name = getCellValue(1);
        const categoryName = getCellValue(2);
        const description = getCellValue(3);
        const priceStr = getCellValue(4);
        const discountStr = getCellValue(5);
        const quantityStr = getCellValue(6);
        const isAvailableStr = getCellValue(7);
        const prepTimeStr = getCellValue(8);
        const availableFrom = getCellValue(9);
        const availableTo = getCellValue(10);
        const note = getCellValue(11);

        // Validate required fields
        if (!name) {
          results.errors.push({ row: rowNumber, error: 'Menu name is required (Column A)' });
          results.failed++;
          continue;
        }

        if (!categoryName) {
          results.errors.push({ row: rowNumber, error: 'Category is required (Column B)' });
          results.failed++;
          continue;
        }

        // Parse and validate price
        const price = parseFloat(priceStr || '0');
        if (isNaN(price) || price < 0) {
          results.errors.push({ row: rowNumber, error: `Invalid price "${priceStr}" (Column D)` });
          results.failed++;
          continue;
        }

        // Parse discount
        const discount = parseFloat(discountStr || '0');
        if (isNaN(discount) || discount < 0) {
          results.errors.push({ row: rowNumber, error: `Invalid discount "${discountStr}" (Column E)` });
          results.failed++;
          continue;
        }

        // Parse quantity
        const quantityAvailable = quantityStr ? parseInt(quantityStr) : null;
        if (quantityStr && (isNaN(quantityAvailable!) || quantityAvailable! < 0)) {
          results.errors.push({ row: rowNumber, error: `Invalid quantity "${quantityStr}" (Column F)` });
          results.failed++;
          continue;
        }

        // Parse availability
        const isAvailable = isAvailableStr.toLowerCase() === 'yes' || isAvailableStr === '1' || isAvailableStr.toLowerCase() === 'true';

        // Parse preparation time
        const preparationTime = prepTimeStr ? parseInt(prepTimeStr) : null;
        if (prepTimeStr && (isNaN(preparationTime!) || preparationTime! < 0)) {
          results.errors.push({ row: rowNumber, error: `Invalid preparation time "${prepTimeStr}" (Column H)` });
          results.failed++;
          continue;
        }

        // Find category
        const category = categoryMap.get(categoryName.toLowerCase().trim());
        if (!category) {
          results.errors.push({
            row: rowNumber,
            error: `Category "${categoryName}" not found. Available categories: ${Array.from(categoryMap.keys()).join(', ')}`
          });
          results.failed++;
          continue;
        }

        // Check if menu already exists
        let menu = await this.menuRepository.findOne({
          where: { name, restaurantId, categoryId: category.id },
        });

        if (menu) {
          // Update existing menu
          menu.description = description;
          menu.price = price;
          menu.discount = discount;
          menu.quantityAvailable = quantityAvailable;
          menu.isAvailable = isAvailable;
          menu.preparationTime = preparationTime;
          menu.availableFrom = availableFrom || null;
          menu.availableTo = availableTo || null;
          menu.note = note;
        } else {
          // Create new menu
          menu = this.menuRepository.create({
            name,
            categoryId: category.id,
            restaurantId,
            description,
            price,
            discount,
            quantityAvailable,
            isAvailable,
            preparationTime,
            availableFrom: availableFrom || null,
            availableTo: availableTo || null,
            note,
          });
        }

        await this.menuRepository.save(menu);
        results.success++;
      } catch (error) {
        this.logger.error(`Error importing row ${rowNumber}:`, error);
        results.errors.push({ row: rowNumber, error: error.message || 'Unknown error occurred' });
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Import categories from Excel
   * @param restaurantId Restaurant ID
   * @param fileBuffer Excel file buffer
   * @returns Import result with success/error counts
   */
  async importCategoriesFromExcel(
    restaurantId: string,
    fileBuffer: Buffer,
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    // Verify restaurant exists
    const restaurant = await this.restaurantRepository.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Load workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    const worksheet = workbook.getWorksheet('Categories');

    if (!worksheet) {
      throw new BadRequestException('Worksheet "Categories" not found in the Excel file');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // Process rows (skip header)
    const rows = worksheet.getRows(2, worksheet.rowCount - 1) || [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        const name = row.getCell(1).value?.toString().trim();
        const description = row.getCell(2).value?.toString().trim() || '';

        // Validate required fields
        if (!name) {
          results.errors.push({ row: rowNumber, error: 'Category name is required' });
          results.failed++;
          continue;
        }

        // Check if category already exists
        let category = await this.categoryRepository.findOne({
          where: { name, restaurantId },
        });

        if (category) {
          // Update existing category
          category.description = description;
        } else {
          // Create new category
          category = this.categoryRepository.create({
            name,
            restaurantId,
            description,
          });
        }

        await this.categoryRepository.save(category);
        results.success++;
      } catch (error) {
        this.logger.error(`Error importing category row ${rowNumber}:`, error);
        results.errors.push({ row: rowNumber, error: error.message });
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Generate Excel template for menu import
   * @returns Excel template buffer
   */
  async generateMenuTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DineFlow';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Menus');

    // Define column headers and keys explicitly
    const columnDefinitions = [
      { header: 'Menu Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Discount', key: 'discount', width: 15 },
      { header: 'Quantity Available', key: 'quantityAvailable', width: 20 },
      { header: 'Is Available', key: 'isAvailable', width: 15 },
      { header: 'Preparation Time (min)', key: 'preparationTime', width: 25 },
      { header: 'Available From', key: 'availableFrom', width: 18 },
      { header: 'Available To', key: 'availableTo', width: 18 },
      { header: 'Note', key: 'note', width: 35 },
    ];

    worksheet.columns = columnDefinitions;

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.values = columnDefinitions.map(col => col.header);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add example row
    worksheet.addRow({
      name: 'Chicken Burger',
      category: 'Burgers',
      description: 'Grilled chicken with lettuce and tomato',
      price: 850,
      discount: 50,
      quantityAvailable: 100,
      isAvailable: 'Yes',
      preparationTime: 15,
      availableFrom: '11:00',
      availableTo: '22:00',
      note: 'Spicy option available',
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as any);
  }

  /**
   * Generate Excel template for category import
   * @returns Excel template buffer
   */
  async generateCategoryTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DineFlow';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Categories');

    // Define column headers and keys explicitly
    const columnDefinitions = [
      { header: 'Category Name', key: 'name', width: 35 },
      { header: 'Description', key: 'description', width: 55 },
    ];

    worksheet.columns = columnDefinitions;

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.values = columnDefinitions.map(col => col.header);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add example row
    worksheet.addRow({
      name: 'Burgers',
      description: 'All types of burgers',
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as any);
  }
}
