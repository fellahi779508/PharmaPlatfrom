import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { QcmAnswerService } from './qcm_answer.service';
import { CreateQcmAnswerDto } from './dto/create-qcm_answer.dto';
import { UpdateQcmAnswerDto } from './dto/update-qcm_answer.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { SubscriptionGuard } from 'src/auth/guards/jwt-auth/subscription.guard';

@Controller('qcm-answer')
export class QcmAnswerController {
  constructor(private readonly qcmAnswerService: QcmAnswerService) { }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createQcmAnswerDto: CreateQcmAnswerDto) {
    return this.qcmAnswerService.create(createQcmAnswerDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.qcmAnswerService.findAll();
  }


  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.qcmAnswerService.findOne(+id);
  }


  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQcmAnswerDto: UpdateQcmAnswerDto) {
    return this.qcmAnswerService.update(+id, updateQcmAnswerDto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.qcmAnswerService.remove(+id);
  }
}
