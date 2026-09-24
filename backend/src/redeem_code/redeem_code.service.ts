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
import * as bcrypt from 'bcrypt';
import { UpdateRedeemCodeDto } from './dto/update-redeem_code.dto';

@Injectable()
export class RedeemCodeService {
  constructor(
    @InjectRepository(RedeemCode)
    private redeemCodeRepository: Repository<RedeemCode>,
    private readonly i18n: I18nService,
    private readonly dataSource: DataSource,
  ) { }

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
    return this.dataSource.transaction(async (manager) => {
      const redeemRepo = manager.getRepository(RedeemCode);
      const userRepo = manager.getRepository(User);

      // ---- load code (inside transaction) ----
      const codeEntity = await redeemRepo.findOne({
        where: { code },
        relations: { user: true },
      });

      if (!codeEntity) {
        throw new NotFoundException(
          this.i18n.translate('errors.redeem.notFound', {
            lang: this.currentLang,
          }),
        );
      }

      // ---- load user (inside transaction) ----
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: { redeemCode: true },
      });

      if (!user) {
        throw new NotFoundException(
          this.i18n.translate('errors.user.notFound', {
            lang: this.currentLang,
          }),
        );
      }

      // ---- guard: already used/assigned ----
      if (codeEntity.user || codeEntity.isActivated) {
        throw new BadRequestException(
          this.i18n.translate('errors.redeem.alreadyAssigned', {
            lang: this.currentLang,
          }),
        );
      }

      // ---- guard: user already has a code ----
      if (user.redeemCode) {
        throw new BadRequestException(
          this.i18n.translate('errors.redeem.userAlreadyHasCode', {
            lang: this.currentLang,
          }),
        );
      }

      // ---- mutate code ----
      const now = new Date();
      const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      codeEntity.user = user;
      codeEntity.isActivated = true;
      codeEntity.activationDate = now;
      codeEntity.expiryDate = expiry;

      // ---- persist both inside the same transaction ----
      await redeemRepo.save(codeEntity);

      user.redeemCode = codeEntity;
      user.activationDate = now;
      user.endDate = expiry;
      user.isActive = true;
      await userRepo.save(user);

      return {
        message: this.i18n.translate('success.redeem.assigned', {
          lang: this.currentLang,
        }),
      };
    });
  }
  async revokeSubscription(userId: string, password: string) {
    console.log('here');

    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const redeemRepo = manager.getRepository(RedeemCode);

      // ---- load user (inside transaction) ----
      const user = await userRepo.findOne({
        where: { id: userId },
        relations: { redeemCode: true },
      });

      if (!user) {
        throw new NotFoundException(
          this.i18n.translate('errors.user.notFound', {
            lang: this.currentLang,
          }),
        );
      }

      // ---- verify password ----
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException(
          this.i18n.translate('errors.user.invalid_password', {
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

      // ---- load code with lock (inside transaction) ----
      const redeemCode = await redeemRepo.findOne({
        where: { id: user.redeemCode.id },
      });

      if (!redeemCode) {
        throw new NotFoundException(
          this.i18n.translate('errors.redeem.notFound', {
            lang: this.currentLang,
          }),
        );
      }

      // ---- unlink code from user ----
      redeemCode.user = null;

      // Optional: reset activation so the code becomes reusable.
      // Remove these 3 lines if you want the code to stay burned after use.

      await redeemRepo.save(redeemCode);

      // ---- clear the user side ----
      user.redeemCode = null;
      await userRepo.save(user);

      return {
        message: this.i18n.translate('success.redeem.revoked', {
          lang: this.currentLang,
        }),
      };
    });
  }
  async revokeSubscriptionAdmin(userId: string) {
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
  async getRedeemCDByYear(yearId: number) {
    const codes = await this.redeemCodeRepository.find({
      where: { year: { id: yearId } },
    });
    return codes;
  }
  async updateCode(id: number, updateRedeemCodeDto: UpdateRedeemCodeDto) {
    const code = await this.redeemCodeRepository.findOne({ where: { id } });
    if (!code) {
      throw new NotFoundException(
        this.i18n.translate('errors.redeem.notFound', {
          lang: this.currentLang,
        }),
      );
    }
    const year = await this.dataSource.getRepository(Year).findOne({
      where: { id: updateRedeemCodeDto.yearId },
    });
    if (!year) {
      throw new NotFoundException(
        this.i18n.translate('errors.year.notFound', {
          lang: this.currentLang,
        }),
      );
    }
    code.year = year;
    await this.redeemCodeRepository.save(code);
    return {
      message: this.i18n.translate('success.redeem.updated', {
        lang: this.currentLang,
      }),
    };
  }
}
