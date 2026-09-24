import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { SubscriptionGuard } from 'src/auth/guards/jwt-auth/subscription.guard';

@UseGuards(JwtAuthGuard)
@Controller('todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) { }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Post()
  create(@Body() createTodoDto: CreateTodoDto, @Req() req: any) {
    return this.todoService.create(createTodoDto, req.user.id);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.todoService.findAll();
  }
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get('user/me')
  getTodoListsOfUser(@Req() req: any) {
    return this.todoService.getTodoListsOfUser(req.user.id);
  }


  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todoService.findOne(+id);
  }


  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    return this.todoService.update(+id, updateTodoDto);
  }
  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.todoService.remove(+id);
  }
}
