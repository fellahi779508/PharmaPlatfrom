import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsRelations, In, Repository } from 'typeorm';

import { Exam } from './entities/exam.entity';
import { ExamQcm } from './entities/examQcm.entity';
import { ExamSession, ExamSessionStatus } from './entities/examSession.entity';
import { ExamSessionAnswer } from './entities/examSessionAnswer';

import { Subject } from 'src/subject/entities/subject.entity';
import { Semester } from 'src/semester/entities/semester.entity';
import { Course } from 'src/course/entities/course.entity';
import { Qcm } from 'src/qcm/entities/qcm.entity';
import { User } from 'src/user/entities/user.entity';

import { GenerateExamDto } from './dto/generate-exam.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

type UserIdInput = string | { id: string } | null | undefined;

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    private readonly dataSource: DataSource,
  ) { }

  /* ------------------------------------------------------------------ */
  /*  Catalog (year-scoped)                                             */
  /* ------------------------------------------------------------------ */

  async getAvailableSemesters(userIdInput: UserIdInput): Promise<Semester[]> {
    const userId = this.normalizeUserId(userIdInput);
    const semesterRepo = this.dataSource.getRepository(Semester);
    const yearId = await this.resolveYearScope(userId);

    if (yearId === null) {
      return semesterRepo.find({
        relations: { year: true },
        order: { year: { id: 'ASC' }, number: 'ASC' },
      });
    }

    return semesterRepo.find({
      where: { year: { id: yearId } },
      relations: { year: true },
      order: { number: 'ASC' },
    });
  }

  async getAvailableSubjects(userIdInput: UserIdInput): Promise<Subject[]> {
    const userId = this.normalizeUserId(userIdInput);
    const subjectRepo = this.dataSource.getRepository(Subject);
    const yearId = await this.resolveYearScope(userId);

    if (yearId === null) {
      return subjectRepo.find({
        relations: { year: true },
        order: { name: 'ASC' },
      });
    }

    return subjectRepo.find({
      where: { year: { id: yearId } },
      relations: { year: true },
      order: { name: 'ASC' },
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Exam generation                                                   */
  /* ------------------------------------------------------------------ */

  async generateExam(dto: GenerateExamDto, userId: string): Promise<Exam> {
    const { subjectId, semesterId, questionCount = 20, durationMinutes = 60 } = dto;

    const subjectRepo = this.dataSource.getRepository(Subject);
    const semesterRepo = this.dataSource.getRepository(Semester);
    const courseRepo = this.dataSource.getRepository(Course);
    const qcmRepo = this.dataSource.getRepository(Qcm);
    const examQcmRepo = this.dataSource.getRepository(ExamQcm);
    const userRepo = this.dataSource.getRepository(User);


    const user = await userRepo.findOne({
      where: { id: userId },

    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const subject = await subjectRepo.findOne({
      where: { id: subjectId },
      relations: { year: true },
    });
    if (!subject) throw new NotFoundException(`Subject ${subjectId} not found`);

    const semester = await semesterRepo.findOne({
      where: { id: semesterId },
      relations: { year: true },
    });
    if (!semester) throw new NotFoundException(`Semester ${semesterId} not found`);

    const yearId = await this.resolveYearScope(userId);
    if (yearId !== null) {
      if (subject.year?.id !== yearId) {
        throw new ForbiddenException('This subject does not belong to your year');
      }
      if (semester.year?.id !== yearId) {
        throw new ForbiddenException('This semester does not belong to your year');
      }
    }

    const courses = await courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.qcms', 'qcm')
      .where('course.subjectId = :subjectId', { subjectId })
      .andWhere('course.semesterId = :semesterId', { semesterId })
      .getMany();

    const candidateIds = courses.flatMap((c) => (c.qcms ?? []).map((q) => q.id));

    if (candidateIds.length === 0) {
      throw new BadRequestException('No QCMs available for this subject and semester');
    }

    const picked = candidateIds
      .map((id) => ({ id, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map((x) => x.id)
      .slice(0, Math.min(questionCount, candidateIds.length));

    const qcms = await qcmRepo.find({
      where: { id: In(picked) },
      relations: { answers: true },
    });

    const ordered = picked
      .map((id) => qcms.find((q) => q.id === id))
      .filter((q): q is Qcm => !!q);

    const exam = this.examRepo.create({
      title: `${subject.name} – Semester ${semester.number}`,
      questionCount: ordered.length,
      durationMinutes,
      subject,
      semester,
      user
    });
    const savedExam = await this.examRepo.save(exam);

    const examQcms = ordered.map((qcm, idx) =>
      examQcmRepo.create({ exam: savedExam, qcm, order: idx }),
    );
    await examQcmRepo.save(examQcms);

    return this.getExam(savedExam.id);
  }

  /* ------------------------------------------------------------------ */
  /*  Exam reads                                                        */
  /* ------------------------------------------------------------------ */

  async findAll(): Promise<Exam[]> {
    return this.examRepo.find({
      relations: { semester: true, subject: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getExam(id: number): Promise<Exam> {
    const exam = await this.examRepo.findOne({
      where: { id },
      relations: {
        semester: true,
        subject: true,
        examQcms: { qcm: { answers: true } },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    exam.examQcms.sort((a, b) => a.order - b.order);
    return exam;
  }

  async getExamForStudent(id: number) {
    const exam = await this.getExam(id);
    return {
      id: exam.id,
      title: exam.title,
      questionCount: exam.questionCount,
      durationMinutes: exam.durationMinutes,
      subject: { id: exam.subject.id, name: exam.subject.name },
      semester: { id: exam.semester.id, number: exam.semester.number },
      questions: exam.examQcms.map((eq) => ({
        order: eq.order,
        qcmId: eq.qcm.id,
        question: eq.qcm.question,
        answers: (eq.qcm.answers ?? []).map((a) => ({ id: a.id, answer: a.answer })),
      })),
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Session lifecycle                                                 */
  /* ------------------------------------------------------------------ */

  async startSession(examId: number, userIdInput: UserIdInput): Promise<ExamSession> {
    const userId = this.normalizeUserId(userIdInput);
    const sessionRepo = this.dataSource.getRepository(ExamSession);

    const exam = await this.examRepo.findOne({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');

    const now = new Date();
    const session = sessionRepo.create({
      exam,
      userId,
      status: ExamSessionStatus.IN_PROGRESS,
      startedAt: now,
      lastActiveAt: now,
      currentQuestionIndex: 0,
      score: 0,
      totalTimeSpent: 0,
    });
    return sessionRepo.save(session);
  }

  async pauseSession(sessionId: number, userIdInput: UserIdInput): Promise<ExamSession> {
    const userId = this.normalizeUserId(userIdInput);
    const sessionRepo = this.dataSource.getRepository(ExamSession);

    const session = await this.assertOwner(sessionId, userId);
    if (session.status !== ExamSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }
    const now = new Date();
    session.totalTimeSpent += this.diffSeconds(session.lastActiveAt, now);
    session.lastActiveAt = null;
    session.pausedAt = now;
    session.status = ExamSessionStatus.PAUSED;
    return sessionRepo.save(session);
  }

  async resumeSession(sessionId: number, userIdInput: UserIdInput): Promise<ExamSession> {
    const userId = this.normalizeUserId(userIdInput);
    const sessionRepo = this.dataSource.getRepository(ExamSession);

    const session = await this.assertOwner(sessionId, userId);
    if (session.status !== ExamSessionStatus.PAUSED) {
      throw new BadRequestException('Session is not paused');
    }
    session.lastActiveAt = new Date();
    session.status = ExamSessionStatus.IN_PROGRESS;
    return sessionRepo.save(session);
  }

  async completeSession(sessionId: number, userIdInput: UserIdInput): Promise<ExamSession> {
    const userId = this.normalizeUserId(userIdInput);
    const sessionRepo = this.dataSource.getRepository(ExamSession);

    const session = await this.assertOwner(sessionId, userId);
    if (session.status === ExamSessionStatus.COMPLETED) {
      return session;
    }
    const now = new Date();
    if (session.status === ExamSessionStatus.IN_PROGRESS && session.lastActiveAt) {
      session.totalTimeSpent += this.diffSeconds(session.lastActiveAt, now);
    }
    session.lastActiveAt = null;
    session.completedAt = now;
    session.status = ExamSessionStatus.COMPLETED;
    return sessionRepo.save(session);
  }

  /* ------------------------------------------------------------------ */
  /*  Session delete                                                    */
  /* ------------------------------------------------------------------ */

  async deleteSession(
    sessionId: number,
    userIdInput: UserIdInput,
  ): Promise<{ success: true }> {
    const userId = this.normalizeUserId(userIdInput);
    const sessionRepo = this.dataSource.getRepository(ExamSession);

    const session = await sessionRepo.findOne({
      where: { id: sessionId, user: { id: userId } },
    });
    if (!session) throw new NotFoundException('Session not found');

    await sessionRepo.remove(session);
    return { success: true };
  }

  /* ------------------------------------------------------------------ */
  /*  Answering (does NOT reveal correctness to the client)             */
  /* ------------------------------------------------------------------ */

  async submitAnswer(
    sessionId: number,
    userIdInput: UserIdInput,
    dto: SubmitAnswerDto,
  ) {
    const userId = this.normalizeUserId(userIdInput);

    const examQcmRepo = this.dataSource.getRepository(ExamQcm);
    const answerRepo = this.dataSource.getRepository(ExamSessionAnswer);
    const sessionRepo = this.dataSource.getRepository(ExamSession);

    const session = await this.assertOwner(sessionId, userId);
    if (session.status !== ExamSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is paused or completed');
    }

    const examQcm = await examQcmRepo.findOne({
      where: { exam: { id: session.exam.id }, qcm: { id: dto.qcmId } },
      relations: { qcm: { answers: true } },
    });
    if (!examQcm) throw new BadRequestException('QCM does not belong to this exam');

    // ---- normalize input ----
    const requestedIds = Array.from(new Set(dto.selectedAnswerIds ?? []));
    const allQcmAnswers = examQcm.qcm.answers ?? [];

    const selectedAnswers = requestedIds
      .map((id) => allQcmAnswers.find((a) => a.id === id))
      .filter((a): a is typeof allQcmAnswers[number] => !!a);

    if (selectedAnswers.length !== requestedIds.length) {
      throw new BadRequestException(
        'One or more selected answers do not belong to this QCM',
      );
    }

    // ---- grade: exact match required ----
    const correctIds = allQcmAnswers
      .filter((a) => a.isCorrect)
      .map((a) => a.id)
      .sort((a, b) => a - b);

    const sortedSelectedIds = selectedAnswers
      .map((a) => a.id)
      .sort((a, b) => a - b);

    const isSkipped = sortedSelectedIds.length === 0;

    const isCorrect =
      !isSkipped &&
      correctIds.length === sortedSelectedIds.length &&
      correctIds.every((id, i) => id === sortedSelectedIds[i]);

    // ---- persist ----
    let answer = await answerRepo.findOne({
      where: { session: { id: session.id }, qcm: { id: dto.qcmId } },
    });

    if (!answer) {
      answer = answerRepo.create({
        session,
        qcm: examQcm.qcm,
        selectedAnswers,
        isCorrect,
        isSkipped,
        timeSpent: dto.timeSpent ?? 0,
      });
    } else {
      if (answer.isCorrect) session.score -= 1;
      answer.selectedAnswers = selectedAnswers;
      answer.isCorrect = isCorrect;
      answer.isSkipped = isSkipped;
      answer.timeSpent = dto.timeSpent ?? answer.timeSpent;
    }

    if (isCorrect) session.score += 1;
    session.currentQuestionIndex = Math.max(
      session.currentQuestionIndex,
      examQcm.order + 1,
    );

    await answerRepo.save(answer);
    await sessionRepo.save(session);

    // No correctness revealed to the client.
    return {
      qcmId: examQcm.qcm.id,
      selectedAnswerIds: sortedSelectedIds,
      isSkipped,
      currentQuestionIndex: session.currentQuestionIndex,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Progress & results                                                */
  /* ------------------------------------------------------------------ */

  async getSessionProgress(sessionId: number, userIdInput: UserIdInput) {
    const userId = this.normalizeUserId(userIdInput);

    const session = await this.assertOwner(sessionId, userId, {
      exam: {
        subject: true,
        semester: true,
        examQcms: { qcm: { answers: true } },
      },
      answers: { qcm: true, selectedAnswers: true },
    });
    session.exam.examQcms.sort((a, b) => a.order - b.order);

    const reveal = session.status === ExamSessionStatus.COMPLETED;
    const answeredMap = new Map(session.answers.map((a) => [a.qcm.id, a]));

    return {
      sessionId: session.id,
      status: session.status,
      startedAt: session.startedAt,
      lastActiveAt: session.lastActiveAt,
      pausedAt: session.pausedAt,
      completedAt: session.completedAt,
      totalTimeSpent: session.totalTimeSpent,
      currentQuestionIndex: session.currentQuestionIndex,
      score: reveal ? session.score : undefined,
      totalQuestions: session.exam.questionCount,
      durationMinutes: session.exam.durationMinutes,
      exam: {
        id: session.exam.id,
        title: session.exam.title,
        durationMinutes: session.exam.durationMinutes,
        subject: session.exam.subject,
        semester: session.exam.semester,
      },
      questions: session.exam.examQcms.map((eq) => {
        const given = answeredMap.get(eq.qcm.id);
        const answered = !!given;
        return {
          order: eq.order,
          qcmId: eq.qcm.id,
          question: eq.qcm.question,
          answers: (eq.qcm.answers ?? []).map((a) => ({
            id: a.id,
            answer: a.answer,
            ...(reveal
              ? { isCorrect: a.isCorrect, explanation: a.explanation }
              : {}),
          })),
          userAnswer: answered
            ? {
              selectedAnswerIds:
                given.selectedAnswers?.map((a) => a.id) ?? [],
              isSkipped: given.isSkipped,
              answeredAt: given.answeredAt,
              ...(reveal ? { isCorrect: given.isCorrect } : {}),
            }
            : null,
        };
      }),
    };
  }
  async getSessionResults(sessionId: number, userIdInput: UserIdInput) {
    const userId = this.normalizeUserId(userIdInput);
    const progress = await this.getSessionProgress(sessionId, userId);
    const total = progress.totalQuestions;
    const correct = progress.score ?? 0;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      ...progress,
      percentage: pct,
      correctCount: correct,
      wrongCount: progress.questions.filter(
        (q) => q.userAnswer && q.userAnswer.isCorrect === false && !q.userAnswer.isSkipped,
      ).length,
      skippedCount: progress.questions.filter((q) => q.userAnswer?.isSkipped).length,
      unansweredCount: progress.questions.filter((q) => !q.userAnswer).length,
    };
  }

  async getUserSessions(userIdInput: UserIdInput) {
    const userId = this.normalizeUserId(userIdInput);
    const sessionRepo = this.dataSource.getRepository(ExamSession);
    return sessionRepo.find({
      where: { user: { id: userId } },
      relations: { exam: { subject: true, semester: true } },
      order: { createdAt: 'DESC' },
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                           */
  /* ------------------------------------------------------------------ */

  private normalizeUserId(input: UserIdInput): string {
    if (typeof input === 'string' && input.length > 0) return input;
    if (input && typeof input === 'object') {
      const id = (input as any).id;
      if (typeof id === 'string' && id.length > 0) return id;
    }
    throw new BadRequestException('Invalid user identifier');
  }

  private async assertOwner(
    sessionId: number,
    userId: string,
    extraRelations: FindOptionsRelations<ExamSession> = {},
  ): Promise<ExamSession> {
    const sessionRepo = this.dataSource.getRepository(ExamSession);

    const relations = this.mergeRelations<ExamSession>(
      { exam: { subject: true, semester: true } },
      extraRelations,
    );

    const session = await sessionRepo.findOne({
      where: { id: sessionId },
      relations,
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    return session;
  }

  private mergeRelations<T>(
    base: FindOptionsRelations<T>,
    extra: FindOptionsRelations<T>,
  ): FindOptionsRelations<T> {
    const result: any = { ...base };
    for (const [key, value] of Object.entries(extra)) {
      const existing = result[key];
      if (
        existing &&
        typeof existing === 'object' &&
        value &&
        typeof value === 'object'
      ) {
        result[key] = this.mergeRelations(existing, value as any);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private diffSeconds(from: Date | null, to: Date): number {
    if (!from) return 0;
    return Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));
  }

  private async resolveYearScope(userId: string): Promise<number | null> {
    const userRepo = this.dataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: { redeemCode: { year: true } },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const roleName = this.extractRoleName(user);
    const privileged = ['admin', 'owner', 'teacher'].includes(
      (roleName ?? '').toLowerCase(),
    );
    if (privileged) return null;

    const yearId =
      (user as any)?.redeemCode?.year?.id ?? (user as any)?.redeemCode?.yearId;
    return typeof yearId === 'number' ? yearId : null;
  }

  private extractRoleName(user: any): string | null {
    if (!user?.role) return null;
    return typeof user.role === 'string'
      ? user.role
      : user.role?.name ?? user.role?.label ?? null;
  }
}