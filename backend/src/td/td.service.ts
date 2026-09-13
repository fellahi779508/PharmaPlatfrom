import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateTdDto } from './dto/create-td.dto';
import { UpdateTdDto } from './dto/update-td.dto';
import { Td } from './entities/td.entity';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Subject } from 'src/subject/entities/subject.entity';

@Injectable()
export class TdService {
  constructor(
    @InjectRepository(Td)
    private readonly tdRepository: Repository<Td>,
    private readonly i18n: I18nService,
    private readonly dataSource: DataSource,
  ) {}

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  async create(createTdDto: CreateTdDto) {
    const subject = await this.dataSource
      .getRepository('subject')
      .findOne({ where: { id: createTdDto.subjectId } });
    if (!subject) {
      throw new NotFoundException(
        this.i18n.t('errors.subject.not_found', { lang: this.currentLang }),
      );
    }

    const td = this.tdRepository.create({ ...createTdDto, subject });
    return this.tdRepository.save(td);
  }

  async findAll() {
    return this.tdRepository.find();
  }

  async findOne(id: number) {
    const td = await this.tdRepository.findOne({
      where: { id },
      relations: { subject: true, qcms: true },
    });
    if (!td) {
      throw new NotFoundException(
        this.i18n.t('errors.td.not_found', { lang: this.currentLang }),
      );
    }
    return td;
  }

  async update(id: number, updateTdDto: UpdateTdDto) {
    const td = await this.findOne(id);
    Object.assign(td, updateTdDto);
    if (updateTdDto.subjectId) {
      const subject = await this.dataSource
        .getRepository(Subject)
        .findOne({ where: { id: updateTdDto.subjectId } });
      if (!subject) {
        throw new NotFoundException(
          this.i18n.t('errors.subject.not_found', { lang: this.currentLang }),
        );
      }
      td.subject = subject;
    }
    return this.tdRepository.save(td);
  }

  async remove(id: number) {
    const td = await this.findOne(id);
    return this.tdRepository.remove(td);
  }
}
