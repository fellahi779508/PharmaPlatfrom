import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Todo } from './entities/todo.entity';
import { DataSource, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo) private todoRepository: Repository<Todo>,
    private readonly i18n: I18nService,
    private readonly dataSource: DataSource,
  ) {}
  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }
  async create(createTodoDto: CreateTodoDto, userId: string) {
    const currentUser = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: userId } });
    if (!currentUser) {
      throw new NotFoundException(
        this.i18n.translate('errors.user.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    const todo = this.todoRepository.create({
      ...createTodoDto,
      user: currentUser,
    });
    return this.todoRepository.save(todo);
  }

  async findAll() {
    return this.todoRepository.find();
  }

  async findOne(id: number) {
    const todo = await this.todoRepository.findOne({
      where: { id },
      relations: { tasks: true },
    });
    if (!todo) {
      throw new NotFoundException(
        this.i18n.translate('errors.todo.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return todo;
  }

  async update(id: number, updateTodoDto: UpdateTodoDto) {
    const todo = await this.todoRepository.preload({ id, ...updateTodoDto });
    if (!todo) {
      throw new NotFoundException(
        this.i18n.translate('errors.todo.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return this.todoRepository.save(todo);
  }

  async remove(id: number) {
    const todo = await this.findOne(id);
    return this.todoRepository.remove(todo);
  }

  async getTodoListsOfUser(userId: string) {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: { todos: { tasks: true } },
    });
    if (!user) {
      throw new NotFoundException(
        this.i18n.translate('errors.user.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    return user?.todos || [];
  }
}
