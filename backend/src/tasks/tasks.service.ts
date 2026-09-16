import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { DataSource, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Todo } from 'src/todo/entities/todo.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    private readonly i18n: I18nService,
    private readonly dataSource: DataSource,
  ) {}
  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }
  async create(createTaskDto: CreateTaskDto) {
    const todo = await this.dataSource.getRepository(Todo).findOne({
      where: { id: createTaskDto.todoId },
    });
    if (!todo) {
      throw new NotFoundException(
        this.i18n.translate('errors.todo.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    const task = this.taskRepo.create({ ...createTaskDto, todo });
    return this.taskRepo.save(task);
  }

  async findAll() {
    return this.taskRepo.find();
  }

  async findOne(id: number) {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(
        this.i18n.translate('errors.task.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.taskRepo.preload({ id, ...updateTaskDto });
    if (!task) {
      throw new NotFoundException(
        this.i18n.translate('errors.task.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return this.taskRepo.save(task);
  }

  async remove(id: number) {
    const task = await this.findOne(id);
    return this.taskRepo.remove(task);
  }

  async findByTodoId(todoId: number) {
    return this.taskRepo.find({
      where: { todo: { id: todoId } },
    });
  }
}
