import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { EmailService } from 'src/email/email.service';
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly i18n: I18nService,

    private readonly emailService: EmailService,
  ) {}

  private generate6DigitOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  async create(createUserDto: CreateUserDto) {
    const otpCode = this.generate6DigitOtp();
    const otpExpiresAt = new Date(Date.now() + 60 * 1000); // 1 minute
    const existingUser = await this.userRepo.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException(
        this.i18n.translate('errors.user.email_exists', {
          lang: this.currentLang,
        }),
      );
    }
    const user = this.userRepo.create({
      ...createUserDto,
      isActive: false,
      otpCode,
      otpExpiresAt,
    });
    const savedUser = await this.userRepo.save(user);
    await this.emailService.sendVerificationOtp(savedUser.email, otpCode);
    return {
      message: this.i18n.translate('success.user.created', {
        lang: this.currentLang,
      }),
    };
  }
  async findByEmail(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(
        this.i18n.translate('errors.user.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return user;
  }

  async findAll(page: number, limit: number, search?: string) {
    const [users, total] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: [
        {
          username: ILike(`%${search}%`),
        },
        {
          email: ILike(`%${search}%`),
        },
      ],
    });
    return { users, total, pages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(
        this.i18n.translate('errors.user.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepo.preload({
      id,
      ...updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(
        this.i18n.translate('errors.user.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return this.userRepo.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    try {
      await this.userRepo.remove(user);
      return {
        message: this.i18n.translate('success.user.deleted', {
          lang: this.currentLang,
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        this.i18n.translate('errors.user.not_deleted', {
          lang: this.currentLang,
        }),
      );
    }
  }
}
