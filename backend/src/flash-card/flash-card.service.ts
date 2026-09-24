import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { Qcm } from 'src/qcm/entities/qcm.entity';
import { Medicament } from 'src/medicament/entities/medicament.entity';
import { Year } from 'src/year/entities/year.entity';
import { User } from 'src/user/entities/user.entity';
import { DailyFlashcard } from './entities/flash-card.entity';

@Injectable()
export class FlashcardService {
  constructor(
    @InjectRepository(DailyFlashcard)
    private readonly flashcardRepo: Repository<DailyFlashcard>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) { }

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Sept–Jan → 1, Feb–Mar → 2, Apr–Jul → 3, Aug → null */
  getCurrentSemesterNumber(date = new Date()): number | null {
    const month = date.getUTCMonth() + 1;
    if (month >= 9 || month === 1) return 1;
    if (month === 2 || month === 3) return 2;
    if (month >= 4 && month <= 7) return 3;
    return null;
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  async getTodayCardForUser(userId: string) {
    const date = this.today();

    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: { redeemCode: { year: true } },
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.translate('errors.user.not_found', {
          lang: this.currentLang,
        }),
      );
    }

    let yearId: number | null =
      (user as any)?.redeemCode?.year?.id ??
      (user as any)?.redeemCode?.yearId ??
      null;

    if (!yearId) {
      const [firstYear] = await this.dataSource
        .getRepository(Year)
        .find({ order: { id: 'ASC' }, take: 1 });
      yearId = firstYear?.id ?? null;
    }

    if (!yearId) return null;

    return this.getOrCreateCard(yearId, date);
  }

  async getOrCreateCard(yearId: number, date = this.today()) {
    const relations = {
      year: true,
      qcm: { answers: true, course: true, td: true, tp: true },
      medicament: { image: true },
    } as const;

    let card = await this.flashcardRepo.findOne({
      where: { yearId, date },
      relations,
    });

    if (!card) {
      const created = await this.generateForYear(yearId, date);
      if (!created) return null;

      card = await this.flashcardRepo.findOne({
        where: { id: created.id },
        relations,
      });
    }

    return card ? this.serialize(card) : null;
  }

  /* ------------------------------------------------------------------ */
  /* Generation                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Picks ONE QCM (from the current semester's courses) and ONE medicament
   * for the given year + date. Either can be `null` if that pool is empty.
   *
   * If both are empty → returns `null` (nothing to show).
   */
  async generateForYear(
    yearId: number,
    date = this.today(),
  ): Promise<DailyFlashcard | null> {
    const existing = await this.flashcardRepo.findOne({
      where: { yearId, date },
    });
    if (existing) return existing;

    // ---- Pick a QCM ----
    const semesterNumber = this.getCurrentSemesterNumber(
      new Date(date + 'T12:00:00Z'),
    );
    const qcm = await this.pickQcmForYear(yearId, semesterNumber);

    // ---- Pick a medicament ----
    const medicament = await this.pickRandomMedicament();

    // ---- Nothing at all? bail ----
    if (!qcm && !medicament) return null;

    try {
      const flashcard = this.flashcardRepo.create({
        yearId,
        date,
        qcmId: qcm?.id ?? null,
        medicamentId: medicament?.id ?? null,
        semesterNumber: qcm ? semesterNumber : null,
      });
      return await this.flashcardRepo.save(flashcard);
    } catch (e: any) {
      if (e?.code === '23505') {
        // Race — another request created it first
        return this.flashcardRepo.findOne({ where: { yearId, date } });
      }
      throw e;
    }
  }

  /**
   * Generates a card for every year.
   * Pass `force: true` to overwrite today's already-existing cards.
   */
  async generateForAllYears(date = this.today(), force = false) {
    const years = await this.dataSource
      .getRepository(Year)
      .find({ order: { id: 'ASC' } });

    const results: {
      yearId: number;
      yearName: string;
      created: boolean;
      qcmId: number | null;
      medicamentId: number | null;
    }[] = [];

    for (const year of years) {
      const existing = await this.flashcardRepo.findOne({
        where: { yearId: year.id, date },
        select: { id: true },
      });

      if (existing && !force) {
        results.push({
          yearId: year.id,
          yearName: year.name,
          created: false,
          qcmId: null,
          medicamentId: null,
        });
        continue;
      }

      if (existing && force) {
        await this.flashcardRepo.delete({ yearId: year.id, date });
      }

      const card = await this.generateForYear(year.id, date);
      results.push({
        yearId: year.id,
        yearName: year.name,
        created: !!card,
        qcmId: card?.qcmId ?? null,
        medicamentId: card?.medicamentId ?? null,
      });
    }

    return {
      date,
      semesterNumber: this.getCurrentSemesterNumber(
        new Date(date + 'T12:00:00Z'),
      ),
      forced: force,
      years: results,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Picking helpers                                                     */
  /* ------------------------------------------------------------------ */

  /** QCM from the current semester, fallback to any QCM of the year. */
  private async pickQcmForYear(
    yearId: number,
    semesterNumber: number | null,
  ): Promise<Qcm | null> {
    if (semesterNumber != null) {
      const inSemester = await this.dataSource
        .getRepository(Qcm)
        .createQueryBuilder('qcm')
        .innerJoin('qcm.course', 'course')
        .innerJoin('course.semester', 'semester')
        .where('semester.yearId = :yearId', { yearId })
        .andWhere('semester.number = :semesterNumber', { semesterNumber })
        .orderBy('RANDOM()')
        .limit(1)
        .getOne();

      if (inSemester) return inSemester;
    }

    return this.dataSource
      .getRepository(Qcm)
      .createQueryBuilder('qcm')
      .leftJoin('qcm.course', 'course')
      .leftJoin('course.subject', 'courseSubject')
      .leftJoin('qcm.td', 'td')
      .leftJoin('td.subject', 'tdSubject')
      .leftJoin('qcm.tp', 'tp')
      .leftJoin('tp.subject', 'tpSubject')
      .where(
        'courseSubject.yearId = :yearId OR tdSubject.yearId = :yearId OR tpSubject.yearId = :yearId',
        { yearId },
      )
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
  }

  /** Pure random medicament. */
  private async pickRandomMedicament(): Promise<Medicament | null> {
    return this.dataSource
      .getRepository(Medicament)
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.image', 'image')
      .orderBy('RANDOM()')
      .limit(1)
      .getOne();
  }

  /* ------------------------------------------------------------------ */
  /* Serialization                                                       */
  /* ------------------------------------------------------------------ */

  private serialize(card: DailyFlashcard) {
    const q = (card.qcm ?? null) as any;
    const m = (card.medicament ?? null) as any;

    return {
      id: card.id,
      date: card.date,
      semesterNumber: card.semesterNumber,
      year: card.year
        ? { id: card.year.id, name: card.year.name }
        : null,

      qcm: q
        ? {
          id: q.id,
          question: q.question,
          answers: (q.answers ?? []).map((a: any) => ({
            id: a.id,
            answer: a.answer,
            isCorrect: a.isCorrect,
            explanation: a.explanation ?? null,
          })),
          course: q.course
            ? { id: q.course.id, name: q.course.name }
            : null,
          td: q.td ? { id: q.td.id, name: q.td.name } : null,
          tp: q.tp ? { id: q.tp.id, name: q.tp.name } : null,
        }
        : null,

      medicament: m
        ? {
          id: m.id,
          name: m.name,
          dci: m.dci ?? null,
          therapeuticClass: m.therapeuticClass ?? null,
          form: m.form ?? null,
          dosage: m.dosage ?? null,
          indication: m.indication ?? null,
          contraindications: m.contraindications ?? null,
          sideEffects: m.sideEffects ?? null,
          posology: m.posology ?? null,
          notes: m.notes ?? null,
          image: m.image
            ? {
              id: m.image.id,
              url: m.image.url,
              width: m.image.width,
              height: m.image.height,
            }
            : null,
        }
        : null,
    };
  }
}