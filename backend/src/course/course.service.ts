import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { DataSource, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Subject } from 'src/subject/entities/subject.entity';
import { Semester } from 'src/semester/entities/semester.entity';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    private readonly i18n: I18nService,
    private readonly dataSource: DataSource,
  ) {}
  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }
  async create(createCourseDto: CreateCourseDto) {
    const subject = await this.dataSource.getRepository(Subject).findOneBy({
      id: createCourseDto.subjectId,
    });
    if (!subject) {
      throw new NotFoundException(
        this.i18n.translate('errors.subject.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    const semester = await this.dataSource
      .getRepository(Semester)
      .findOne({ where: { id: createCourseDto.semesterId } });
    if (!semester) {
      throw new NotFoundException(
        this.i18n.translate('errors.semester.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    const course = this.courseRepository.create({
      ...createCourseDto,
      semester,
      subject,
    });
    return this.courseRepository.save(course);
  }

  async findAll() {
    return await this.courseRepository.find();
  }

  async findOne(id: number) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: { subject: true, qcms: true, semester: true },
    });
    if (!course) {
      throw new NotFoundException(
        this.i18n.translate('errors.course.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return course;
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    console.log('updateCourseDto', updateCourseDto);
    const course = await this.findOne(id);
    const newCourse = Object.assign(course, updateCourseDto);
    console.log('newCourse', newCourse);
    if (updateCourseDto.semesterId) {
      const semester = await this.dataSource.getRepository(Semester).findOneBy({
        id: updateCourseDto.semesterId,
      });
      if (!semester) {
        throw new NotFoundException(
          this.i18n.translate('errors.semester.not_found', {
            lang: this.currentLang,
          }),
        );
      }
      newCourse.semester = semester;
    }
    if (updateCourseDto.subjectId) {
      const subject = await this.dataSource.getRepository(Subject).findOneBy({
        id: updateCourseDto.subjectId,
      });
      if (!subject) {
        throw new NotFoundException(
          this.i18n.translate('errors.subject.not_found', {
            lang: this.currentLang,
          }),
        );
      }
      newCourse.subject = subject;
    }
    return this.courseRepository.save(newCourse);
  }

  async remove(id: number) {
    const course = await this.findOne(id);
    return this.courseRepository.remove(course);
  }
}
