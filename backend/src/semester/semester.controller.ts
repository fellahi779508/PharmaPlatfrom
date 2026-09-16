import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SemesterService } from './semester.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('semester')
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) { }

  @Post()
  create(@Body() createSemesterDto: CreateSemesterDto) {
    return this.semesterService.create(createSemesterDto);
  }

  @Get()
  findAll() {
    return this.semesterService.findAll();
  }

  @Get('student')
  getSemestersByStudent(@Req() req: any) {
    return this.semesterService.getSemestersByStudent(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.semesterService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSemesterDto: UpdateSemesterDto,
  ) {
    return this.semesterService.update(+id, updateSemesterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.semesterService.remove(+id);
  }
}
