import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { SubscriptionGuard } from 'src/auth/guards/jwt-auth/subscription.guard';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) { }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectService.create(createSubjectDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.subjectService.findAll();
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get('student/')
  getSubjectsByStudent(@Req() req: any) {
    return this.subjectService.getSubjectsByStudent(req.user.id);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectService.findOne(+id);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectService.update(+id, updateSubjectDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectService.remove(+id);
  }
}
