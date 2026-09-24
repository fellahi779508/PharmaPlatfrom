import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { SubscriptionGuard } from 'src/auth/guards/jwt-auth/subscription.guard';

@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) { }

  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.create(createCourseDto);
  }

  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.courseService.findAll();
  }


  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get('subject/:subjectId')
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.courseService.findBySubject(+subjectId);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(+id);
  }

  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.update(+id, updateCourseDto);
  }

  @Roles(Role.ADMIN, Role.OWNER, Role.TEACHER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseService.remove(+id);
  }
}
