import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QcmService } from './qcm.service';
import { CreateQcmDto } from './dto/create-qcm.dto';
import { UpdateQcmDto } from './dto/update-qcm.dto';

@Controller('qcm')
export class QcmController {
  constructor(private readonly qcmService: QcmService) {}

  @Post()
  create(@Body() createQcmDto: CreateQcmDto) {
    return this.qcmService.create(createQcmDto);
  }

  @Get()
  findAll() {
    return this.qcmService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qcmService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQcmDto: UpdateQcmDto) {
    return this.qcmService.update(+id, updateQcmDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.qcmService.remove(+id);
  }
}
