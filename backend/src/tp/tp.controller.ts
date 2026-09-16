import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TpService } from './tp.service';
import { CreateTpDto } from './dto/create-tp.dto';
import { UpdateTpDto } from './dto/update-tp.dto';

@Controller('tp')
export class TpController {
  constructor(private readonly tpService: TpService) { }

  @Post()
  create(@Body() createTpDto: CreateTpDto) {
    return this.tpService.create(createTpDto);
  }

  @Get()
  findAll() {
    return this.tpService.findAll();
  }
  @Get('subject/:subjectId')
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.tpService.getTpsBySubject(+subjectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tpService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTpDto: UpdateTpDto) {
    return this.tpService.update(+id, updateTpDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tpService.remove(+id);
  }
}
