import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QcmAnswerService } from './qcm_answer.service';
import { CreateQcmAnswerDto } from './dto/create-qcm_answer.dto';
import { UpdateQcmAnswerDto } from './dto/update-qcm_answer.dto';

@Controller('qcm-answer')
export class QcmAnswerController {
  constructor(private readonly qcmAnswerService: QcmAnswerService) {}

  @Post()
  create(@Body() createQcmAnswerDto: CreateQcmAnswerDto) {
    return this.qcmAnswerService.create(createQcmAnswerDto);
  }

  @Get()
  findAll() {
    return this.qcmAnswerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qcmAnswerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQcmAnswerDto: UpdateQcmAnswerDto) {
    return this.qcmAnswerService.update(+id, updateQcmAnswerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.qcmAnswerService.remove(+id);
  }
}
