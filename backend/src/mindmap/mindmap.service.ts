import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMindmapDto } from './dto/create-mindmap.dto';
import { UpdateMindmapDto } from './dto/update-mindmap.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Mindmap } from './entities/mindmap.entity';
import { DataSource, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Summary } from 'src/summary/entities/summary.entity';

@Injectable()
export class MindmapService {
  constructor(
    @InjectRepository(Mindmap)
    private readonly mindmapRepository: Repository<Mindmap>,
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) { }

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  async create(createMindmapDto: CreateMindmapDto) {
    const summary = await this.dataSource
      .getRepository(Summary)
      .findOne({ where: { id: createMindmapDto.summaryId } });

    if (!summary) {
      // ⚠️ was returning a string — that's why the frontend saw status: true
      //    with a random string payload. Throw instead.
      throw new NotFoundException(
        this.i18n.translate('errors.summary.not_found', {
          lang: this.currentLang,
        }),
      );
    }

    const mindmap = this.mindmapRepository.create({
      ...createMindmapDto,
      summary,
    });
    return await this.mindmapRepository.save(mindmap);
  }

  async findAll() {
    return await this.mindmapRepository.find({
      relations: { summary: true },
    });
  }

  async findOne(id: number) {
    const mindmap = await this.mindmapRepository.findOne({
      where: { id },
      relations: { summary: true },
    });
    if (!mindmap) {
      throw new NotFoundException(
        this.i18n.translate('errors.mindmap.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return mindmap;
  }

  async update(id: number, updateMindmapDto: UpdateMindmapDto) {
    const mindmap = await this.mindmapRepository.preload({
      id,
      ...updateMindmapDto,
    });
    if (!mindmap) {
      throw new NotFoundException(
        this.i18n.translate('errors.mindmap.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return await this.mindmapRepository.save(mindmap);
  }

  async remove(id: number) {
    const mindmap = await this.findOne(id);
    return await this.mindmapRepository.remove(mindmap);
  }

  /**
   * Returns the single mindmap attached to a course, or null.
   *
   * Previously this used `find()` → returned an array → frontend's
   * `unwrapEntity` treats arrays as invalid → returned null.
   */
  async findByCourseId(courseId: number): Promise<Mindmap | null> {
    return await this.mindmapRepository.findOne({
      where: { summary: { course: { id: courseId } } },
      relations: { summary: true },
    });
  }
}