import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TdService } from './td.service';
import { CreateTdDto } from './dto/create-td.dto';
import { UpdateTdDto } from './dto/update-td.dto';

@Controller('td')
export class TdController {
  constructor(private readonly tdService: TdService) { }

  @Post()
  create(@Body() createTdDto: CreateTdDto) {
    return this.tdService.create(createTdDto);
  }

  @Get()
  findAll() {
    return this.tdService.findAll();
  }
  @Get('subject/:subjectId')
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.tdService.getTdsBySubject(+subjectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tdService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTdDto: UpdateTdDto) {
    return this.tdService.update(+id, updateTdDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tdService.remove(+id);
  }
}
