import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Session, SessionStatus } from './entities/session.entity';
import { DataSource, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Subject } from 'src/subject/entities/subject.entity';
import { Course } from 'src/course/entities/course.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';
import { QcmAnswer } from 'src/qcm_answer/entities/qcm_answer.entity';
import { User } from 'src/user/entities/user.entity';
import { SessionQuestion } from 'src/session-question/entities/session-question.entity';
import { SessionQuestionAnswer } from 'src/session-question-answer/entities/session-question-answer.entity';
import { Td } from 'src/td/entities/td.entity';
import { Tp } from 'src/tp/entities/tp.entity';

@Injectable()
export class SessionService implements OnModuleInit {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly i18n: I18nService,
    private readonly dataSource: DataSource,
  ) { }

  async onModuleInit() {
    try {
      await this.dataSource.query(
        `DROP TABLE IF EXISTS "session_qcm" CASCADE;`,
      );
    } catch (e) {
      // ignore
    }
  }

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  // -------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------
  async create(createSessionDto: CreateSessionDto, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException(
          await this.i18n.translate('errors.user.not_found', {
            lang: this.currentLang,
          }),
        );
      }

      const allSelectedQcms: Qcm[] = [];

      for (const subjectSel of createSessionDto.subjects) {
        // Validate subject exists
        const subject = await manager.getRepository(Subject).findOne({
          where: { id: subjectSel.subjectId },
        });
        if (!subject) {
          throw new NotFoundException(
            await this.i18n.translate('errors.subject.not_found', {
              lang: this.currentLang,
            }),
          );
        }

        for (const courseSel of subjectSel.courses) {
          // 1. Load course and its QCMs
          const course = await manager.getRepository(Course).findOne({
            where: { id: courseSel.courseId },
            relations: { qcms: true },
          });

          if (!course) {
            throw new NotFoundException(
              await this.i18n.translate('errors.course.not_found', {
                lang: this.currentLang,
              }),
            );
          }

          if (!course.qcms || course.qcms.length === 0) {
            throw new BadRequestException(
              `Course with ID ${courseSel.courseId} has no available QCMs.`,
            );
          }

          // 2. Validate quantity
          if (course.qcms.length < courseSel.qcmQte) {
            throw new BadRequestException(
              `Requested ${courseSel.qcmQte} QCMs for course ${courseSel.courseId}, but only ${course.qcms.length} are available.`,
            );
          }

          // 3. Shuffle + slice
          const shuffled = [...course.qcms].sort(() => 0.5 - Math.random());
          const picked = shuffled.slice(0, courseSel.qcmQte);

          allSelectedQcms.push(...picked);
        }
        for (const tdSel of subjectSel.tds) {
          // 1. Load tds and its QCMs
          const td = await manager.getRepository(Td).findOne({
            where: { id: tdSel.tdId },
            relations: { qcms: true },
          });

          if (!td) {
            throw new NotFoundException(
              await this.i18n.translate('errors.td.not_found', {
                lang: this.currentLang,
              }),
            );
          }

          if (!td.qcms || td.qcms.length === 0) {
            throw new BadRequestException(
              `TD with ID ${tdSel.tdId} has no available QCMs.`,
            );
          }

          // 2. Validate quantity
          if (td.qcms.length < tdSel.qcmQte) {
            throw new BadRequestException(
              `Requested ${tdSel.qcmQte} QCMs for TD ${tdSel.tdId}, but only ${td.qcms.length} are available.`,
            );
          }

          // 3. Shuffle + slice
          const shuffled = [...td.qcms].sort(() => 0.5 - Math.random());
          const picked = shuffled.slice(0, tdSel.qcmQte);

          allSelectedQcms.push(...picked);
        }
        for (const tpSel of subjectSel.tps) {
          // 1. Load tds and its QCMs
          const tp = await manager.getRepository(Tp).findOne({
            where: { id: tpSel.tpId },
            relations: { qcms: true },
          });

          if (!tp) {
            throw new NotFoundException(
              await this.i18n.translate('errors.tp.not_found', {
                lang: this.currentLang,
              }),
            );
          }

          if (!tp.qcms || tp.qcms.length === 0) {
            throw new BadRequestException(
              `TP with ID ${tpSel.tpId} has no available QCMs.`,
            );
          }

          // 2. Validate quantity
          if (tp.qcms.length < tpSel.qcmQte) {
            throw new BadRequestException(
              `Requested ${tpSel.qcmQte} QCMs for TP ${tpSel.tpId}, but only ${tp.qcms.length} are available.`,
            );
          }

          // 3. Shuffle + slice
          const shuffled = [...tp.qcms].sort(() => 0.5 - Math.random());
          const picked = shuffled.slice(0, tpSel.qcmQte);

          allSelectedQcms.push(...picked);
        }
      }

      // 4. Deduplicate across courses
      const uniqueQcms = Array.from(
        new Map(allSelectedQcms.map((q) => [q.id, q])).values(),
      );

      if (!uniqueQcms.length) {
        throw new BadRequestException(
          'No QCMs were selected for this session.',
        );
      }

      // 5. Create the session
      const session = manager.create(Session, {
        name: createSessionDto.name,
        user,
        totalQuestions: uniqueQcms.length,
        correctCount: 0,
        status: SessionStatus.NOT_STARTED,
      });

      const savedSession = await manager.save(Session, session);

      // 6. Create SessionQuestion rows preserving order
      const questions = uniqueQcms.map((qcm, index) =>
        manager.create(SessionQuestion, {
          session: savedSession,
          qcm,
          position: index + 1,
        }),
      );

      const savedQuestions = await manager.save(SessionQuestion, questions);

      // 7. Point currentQuestionId to the first question
      savedSession.currentQuestionId = savedQuestions[0]?.id ?? null;
      await manager.save(Session, savedSession);

      return {
        status: true,
        message: await this.i18n.translate('success.session.created', {
          lang: this.currentLang,
        }),
        response: {
          id: savedSession.id,
          name: savedSession.name,
          status: savedSession.status,
          totalQuestions: savedSession.totalQuestions,
          currentQuestionId: savedSession.currentQuestionId,
        },
      };
    });
  }

  // -------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------
  async findAll() {
    return this.sessionRepository.find();
  }

  async getSessionsOfStudent(studentId: string) {
    return this.sessionRepository.find({
      where: { user: { id: studentId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId?: string) {
    const session = await this.sessionRepository.findOne({
      where: userId ? { id, user: { id: userId } } : { id },
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found.`);
    }
    return session;
  }

  // -------------------------------------------------------------------
  // PLAY / RESUME
  // -------------------------------------------------------------------
  async getPlay(sessionId: number, userId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: {
        questions: {
          qcm: { answers: true },
          selectedAnswers: { qcmAnswer: true },
        },
      },
    });


    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found.`);
    }

    if (session.status === SessionStatus.COMPLETED) {
      return {
        completed: true,
        session: this.sessionSummary(session),
      };
    }

    const ordered = [...session.questions].sort(
      (a, b) => a.position - b.position,
    );

    let current = ordered.find((q) => q.id === session.currentQuestionId);

    let needsSave = false;
    if (!current) {
      current = ordered[0];
      if (!current) {
        throw new BadRequestException('Session has no questions.');
      }
      session.currentQuestionId = current.id;
      session.status = SessionStatus.IN_PROGRESS;
      needsSave = true;
    } else if (session.status === SessionStatus.NOT_STARTED) {
      session.status = SessionStatus.IN_PROGRESS;
      needsSave = true;
    }

    if (needsSave) {
      await this.sessionRepository.save(session);
    }

    return this.buildQuestionPayload(current, session, ordered.length);
  }

  // -------------------------------------------------------------------
  // REVEAL
  // -------------------------------------------------------------------
  async reveal(
    sessionId: number,
    questionId: number,
    selectedAnswerIds: number[],
    userId: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(Session, {
        where: { id: sessionId, user: { id: userId } },
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found.`);
      }

      if (session.status === SessionStatus.COMPLETED) {
        throw new BadRequestException('Session already completed.');
      }

      const sq = await manager.findOne(SessionQuestion, {
        where: { id: questionId, session: { id: sessionId } },
        relations: { qcm: { answers: true }, selectedAnswers: true },
      });

      if (!sq) {
        throw new NotFoundException('Question not found in this session.');
      }

      if (sq.isRevealed) {
        // Already revealed → just return the current payload
        return {
          status: true,
          result: this.buildQuestionPayload(sq, session),
        };
      }

      const allAnswers = sq.qcm.answers ?? [];
      const answerIds = new Set(selectedAnswerIds);

      for (const id of answerIds) {
        if (!allAnswers.some((a) => a.id === id)) {
          throw new BadRequestException(
            `Answer with ID ${id} does not belong to this question.`,
          );
        }
      }

      const correctIds = new Set(
        allAnswers.filter((a) => a.isCorrect).map((a) => a.id),
      );

      const isCorrect =
        answerIds.size === correctIds.size &&
        [...answerIds].every((id) => correctIds.has(id));

      // Clear existing selections (in case of retake, which shouldn't happen)
      await manager.delete(SessionQuestionAnswer, {
        sessionQuestion: { id: sq.id },
      });

      const rows = [...answerIds].map((id) =>
        manager.create(SessionQuestionAnswer, {
          sessionQuestion: { id: sq.id } as SessionQuestion,
          qcmAnswer: { id } as QcmAnswer,
        }),
      );
      const savedRows = rows.length
        ? await manager.save(SessionQuestionAnswer, rows)
        : [];

      sq.isAnswered = true;
      sq.isRevealed = true;
      sq.isCorrect = isCorrect;
      sq.answeredAt = new Date();
      sq.draftAnswerIds = null;
      await manager.save(SessionQuestion, sq);

      if (isCorrect) {
        session.correctCount = (session.correctCount ?? 0) + 1;
        await manager.save(Session, session);
      }

      sq.selectedAnswers = savedRows;

      return {
        status: true,
        result: this.buildQuestionPayload(sq, session),
      };
    });
  }

  // -------------------------------------------------------------------
  // NEXT
  // -------------------------------------------------------------------
  async next(sessionId: number, userId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: {
        questions: {
          qcm: { answers: true },
          selectedAnswers: { qcmAnswer: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found.`);
    }

    if (session.status === SessionStatus.COMPLETED) {
      return {
        completed: true,
        session: this.sessionSummary(session),
      };
    }

    const ordered = [...session.questions].sort(
      (a, b) => a.position - b.position,
    );

    const current = ordered.find((q) => q.id === session.currentQuestionId);

    const nextQuestion = current
      ? ordered.find((q) => q.position > current.position)
      : ordered[0];

    if (!nextQuestion) {
      session.status = SessionStatus.COMPLETED;
      session.currentQuestionId = null;
      await this.sessionRepository.save(session);

      return {
        completed: true,
        session: this.sessionSummary(session),
      };
    }

    session.currentQuestionId = nextQuestion.id;
    session.status = SessionStatus.IN_PROGRESS;
    await this.sessionRepository.save(session);

    return this.buildQuestionPayload(nextQuestion, session, ordered.length);
  }

  // -------------------------------------------------------------------
  // SAVE DRAFT (optional)
  // -------------------------------------------------------------------
  async saveDraft(
    sessionId: number,
    questionId: number,
    selectedAnswerIds: number[],
    userId: string,
  ) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found.`);
    }

    const sessionQuestionRepository =
      this.dataSource.getRepository(SessionQuestion);

    const sq = await sessionQuestionRepository.findOne({
      where: { id: questionId, session: { id: sessionId } },
    });
    if (!sq) {
      throw new NotFoundException('Question not found in this session.');
    }

    if (sq.isRevealed) {
      throw new BadRequestException('Question already revealed.');
    }

    sq.draftAnswerIds = selectedAnswerIds ?? [];
    await sessionQuestionRepository.save(sq);

    return { status: true };
  }

  // -------------------------------------------------------------------
  // RESTART
  // -------------------------------------------------------------------
  async restart(sessionId: number, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(Session, {
        where: { id: sessionId, user: { id: userId } },
        relations: {
          questions: { selectedAnswers: true },
        },
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found.`);
      }

      // 1. Delete all selected answers for every question
      for (const sq of session.questions) {
        if (sq.selectedAnswers && sq.selectedAnswers.length > 0) {
          await manager.delete(SessionQuestionAnswer, {
            sessionQuestion: { id: sq.id },
          });
        }
      }

      // 2. Reset each question
      for (const sq of session.questions) {
        sq.isAnswered = false;
        sq.isRevealed = false;
        sq.isCorrect = null as any;
        sq.answeredAt = null as any;
        sq.draftAnswerIds = null;
      }
      await manager.save(SessionQuestion, session.questions);

      // 3. Reset session
      const ordered = [...session.questions].sort(
        (a, b) => a.position - b.position,
      );
      session.status = SessionStatus.NOT_STARTED;
      session.correctCount = 0;
      session.currentQuestionId = ordered[0]?.id ?? null;
      await manager.save(Session, session);

      return {
        status: true,
        message: 'Session restarted successfully.',
        response: this.sessionSummary(session),
      };
    });
  }

  // -------------------------------------------------------------------
  // UPDATE / DELETE
  // -------------------------------------------------------------------
  update(id: number, updateSessionDto: UpdateSessionDto) {
    return `This action updates a #${id} session`;
  }

  async remove(id: number, userId?: string) {
    const session = await this.sessionRepository.findOne({
      where: userId ? { id, user: { id: userId } } : { id },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found.`);
    }

    try {
      await this.dataSource.query(
        `DROP TABLE IF EXISTS "session_qcm" CASCADE;`,
      );
    } catch {
      // ignore
    }

    await this.sessionRepository.remove(session);

    return this.i18n.translate('success.session.deleted', {
      lang: this.currentLang,
    });
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private sessionSummary(session: Session) {
    return {
      id: session.id,
      name: session.name,
      status: session.status,
      totalQuestions: session.totalQuestions,
      correctCount: session.correctCount,
      currentQuestionId: session.currentQuestionId,
    };
  }

  private buildQuestionPayload(
    sq: SessionQuestion,
    session: Session,
    totalQuestionsOverride?: number,
  ) {
    const selectedIds = sq.isRevealed
      ? (sq.selectedAnswers ?? []).map(
        (a) => a.qcmAnswer?.id ?? (a as any).qcmAnswerId,
      )
      : (sq.draftAnswerIds ?? []);

    // Safely clone and shuffle answers so they randomize every time the payload builds
    const shuffledAnswers = sq.qcm?.answers
      ? [...sq.qcm.answers].sort(() => 0.5 - Math.random())
      : [];

    return {
      completed: false,
      session: {
        id: session.id,
        name: session.name,
        status: session.status,
        totalQuestions: totalQuestionsOverride ?? session.totalQuestions,
        correctCount: session.correctCount,
        currentPosition: sq.position,
      },
      question: {
        id: sq.id,
        position: sq.position,
        question: sq.qcm.question,
        isAnswered: sq.isAnswered,
        isRevealed: sq.isRevealed,
        isCorrect: sq.isRevealed ? sq.isCorrect : null,
        selectedAnswerIds: selectedIds,
        // Map over the shuffled array instead of sq.qcm.answers directly
        answers: shuffledAnswers.map((a) => ({
          id: a.id,
          answer: a.answer,
          ...(sq.isRevealed
            ? {
              isCorrect: a.isCorrect,
              explanation: a.explanation,
              selected: selectedIds.includes(a.id),
            }
            : {}),
        })),
      },
    };
  }
}
