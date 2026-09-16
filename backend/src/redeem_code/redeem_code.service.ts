import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRedeemCodeDto } from './dto/create-redeem_code.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RedeemCode } from './entities/redeem_code.entity';
import { DataSource, Like, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import * as crypto from 'crypto';
import { User } from 'src/user/entities/user.entity';
import { Year } from 'src/year/entities/year.entity';

@Injectable()
export class RedeemCodeService {
  constructor(
    @InjectRepository(RedeemCode)
    private redeemCodeRepository: Repository<RedeemCode>,
    private readonly i18n: I18nService,
    private readonly dataSource: DataSource,
  ) {}

  private async generateRedeemCode(): Promise<string> {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const segments = 3;
    const segmentLength = 4;
    const generatedSegments: string[] = [];

    for (let i = 0; i < segments; i++) {
      let segment = '';
      const randomBytes = crypto.randomBytes(segmentLength);
      for (let j = 0; j < segmentLength; j++) {
        const randomIndex = randomBytes[j] % chars.length;
        segment += chars[randomIndex];
      }
      generatedSegments.push(segment);
    }

    return generatedSegments.join('-');
  }
  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  async create(createRedeemCodeDto: CreateRedeemCodeDto) {
    let code: string;
    let isUnique = false;
    const year = await this.dataSource
      .getRepository(Year)
      .findOne({ where: { id: createRedeemCodeDto.yearId } });
    if (!year) {
      throw new NotFoundException(
        this.i18n.translate('error.yearNotFound', {
          lang: this.currentLang,
        }),
      );
    }

    while (!isUnique) {
      code = await this.generateRedeemCode();
      const existingCode = await this.redeemCodeRepository.findOne({
        where: { code },
      });
      if (!existingCode) {
        isUnique = true;
      }
    }

    try {
      const redeemCode = this.redeemCodeRepository.create({
        ...createRedeemCodeDto,
        code: code!,
        isActivated: false,
        year,
      });

      const savedCode = await this.redeemCodeRepository.save(redeemCode);
      year.redeemCodes = [...(year.redeemCodes || []), savedCode];
      await this.dataSource.getRepository(Year).save(year);

      return {
        message: this.i18n.translate('success.redeem.codeCreated', {
          lang: this.currentLang,
        }),
        response: savedCode,
      };
    } catch (error) {
      return {
        message: this.i18n.translate('errors.redeem.createFailed', {
          lang: this.currentLang,
        }),
      };
    }
  }

  async findAll() {
    const codes = await this.redeemCodeRepository.find({
      relations: { user: true, year: true },
    });
    return codes;
  }

  async findOne(id: number) {
    const code = await this.redeemCodeRepository.findOne({
      where: { id },
      relations: { user: true, year: true },
    });

    if (!code) {
      return {
        status: false,
        message: this.i18n.translate('redeem.error.notFound', {
          lang: this.currentLang,
        }),
      };
    }

    return code;
  }

  async remove(id: number) {
    const code = await this.redeemCodeRepository.findOne({ where: { id } });
    if (!code) {
      return {
        status: false,
        message: this.i18n.translate('errors.redeem.notFound', {
          lang: this.currentLang,
        }),
      };
    }

    await this.redeemCodeRepository.delete(id);
    return {
      status: true,
      message: this.i18n.translate('success.redeem.deleted', {
        lang: this.currentLang,
      }),
    };
  }
  async getCodeByCode(code: string) {
    const search = await this.redeemCodeRepository.findOne({
      where: { code },
      relations: { user: true, year: true },
    });

    if (!search) {
      throw new NotFoundException(
        this.i18n.translate('errors.redeem.notFound', {
          lang: this.currentLang,
        }),
      );
    }
    return search;
  }
  async assignCodeToUser(code: string, userId: string) {
    const codeEntity = await this.getCodeByCode(code);
    const user = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: userId }, relations: { redeemCode: true } });
    if (!user) {
      throw new NotFoundException(
        this.i18n.translate('errors.user.notFound', {
          lang: this.currentLang,
        }),
      );
    }
    if (codeEntity.user || codeEntity.isActivated) {
      throw new BadRequestException(
        this.i18n.translate('errors.redeem.alreadyAssigned', {
          lang: this.currentLang,
        }),
      );
    }
    codeEntity.user = user;
    codeEntity.isActivated = true;
    codeEntity.activationDate = new Date();
    codeEntity.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const savedCode = await this.redeemCodeRepository.save(codeEntity);
    user.redeemCode = savedCode;
    await this.dataSource.getRepository(User).save(user);
    return {
      message: this.i18n.translate('success.redeem.assigned', {
        lang: this.currentLang,
      }),
    };
  }
  async revokeSubscription(userId: string) {
    const user = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: userId }, relations: { redeemCode: true } });
    if (!user) {
      throw new NotFoundException(
        this.i18n.translate('errors.user.notFound', {
          lang: this.currentLang,
        }),
      );
    }
    if (!user.redeemCode) {
      throw new BadRequestException(
        this.i18n.translate('errors.redeem.notAssigned', {
          lang: this.currentLang,
        }),
      );
    }
    const redeemCode = await this.redeemCodeRepository.findOne({
      where: { id: user.redeemCode.id },
    });
    if (!redeemCode) {
      throw new NotFoundException(
        this.i18n.translate('errors.redeem.notFound', {
          lang: this.currentLang,
        }),
      );
    }
    redeemCode.user = null;
    await this.redeemCodeRepository.save(redeemCode);
    user.redeemCode = null;
    await this.dataSource.getRepository(User).save(user);
    return {
      message: this.i18n.translate('success.redeem.revoked', {
        lang: this.currentLang,
      }),
    };
  }
}
