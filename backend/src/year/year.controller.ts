import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { YearService } from './year.service';
import { CreateYearDto } from './dto/create-year.dto';
import { UpdateYearDto } from './dto/update-year.dto';

@Controller('year')
export class YearController {
  constructor(private readonly yearService: YearService) {}

  @Post()
  create(@Body() createYearDto: CreateYearDto) {
    return this.yearService.create(createYearDto);
  }

  @Get()
  findAll() {
    return this.yearService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.yearService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateYearDto: UpdateYearDto) {
    return this.yearService.update(+id, updateYearDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.yearService.remove(+id);
  }
}
