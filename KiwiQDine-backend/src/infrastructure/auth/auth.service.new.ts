import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus, OrderAction } from '../database/entities';
import { OrderActivityLogService } from '../../order-status/order-activity-log.service';
import { LoginDto, RegisterDto, PhoneLoginDto, VerifyOtpDto, RefreshTokenDto } from './dto/auth.dto';
import { AuthResponseDto, OtpResponseDto, TokenResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  // In-memory OTP storage (use Redis in production)
  private otpStore: Map<string, { code: string; expiresAt: Date }> = new Map();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly orderActivityLogService: OrderActivityLogService,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      relations: ['tenant', 'restaurant'],
    });

    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async validateUserById(id: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (user) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Super Admin can login without tenant restriction
    // Other roles must have a tenant (except if they are system-level users)
    if (user.role !== UserRole.SUPER_ADMIN && !user.tenantId) {
      throw new UnauthorizedException('User must be associated with a tenant');
    }

    // Check if user's restaurant is active (if user has a restaurant)
    if (user.restaurantId && user.restaurant) {
      if (user.restaurant.status === 'inactive') {
        throw new UnauthorizedException('Restaurant is archived. Please contact support.');
      }
      if (!user.restaurant.isActive) {
        throw new UnauthorizedException('Restaurant is not active. Please contact support.');
      }
    }

    // Update last login
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    const tokens = await this.generateTokens(user);

    // Log the login action
    await this.orderActivityLogService.logAction(null, OrderAction.LOGIN, user.id, `User logged in: ${user.email}`, null, {
      restaurantId: user.restaurantId,
      tenantId: user.tenantId,
    });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const normalizedEmail = registerDto.email.toLowerCase();

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: registerDto.name,
      role: registerDto.role,
      tenantId: registerDto.tenantId,
      phoneNumber: registerDto.phoneNumber || null,
      restaurantId: registerDto.restaurantId || null,

    });

    const savedUser = await this.userRepository.save(user);
    const tokens = await this.generateTokens(savedUser);

    return {
      user: this.sanitizeUser(savedUser),
      ...tokens,
    };
  }

  async sendOtp(phoneLoginDto: PhoneLoginDto): Promise<OtpResponseDto> {
    // Clean up expired OTPs
    this.cleanupExpiredOtps();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = parseInt(this.configService.get<string>('OTP_EXPIRATION_TIME', '300000'));
    const expiresAt = new Date(Date.now() + expirationTime);

    // Store OTP with expiration
    this.otpStore.set(phoneLoginDto.phoneNumber, { code: otp, expiresAt });

    // In production, integrate with SMS service here (e.g., Twilio, AWS SNS)
    // For development, log the OTP to console
    console.log(`📱 OTP sent to ${phoneLoginDto.phoneNumber}: ${otp}`);

    return {
      message: 'OTP sent successfully',
      expiresIn: expirationTime,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<AuthResponseDto> {
    if (verifyOtpDto.otp.length !== 6) {
      throw new BadRequestException('Invalid OTP format');
    }

    // Verify OTP from storage
    const storedOtp = this.otpStore.get(verifyOtpDto.phoneNumber);

    if (!storedOtp) {
      throw new BadRequestException('OTP not found or expired. Please request a new OTP.');
    }

    if (new Date() > storedOtp.expiresAt) {
      this.otpStore.delete(verifyOtpDto.phoneNumber);
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    if (storedOtp.code !== verifyOtpDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Remove OTP after successful verification
    this.otpStore.delete(verifyOtpDto.phoneNumber);

    // Find or create customer user
    let user = await this.userRepository.findOne({
      where: { phoneNumber: verifyOtpDto.phoneNumber },
    });

    if (!user) {
      // Note: Customer creation should be handled via Customer entity, not User
      // This is a placeholder for phone-based authentication
      throw new BadRequestException('Customer registration should be done separately');
    } else {
      // Update phone verification
      await this.userRepository.update(user.id, {
        phoneVerifiedAt: new Date(),
        lastLoginAt: new Date(),
      });
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    try {
      // Verify the refresh token signature and expiration
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      // Find user by ID from token payload
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if refresh token exists in database
      if (!user.refreshToken) {
        throw new UnauthorizedException('Refresh token not found. Please login again.');
      }

      // Check if refresh token has expired
      if (user.refreshTokenExpiresAt && new Date() > user.refreshTokenExpiresAt) {
        // Clear expired token
        await this.userRepository.update(user.id, {
          refreshToken: null,
          refreshTokenExpiresAt: null,
        });
        throw new UnauthorizedException('Refresh token has expired. Please login again.');
      }

      // Verify the token matches the one stored in database
      if (user.refreshToken !== refreshTokenDto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      return tokens;
    } catch (error) {
      // If it's already an UnauthorizedException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // For JWT errors (expired, invalid signature, etc.), throw a generic error
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    await this.userRepository.update(userId, {
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });

    if (user) {
      // Log the logout action
      await this.orderActivityLogService.logAction(null, OrderAction.LOGOUT, userId, `User logged out: ${user.email}`, null, {
        restaurantId: user.restaurantId,
        tenantId: user.tenantId,
      });
    }
  }

  private async generateTokens(user: User): Promise<TokenResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || null, // Super Admin has null tenantId
      restaurantId: user.restaurantId || null,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    });

    // Calculate refresh token expiration date from JWT expiration
    const refreshTokenExpirationTime = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME');
    const refreshTokenExpiresAt = new Date();

    // Parse expiration time (e.g., "7d", "604800s", etc.)
    if (refreshTokenExpirationTime.endsWith('d')) {
      const days = parseInt(refreshTokenExpirationTime);
      refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + days);
    } else if (refreshTokenExpirationTime.endsWith('h')) {
      const hours = parseInt(refreshTokenExpirationTime);
      refreshTokenExpiresAt.setHours(refreshTokenExpiresAt.getHours() + hours);
    } else {
      // Default to seconds
      const seconds = parseInt(refreshTokenExpirationTime) || 604800; // Default 7 days
      refreshTokenExpiresAt.setSeconds(refreshTokenExpiresAt.getSeconds() + seconds);
    }

    // Store refresh token in database
    await this.userRepository.update(user.id, {
      refreshToken,
      refreshTokenExpiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  private sanitizeUser(user: User): any {
    const { password, refreshToken, refreshTokenExpiresAt, ...sanitized } = user;
    return sanitized;
  }

  private cleanupExpiredOtps(): void {
    const now = new Date();
    for (const [phoneNumber, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(phoneNumber);
      }
    }
  }
}
