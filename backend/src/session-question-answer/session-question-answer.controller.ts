import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SessionQuestionAnswerService } from './session-question-answer.service';
import { CreateSessionQuestionAnswerDto } from './dto/create-session-question-answer.dto';
import { UpdateSessionQuestionAnswerDto } from './dto/update-session-question-answer.dto';

@Controller('session-question-answer')
export class SessionQuestionAnswerController {
  constructor(private readonly sessionQuestionAnswerService: SessionQuestionAnswerService) {}

  @Post()
  create(@Body() createSessionQuestionAnswerDto: CreateSessionQuestionAnswerDto) {
    return this.sessionQuestionAnswerService.create(createSessionQuestionAnswerDto);
  }

  @Get()
  findAll() {
    return this.sessionQuestionAnswerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionQuestionAnswerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSessionQuestionAnswerDto: UpdateSessionQuestionAnswerDto) {
    return this.sessionQuestionAnswerService.update(+id, updateSessionQuestionAnswerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionQuestionAnswerService.remove(+id);
  }
}
