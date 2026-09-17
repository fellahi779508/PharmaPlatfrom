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
import { DataSource, ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { EmailService } from 'src/email/email.service';
import { accountVerificationTemplate } from 'src/email/html-templates/account-verification';
import * as bcrypt from 'bcrypt';
import { Session, SessionStatus } from 'src/session/entities/session.entity';
import { Exam } from 'src/exam/entities/exam.entity';
import { ExamSessionStatus } from 'src/exam/entities/examSession.entity';
import { ExamSessionAnswer } from 'src/exam/entities/examSessionAnswer';
import { SessionQuestion } from 'src/session-question/entities/session-question.entity';
import { SessionQuestionAnswer } from 'src/session-question-answer/entities/session-question-answer.entity';
import { RedeemCode } from 'src/redeem_code/entities/redeem_code.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly i18n: I18nService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource
  ) { }

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
    await this.emailService.sendVerificationOtp(
      savedUser.email,
      otpCode,
      accountVerificationTemplate(otpCode),
    );
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

  async findOne(id: string) {
    const user = await this.userRepo.findOne({ where: { id }, relations: { redeemCode: true } });
    if (!user) {
      throw new NotFoundException(
        this.i18n.translate('errors.user.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
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
    await this.userRepo.save(user);
    return {
      message: this.i18n.translate('success.user.updated', {
        lang: this.currentLang,
      }),
    };
  }

  async remove(id: string) {
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

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.findOne(id);
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException(
        this.i18n.translate('errors.user.invalid_password', {
          lang: this.currentLang,
        }),
      );
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.userRepo.save(user);
    return {
      message: this.i18n.translate('success.user.password_changed', {
        lang: this.currentLang,
      }),
    };
  }

  async activateUser(id: string) {
    const user = await this.findOne(id);
    user.isActive = true;
    user.activationDate = new Date();
    await this.userRepo.save(user);
    return {
      message: this.i18n.translate('success.user.activated', {
        lang: this.currentLang,
      }),
    };
  }

  //dev only
  async deleteAll() {
    await this.userRepo.clear();
    return 'done';
  }
  async getAllUserStats(userEmail: string) {
    const user = await this.findByEmail(userEmail)
    const sessions = await this.dataSource.getRepository(Session).count({
      where: {
        user: { id: user.id }
      }
    })
    const sessionsDone = await this.dataSource.getRepository(Session).count({
      where: {
        user: { id: user.id },
        status: SessionStatus.COMPLETED
      }
    })
    const sessionsNotStarted = await this.dataSource.getRepository(Session).count({
      where: {
        user: { id: user.id },
        status: SessionStatus.NOT_STARTED
      }
    })
    const sessionsInProgress = await this.dataSource.getRepository(Session).count({
      where: {
        user: { id: user.id },
        status: SessionStatus.IN_PROGRESS
      }
    })
    const exams = await this.dataSource.getRepository(Exam).count({
      where: {
        user: { id: user.id }
      }
    })
    const examsDone = await this.dataSource.getRepository(Exam).count({
      where: {
        user: { id: user.id },
        sessions: { status: ExamSessionStatus.COMPLETED }
      }
    })
    const examsInProgress = await this.dataSource.getRepository(Exam).count({
      where: {
        user: { id: user.id },
        sessions: { status: ExamSessionStatus.IN_PROGRESS }
      }
    })
    const examsPaused = await this.dataSource.getRepository(Exam).count({
      where: {
        user: { id: user.id },
        sessions: { status: ExamSessionStatus.PAUSED }
      }
    })
    const correctAnswers = await this.dataSource.getRepository(SessionQuestion).count({
      where: {
        session: { user: { id: user.id } },
        isCorrect: true
      }
    })
    const wrongAnswers = await this.dataSource.getRepository(SessionQuestion).count({
      where: {
        session: { user: { id: user.id } },
        isCorrect: false
      }
    })
    const allQuestions = await this.dataSource.getRepository(SessionQuestion).count({
      where: {
        session: { user: { id: user.id } }
      }
    })

    return {
      sessions,
      sessionsDone,
      sessionsNotStarted,
      sessionsInProgress,
      exams,
      examsDone,
      examsInProgress,
      examsPaused,
      correctAnswers,
      wrongAnswers,
      allQuestions,
    }
  }

  async checkUserActivation(userId: string) {
    const user = await this.findOne(userId);
    if (!user.isActive) {
      return false
    }
    return true;
  }
  async revokeSubscription(userId: string, password: string) {
    const user = await this.findOne(userId)
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException(
        this.i18n.translate('errors.user.invalid_password', {
          lang: this.currentLang,
        }),
      );
    }
    user.isActive = false;
    const redeemCode = await this.dataSource.getRepository(RedeemCode).findOne({
      where: { user: { id: user.id } }
    })
    if (!redeemCode) {
      throw new NotFoundException(
        this.i18n.translate('errors.redeem_code.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    redeemCode.user = null;
    await this.dataSource.getRepository(RedeemCode).save(redeemCode);
    user.redeemCode = null
    await this.userRepo.save(user);
    return {
      message: this.i18n.translate('success.user.subscription_revoked', {
        lang: this.currentLang,
      }),
    };
  }
  async isVerifed(userId: string) {
    const user = await this.findOne(userId);
    return user.isVerified;
  }
}
