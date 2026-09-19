import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { UpdateSummaryDto } from './dto/update-summary.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Summary } from './entities/summary.entity';
import { DataSource, Repository } from 'typeorm';
import { Course } from 'src/course/entities/course.entity';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class SummaryService {
  constructor(
    @InjectRepository(Summary)
    private summaryRepository: Repository<Summary>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) { }

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  async create(createSummaryDto: CreateSummaryDto) {
    const course = await this.dataSource
      .getRepository(Course)
      .findOne({ where: { id: createSummaryDto.courseId } });

    if (!course) {
      throw new NotFoundException(
        this.i18n.translate('errors.course.not_found', {
          lang: this.currentLang,
        }),
      );
    }

    const summary = this.summaryRepository.create({
      text: createSummaryDto.text,
      course,
    });
    return this.summaryRepository.save(summary);
  }

  async findAll() {
    return this.summaryRepository.find({ relations: { mindmap: true } });
  }

  async findOne(id: number) {
    const summary = await this.summaryRepository.findOne({
      where: { id },
      relations: { course: true, mindmap: true },
    });
    if (!summary) {
      throw new NotFoundException(
        this.i18n.translate('errors.summary.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return summary;
  }

  /**
   * Returns the single summary of a course, or null.
   *
   * Previously this threw a 404 when the course had no summary yet.
   * That's not an error state — it's "empty". Returning null lets the
   * frontend distinguish "no summary yet" from "request failed".
   */
  async findOneByCourse(courseId: number): Promise<Summary | null> {
    return await this.summaryRepository.findOne({
      where: { course: { id: courseId } },
      relations: { course: true, mindmap: true },
    });
  }

  async update(id: number, updateSummaryDto: UpdateSummaryDto) {
    const summary = await this.summaryRepository.preload({
      id,
      text: updateSummaryDto.text,
    });
    if (!summary) {
      throw new NotFoundException(
        this.i18n.translate('errors.summary.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return this.summaryRepository.save(summary);
  }

  /**
   * Deletes the summary and (if present) its mindmap — in a transaction,
   * so a failure on either side rolls back both.
   */
  async remove(id: number) {
    return this.dataSource.transaction(async (manager) => {
      const summary = await manager.getRepository(Summary).findOne({
        where: { id },
        relations: { mindmap: true },
      });

      if (!summary) {
        throw new NotFoundException(
          this.i18n.translate('errors.summary.not_found', {
            lang: this.currentLang,
          }),
        );
      }

      // Delete mindmap first (child)
      if (summary.mindmap) {
        await manager.getRepository('Mindmap').delete({
          id: (summary.mindmap as any).id,
        });
      }

      await manager.getRepository(Summary).remove(summary);
      return { success: true };
    });
  }
}