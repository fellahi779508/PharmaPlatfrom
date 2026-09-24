import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SessionQuestionService } from './session-question.service';
import { CreateSessionQuestionDto } from './dto/create-session-question.dto';
import { UpdateSessionQuestionDto } from './dto/update-session-question.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { SubscriptionGuard } from 'src/auth/guards/jwt-auth/subscription.guard';

@Controller('session-question')
export class SessionQuestionController {
  constructor(private readonly sessionQuestionService: SessionQuestionService) { }


  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Post()
  create(@Body() createSessionQuestionDto: CreateSessionQuestionDto) {
    return this.sessionQuestionService.create(createSessionQuestionDto);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get()
  findAll() {
    return this.sessionQuestionService.findAll();
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionQuestionService.findOne(+id);
  }


  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSessionQuestionDto: UpdateSessionQuestionDto) {
    return this.sessionQuestionService.update(+id, updateSessionQuestionDto);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionQuestionService.remove(+id);
  }
}
