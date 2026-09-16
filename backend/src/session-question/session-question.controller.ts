import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SessionQuestionService } from './session-question.service';
import { CreateSessionQuestionDto } from './dto/create-session-question.dto';
import { UpdateSessionQuestionDto } from './dto/update-session-question.dto';

@Controller('session-question')
export class SessionQuestionController {
  constructor(private readonly sessionQuestionService: SessionQuestionService) {}

  @Post()
  create(@Body() createSessionQuestionDto: CreateSessionQuestionDto) {
    return this.sessionQuestionService.create(createSessionQuestionDto);
  }

  @Get()
  findAll() {
    return this.sessionQuestionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionQuestionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSessionQuestionDto: UpdateSessionQuestionDto) {
    return this.sessionQuestionService.update(+id, updateSessionQuestionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionQuestionService.remove(+id);
  }
}
