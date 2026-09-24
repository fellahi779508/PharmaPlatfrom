import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SessionQuestionAnswerService } from './session-question-answer.service';
import { CreateSessionQuestionAnswerDto } from './dto/create-session-question-answer.dto';
import { UpdateSessionQuestionAnswerDto } from './dto/update-session-question-answer.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { SubscriptionGuard } from 'src/auth/guards/jwt-auth/subscription.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';

@Controller('session-question-answer')
export class SessionQuestionAnswerController {
  constructor(private readonly sessionQuestionAnswerService: SessionQuestionAnswerService) { }


  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Post()
  create(@Body() createSessionQuestionAnswerDto: CreateSessionQuestionAnswerDto) {
    return this.sessionQuestionAnswerService.create(createSessionQuestionAnswerDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.sessionQuestionAnswerService.findAll();
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionQuestionAnswerService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSessionQuestionAnswerDto: UpdateSessionQuestionAnswerDto) {
    return this.sessionQuestionAnswerService.update(+id, updateSessionQuestionAnswerDto);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionQuestionAnswerService.remove(+id);
  }
}
