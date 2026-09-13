import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { Repository, DataSource } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Year } from 'src/year/entities/year.entity';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject) private subjectRepository: Repository<Subject>,
    private readonly i18n: I18nService,
    private readonly dataSource: DataSource,
  ) {}

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }
  async create(createSubjectDto: CreateSubjectDto) {
    const year = await this.dataSource.getRepository(Year).findOneBy({
      id: createSubjectDto.yearId,
    });
    if (!year) {
      throw new NotFoundException(
        this.i18n.t('errors.year.not_found', { lang: this.currentLang }),
      );
    }
    const subject = this.subjectRepository.create({
      ...createSubjectDto,
      year,
    });
    return this.subjectRepository.save(subject);
  }

  async findAll() {
    return this.subjectRepository.find({
      relations: { courses: true, year: true },
    });
  }

  async findOne(id: number) {
    const subject = await this.subjectRepository.findOne({
      where: { id },
      relations: { courses: { qcms: true }, year: true, tds: true, tps: true },
    });
    if (!subject) {
      throw new NotFoundException(
        this.i18n.t('errors.subject.not_found', { lang: this.currentLang }),
      );
    }
    return subject;
  }

  async update(id: number, updateSubjectDto: UpdateSubjectDto) {
    const subject = await this.findOne(id);
    const newSubject = Object.assign(subject, updateSubjectDto);
    if (updateSubjectDto.yearId) {
      const year = await this.dataSource
        .getRepository(Year)
        .findOne({ where: { id: updateSubjectDto.yearId } });
      if (!year) {
        throw new NotFoundException(
          this.i18n.t('errors.year.not_found', { lang: this.currentLang }),
        );
      }
      newSubject.year = year;
    }

    return this.subjectRepository.save(newSubject);
  }

  async remove(id: number) {
    const subject = await this.findOne(id);
    return this.subjectRepository.remove(subject);
  }
}
