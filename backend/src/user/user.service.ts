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
import { DataSource, ILike, Not, Repository } from 'typeorm';
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
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly i18n: I18nService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
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
    user.isVerified = false;
    user.isActive = false;
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
  async resetPasswordByEmail(email: string, password: string) {
    const user = await this.findByEmail(email);

    const hashedpassword = await bcrypt.hash(password, 10);
    user.password = hashedpassword;
    await this.userRepo.save(user);
    return {
      message: this.i18n.translate('success.user.password_changed', {
        lang: this.currentLang,
      }),
    };
  }

  async findAll(page: number, limit: number, search?: string) {
    const [users, total] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: { role: Not('owner') },
    });
    console.log(users);

    return { users, total, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: { redeemCode: true },
    });
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
    const user = await this.findByEmail(userEmail);
    const sessions = await this.dataSource.getRepository(Session).count({
      where: {
        user: { id: user.id },
      },
    });
    const sessionsDone = await this.dataSource.getRepository(Session).count({
      where: {
        user: { id: user.id },
        status: SessionStatus.COMPLETED,
      },
    });
    const sessionsNotStarted = await this.dataSource
      .getRepository(Session)
      .count({
        where: {
          user: { id: user.id },
          status: SessionStatus.NOT_STARTED,
        },
      });
    const sessionsInProgress = await this.dataSource
      .getRepository(Session)
      .count({
        where: {
          user: { id: user.id },
          status: SessionStatus.IN_PROGRESS,
        },
      });
    const exams = await this.dataSource.getRepository(Exam).count({
      where: {
        user: { id: user.id },
      },
    });
    const examsDone = await this.dataSource.getRepository(Exam).count({
      where: {
        user: { id: user.id },
        sessions: { status: ExamSessionStatus.COMPLETED },
      },
    });
    const examsInProgress = await this.dataSource.getRepository(Exam).count({
      where: {
        user: { id: user.id },
        sessions: { status: ExamSessionStatus.IN_PROGRESS },
      },
    });
    const examsPaused = await this.dataSource.getRepository(Exam).count({
      where: {
        user: { id: user.id },
        sessions: { status: ExamSessionStatus.PAUSED },
      },
    });
    const correctAnswers = await this.dataSource
      .getRepository(SessionQuestion)
      .count({
        where: {
          session: { user: { id: user.id } },
          isCorrect: true,
        },
      });
    const wrongAnswers = await this.dataSource
      .getRepository(SessionQuestion)
      .count({
        where: {
          session: { user: { id: user.id } },
          isCorrect: false,
        },
      });
    const allQuestions = await this.dataSource
      .getRepository(SessionQuestion)
      .count({
        where: {
          session: { user: { id: user.id } },
        },
      });

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
    };
  }

  async checkUserActivation(userId: string) {
    const user = await this.findOne(userId);
    if (!user.isActive) {
      return false;
    }
    return true;
  }
  async revokeSubscription(userId: string, password: string) {
    const user = await this.findOne(userId);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException(
        this.i18n.translate('errors.user.invalid_password', {
          lang: this.currentLang,
        }),
      );
    }
    user.isActive = false;
    const redeemCode = await this.dataSource.getRepository(RedeemCode).findOne({
      where: { user: { id: user.id } },
    });
    if (!redeemCode) {
      throw new NotFoundException(
        this.i18n.translate('errors.redeem_code.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    redeemCode.user = null;
    // 1. Save the redeem code
    await this.dataSource.getRepository(RedeemCode).save(redeemCode);

    // 2. Fetch the actual entities
    const sessionsToRemove = await this.dataSource
      .getRepository(Session)
      .find({ where: { user: { id: user.id } } });
    const examsToRemove = await this.dataSource
      .getRepository(Exam)
      .find({ where: { user: { id: user.id } } });

    // 3. Use .remove(), which respects TypeORM cascades and hooks
    if (sessionsToRemove.length)
      await this.dataSource.getRepository(Session).remove(sessionsToRemove);
    if (examsToRemove.length)
      await this.dataSource.getRepository(Exam).remove(examsToRemove);

    // 4. Update the user (if you need the user's redeemCode to be null in the DB)
    user.redeemCode = null;
    await this.dataSource.getRepository(User).save(user);
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

  async updateCurrentJti(userId: string, jti: string) {
    const user = await this.findOne(userId);
    user.currentJti = jti;
    await this.userRepo.save(user);
  }
  async getLeaderboardWithUserRank(currentUserId: string) {
    // 1. Fetch the Top 10 Leaderboard (selecting username instead of email)
    const top10Users = await this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.sessions', 'session')
      .leftJoin(
        'session.questions',
        'question',
        'question.isCorrect = :isCorrect',
        { isCorrect: true },
      )
      .select(['user.id AS id', 'user.username AS username']) // Changed to username
      .addSelect('CAST(COUNT(question.id) AS INTEGER)', 'correctAnswers')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('user.isVerified = :isVerified', { isVerified: true })
      .andWhere('user.role = :role', { role: Role.USER })
      .andWhere('session.status = :status', { status: SessionStatus.COMPLETED })
      .groupBy('user.id')
      .addGroupBy('user.username') // Group by username
      .orderBy('"correctAnswers"', 'DESC')
      .limit(10)
      .getRawMany();

    // 2. Check if the current user is already in the Top 10
    const top10Index = top10Users.findIndex((u) => u.id === currentUserId);

    // Optional: Map the array to remove the 'id' if you want strictly usernames returned to the frontend
    const formattedLeaderboard = top10Users.map((user) => ({
      username: user.username,
      correctAnswers: user.correctAnswers,
    }));

    if (top10Index !== -1) {
      // User is in Top 10, no extra database calls needed
      return {
        leaderboard: formattedLeaderboard,
        currentUser: {
          username: top10Users[top10Index].username,
          correctAnswers: top10Users[top10Index].correctAnswers,
          rank: top10Index + 1,
        },
      };
    }

    // 3. User is NOT in the Top 10. Get their specific score and username.
    const currentUserScoreResult = await this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.sessions', 'session', 'session.status = :status', {
        status: SessionStatus.COMPLETED,
      })
      .leftJoin(
        'session.questions',
        'question',
        'question.isCorrect = :isCorrect',
        { isCorrect: true },
      )
      .select('CAST(COUNT(question.id) AS INTEGER)', 'score')
      .addSelect('user.username', 'username') // Changed to username
      .where('user.id = :userId', { userId: currentUserId })
      .groupBy('user.id')
      .addGroupBy('user.username') // Group by username
      .getRawOne();

    const score = currentUserScoreResult?.score || 0;
    const username = currentUserScoreResult?.username || 'Unknown User';

    // 4. Calculate their rank using raw SQL for maximum performance
    const [{ rankOffset }] = await this.userRepo.query(
      `
    SELECT COUNT(*) AS "rankOffset"
    FROM (
      SELECT u.id
      FROM "user" u
      LEFT JOIN "session" s ON s."userId" = u.id AND s.status = 'completed'
      LEFT JOIN "session_question" q ON q."sessionId" = s.id AND q."isCorrect" = true
      WHERE u."isActive" = true AND u."isVerified" = true
      GROUP BY u.id
      HAVING COUNT(q.id) > $1
    ) AS higher_scorers
  `,
      [score],
    );

    const currentUserRank = parseInt(rankOffset, 10) + 1;

    return {
      leaderboard: formattedLeaderboard,
      currentUser: {
        username: username,
        correctAnswers: score,
        rank: currentUserRank,
      },
    };
  }
}
