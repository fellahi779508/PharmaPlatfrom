import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Semester } from './entities/semester.entity';
import { DataSource, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Year } from 'src/year/entities/year.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class SemesterService {
  constructor(
    @InjectRepository(Semester)
    private readonly semesterRepository: Repository<Semester>,
    private readonly i18n: I18nService,
    private readonly dataSource: DataSource,
  ) { }

  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  async create(createSemesterDto: CreateSemesterDto) {
    const year = await this.dataSource.getRepository(Year).findOneBy({
      id: createSemesterDto.yearId,
    });
    if (!year) {
      throw new NotFoundException(
        this.i18n.translate('errors.year.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    const semester = this.semesterRepository.create({
      ...createSemesterDto,
      year,
    });
    return this.semesterRepository.save(semester);
  }

  async findAll() {
    return this.semesterRepository.find({
      relations: { courses: { subject: true }, year: true },
    });
  }

  async findOne(id: number) {
    const semseter = await this.semesterRepository.findOne({
      where: { id },
      relations: { courses: true },
    });
    if (!semseter)
      throw new NotFoundException(
        this.i18n.translate('errors.semester.not_found', {
          lang: this.currentLang,
        }),
      );
    return semseter;
  }

  async update(id: number, updateSemesterDto: UpdateSemesterDto) {
    const semester = await this.findOne(id);
    const newSemester = Object.assign(semester, updateSemesterDto);
    if (updateSemesterDto.yearId) {
      const year = await this.dataSource.getRepository(Year).findOneBy({
        id: updateSemesterDto.yearId,
      });
      if (!year) {
        throw new NotFoundException(
          this.i18n.translate('errors.year.not_found', {
            lang: this.currentLang,
          }),
        );
      }
      newSemester.year = year;
    }

    return this.semesterRepository.save(newSemester);
  }

  async remove(id: number) {
    const semester = await this.findOne(id);
    return this.semesterRepository.remove(semester);
  }
  async getSemestersByStudent(studentId: string) {
    const user = await this.dataSource.getRepository(User).findOne({
      where: {
        id: studentId,
      },
      relations: { redeemCode: { year: true } },
    });
    if (!user) {
      throw new NotFoundException(
        this.i18n.t('errors.user.not_found', { lang: this.currentLang }),
      );
    }
    if (user.redeemCode) {

      const semesters = await this.semesterRepository.find({
        relations: { year: true },
        where: { year: { id: user.redeemCode.year.id } },
      });

      return semesters;
    }

  }
}
