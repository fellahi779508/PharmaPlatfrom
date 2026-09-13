import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQcmAnswerDto } from './dto/create-qcm_answer.dto';
import { UpdateQcmAnswerDto } from './dto/update-qcm_answer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QcmAnswer } from './entities/qcm_answer.entity';
import { Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Qcm } from 'src/qcm/entities/qcm.entity';

@Injectable()
export class QcmAnswerService {
  constructor(
    @InjectRepository(QcmAnswer)
    private readonly qcmAnswerRepository: Repository<QcmAnswer>,
    private readonly i18n: I18nService,
  ) {}

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  async create(createQcmAnswerDto: CreateQcmAnswerDto) {
    const qcmAnswer = this.qcmAnswerRepository.create(createQcmAnswerDto);
    return await this.qcmAnswerRepository.save(qcmAnswer);
  }

  async findAll() {
    return await this.qcmAnswerRepository.find({
      relations: { qcm: true },
    });
  }

  async findOne(id: number) {
    const qcmAnswer = await this.qcmAnswerRepository.findOne({
      where: { id },
      relations: { qcm: true },
    });
    if (!qcmAnswer) {
      throw new NotFoundException(
        this.i18n.t('errors.qcm_answer.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return qcmAnswer;
  }

  async update(id: number, updateQcmAnswerDto: UpdateQcmAnswerDto) {
    const qcmAnswer = await this.findOne(id);
    const newQcmAnswer = Object.assign(qcmAnswer, updateQcmAnswerDto);
    return await this.qcmAnswerRepository.save(newQcmAnswer);
  }

  async remove(id: number) {
    const qcmAnswer = await this.findOne(id);
    return await this.qcmAnswerRepository.remove(qcmAnswer);
  }

  async findByQcm(qcmId: number) {
    return await this.qcmAnswerRepository.find({
      where: { qcm: { id: qcmId } },
    });
  }
}
