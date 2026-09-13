import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateYearDto } from './dto/create-year.dto';
import { UpdateYearDto } from './dto/update-year.dto';
import { Repository } from 'typeorm';
import { Year } from './entities/year.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class YearService {
  constructor(
    @InjectRepository(Year) private readonly yearRepository: Repository<Year>,
    private readonly i18n: I18nService,
  ) {}

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }
  async create(createYearDto: CreateYearDto) {
    const year = this.yearRepository.create(createYearDto);
    return await this.yearRepository.save(year);
  }

  async findAll() {
    return await this.yearRepository.find({
      relations: { semesters: true, subjects: true },
    });
  }

  async findOne(id: number) {
    const year = await this.yearRepository.findOne({
      where: { id },
      relations: {
        semesters: true,
        subjects: { courses: true, tds: true, tps: true },
      },
    });
    if (!year) {
      throw new NotFoundException(
        this.i18n.translate('errors.year.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return year;
  }

  async update(id: number, updateYearDto: UpdateYearDto) {
    const year = await this.yearRepository.preload({
      id,
      ...updateYearDto,
    });
    if (!year) {
      throw new NotFoundException(
        this.i18n.translate('errors.year.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return await this.yearRepository.save(year);
  }

  async remove(id: number) {
    const year = await this.findOne(id);
    return await this.yearRepository.remove(year);
  }
}
