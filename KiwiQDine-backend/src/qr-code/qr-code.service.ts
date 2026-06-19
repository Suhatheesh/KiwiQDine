import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { QRCode as QRCodeEntity, QRCodeType, QRCodeStatus } from '../infrastructure/database/entities';
import { Restaurant } from '../infrastructure/database/entities';
import { CreateQRCodeDto } from './dto/qr-code.dto';
import { PaginationDto, PaginationResponse } from '../shared/dto/pagination.dto';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class QRCodeService {
  constructor(
    @InjectRepository(QRCodeEntity)
    private qrCodeRepository: Repository<QRCodeEntity>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    private readonly subscriptionService: SubscriptionService,
    private configService: ConfigService,
  ) { }

  async generateQRCode(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        width: parseInt(this.configService.get<string>('QR_CODE_SIZE', '200')),
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataURL;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  async createQRCode(createQRCodeDto: CreateQRCodeDto): Promise<QRCodeEntity> {
    const { type, restaurantId, name, description } = createQRCodeDto;

    // Check subscription limits
    const canCreate = await this.subscriptionService.canCreateQRCode(restaurantId);
    if (!canCreate.allowed) {
      throw new BadRequestException(canCreate.reason);
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // First, create the QR code entity without the image
    const qrCodeEntity = this.qrCodeRepository.create({
      qrUrl: null, // Will be set after ID is generated
      type,
      name,
      description,
      restaurantId,
      status: QRCodeStatus.ACTIVE,
    });

    // Save to get the generated ID
    const savedQRCode = await this.qrCodeRepository.save(qrCodeEntity);

    // Now generate QR code URL with the QR code ID pointing to the menu endpoint
    const qrCodeData = `${this.configService.get<string>('QR_CODE_BASE_URL')}/customer-portal/qr/${savedQRCode.id}/menu`;

    // Generate QR code image
    const qrCodeImage = await this.generateQRCode(qrCodeData);

    // Update with the generated image
    savedQRCode.qrUrl = qrCodeImage;

    // Update order usage qrCount and overageQRCount
    if (createQRCodeDto.restaurantId) {
      await this.subscriptionService.incrementOrderUsageQRCodeCount(createQRCodeDto.restaurantId);
    }

    return this.qrCodeRepository.save(savedQRCode);
  }

  async findAll(pagination: PaginationDto = { page: 1, limit: 10 }): Promise<PaginationResponse<QRCodeEntity>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.qrCodeRepository.findAndCount({
      relations: ['restaurant'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByTenantId(tenantId: string, pagination: PaginationDto = { page: 1, limit: 10 }): Promise<PaginationResponse<QRCodeEntity>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Get all QR codes for restaurants belonging to this tenant
    const [data, total] = await this.qrCodeRepository
      .createQueryBuilder('qrCode')
      .leftJoinAndSelect('qrCode.restaurant', 'restaurant')
      .where('restaurant.tenantId = :tenantId', { tenantId })
      .orderBy('qrCode.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByRestaurantId(restaurantId: string, pagination: PaginationDto = { page: 1, limit: 10 }): Promise<PaginationResponse<QRCodeEntity>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Get all QR codes for a specific restaurant
    const [data, total] = await this.qrCodeRepository.findAndCount({
      where: { restaurantId },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<QRCodeEntity> {
    const qrCode = await this.qrCodeRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    return qrCode;
  }

  async findByCode(code: string): Promise<QRCodeEntity> {
    // Note: QRCode entity now uses qrUrl, not code
    // This method may need to be updated or removed based on requirements
    const qrCode = await this.qrCodeRepository.findOne({
      where: { id: code },
      relations: ['restaurant'],
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    return qrCode;
  }

  async updateStatus(id: string, status: QRCodeStatus): Promise<QRCodeEntity> {
    const qrCode = await this.findOne(id);
    qrCode.status = status;
    return this.qrCodeRepository.save(qrCode);
  }

  async remove(id: string): Promise<void> {
    const qrCode = await this.findOne(id);
    await this.qrCodeRepository.remove(qrCode);
  }

  private generateUniqueCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `QR_${timestamp}_${random}`.toUpperCase();
  }

  async deleteQRCode(id: string): Promise<void> {
    const qrCode = await this.findOne(id);
    const restaurantId = qrCode.restaurantId;

    await this.qrCodeRepository.remove(qrCode);

    // Reduce qr count in order usage only if qr was created more than 5 days ago
    if (restaurantId && qrCode.createdAt) {
      const now = new Date();
      const createdAt = new Date(qrCode.createdAt);
      const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 5) {
        await this.subscriptionService.decrementOrderUsageQRCodeCount(restaurantId);
      }
    }
  }
}
