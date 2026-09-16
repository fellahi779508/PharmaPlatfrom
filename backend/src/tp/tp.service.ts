import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTpDto } from './dto/create-tp.dto';
import { UpdateTpDto } from './dto/update-tp.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tp } from './entities/tp.entity';
import { DataSource, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Subject } from 'src/subject/entities/subject.entity';

@Injectable()
export class TpService {
  constructor(
    @InjectRepository(Tp)
    private readonly tpRepository: Repository<Tp>,
    private readonly i18n: I18nService,
    private readonly dataSource: DataSource,
  ) { }

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  async create(createTpDto: CreateTpDto) {
    const subject = await this.dataSource
      .getRepository('subject')
      .findOne({ where: { id: createTpDto.subjectId } });
    if (!subject) {
      throw new NotFoundException(
        this.i18n.t('errors.subject.not_found', { lang: this.currentLang }),
      );
    }

    const tp = this.tpRepository.create({ ...createTpDto, subject });
    return this.tpRepository.save(tp);
  }

  async findAll() {
    return this.tpRepository.find();
  }

  async findOne(id: number) {
    const tp = await this.tpRepository.findOne({
      where: { id },
      relations: { subject: true, qcms: true },
    });
    if (!tp) {
      throw new NotFoundException(
        this.i18n.t('errors.tp.not_found', { lang: this.currentLang }),
      );
    }
    return tp;
  }

  async update(id: number, updateTpDto: UpdateTpDto) {
    const tp = await this.findOne(id);
    Object.assign(tp, updateTpDto);
    if (updateTpDto.subjectId) {
      const subject = await this.dataSource
        .getRepository(Subject)
        .findOne({ where: { id: updateTpDto.subjectId } });
      if (!subject) {
        throw new NotFoundException(
          this.i18n.t('errors.subject.not_found', { lang: this.currentLang }),
        );
      }
      tp.subject = subject;
    }
    return this.tpRepository.save(tp);
  }

  async remove(id: number) {
    const tp = await this.findOne(id);
    return this.tpRepository.remove(tp);
  }
  async getTpsBySubject(subjectId: number) {
    return this.tpRepository.find({
      where: { subject: { id: subjectId } },
      relations: { qcms: true },
    });
  }
}
