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
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { SubscriptionGuard } from 'src/auth/guards/jwt-auth/subscription.guard';

@UseGuards(JwtAuthGuard)
@Controller('semester')
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) { }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createSemesterDto: CreateSemesterDto) {
    return this.semesterService.create(createSemesterDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.semesterService.findAll();
  }


  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get('student')
  getSemestersByStudent(@Req() req: any) {
    return this.semesterService.getSemestersByStudent(req.user.id);
  }


  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.semesterService.findOne(+id);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSemesterDto: UpdateSemesterDto,
  ) {
    return this.semesterService.update(+id, updateSemesterDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.semesterService.remove(+id);
  }
}
