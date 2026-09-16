import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { GenerateExamDto } from './dto/generate-exam.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';

@Controller('exam')
@UseGuards(JwtAuthGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) { }

  /* ------------------------- Catalog ------------------------- */

  @Get('catalog/semesters')
  getSemesters(@Req() req: any) {
    return this.examService.getAvailableSemesters(req.user.id);
  }

  @Get('catalog/subjects')
  getSubjects(@Req() req: any) {
    return this.examService.getAvailableSubjects(req.user.id);
  }

  /* ------------------------- Exam ------------------------- */

  @Post('generate')
  generate(@Body() dto: GenerateExamDto, @Req() req: any) {
    return this.examService.generateExam(dto, req.user.id);
  }

  @Get()
  findAll() {
    return this.examService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examService.getExamForStudent(id);
  }

  /* ------------------------- Sessions ------------------------- */

  @Post(':id/sessions/start')
  start(@Param('id', ParseIntPipe) examId: number, @Req() req: any) {
    return this.examService.startSession(examId, req.user.id);
  }

  @Get('sessions/mine')
  mySessions(@Req() req: any) {
    return this.examService.getUserSessions(req.user.id);
  }

  @Get('sessions/:sessionId')
  progress(@Param('sessionId', ParseIntPipe) sid: number, @Req() req: any) {
    return this.examService.getSessionProgress(sid, req.user.id);
  }

  @Patch('sessions/:sessionId/pause')
  pause(@Param('sessionId', ParseIntPipe) sid: number, @Req() req: any) {
    return this.examService.pauseSession(sid, req.user.id);
  }

  @Patch('sessions/:sessionId/resume')
  resume(@Param('sessionId', ParseIntPipe) sid: number, @Req() req: any) {
    return this.examService.resumeSession(sid, req.user.id);
  }

  @Post('sessions/:sessionId/answer')
  answer(
    @Param('sessionId', ParseIntPipe) sid: number,
    @Body() dto: SubmitAnswerDto,
    @Req() req: any,
  ) {
    return this.examService.submitAnswer(sid, req.user.id, dto);
  }

  @Post('sessions/:sessionId/complete')
  complete(@Param('sessionId', ParseIntPipe) sid: number, @Req() req: any) {
    return this.examService.completeSession(sid, req.user.id);
  }

  @Get('sessions/:sessionId/results')
  results(@Param('sessionId', ParseIntPipe) sid: number, @Req() req: any) {
    return this.examService.getSessionResults(sid, req.user.id);
  }

  /** Delete a session (used when a user removes a created exam from the list). */
  @Delete('sessions/:sessionId')
  deleteSession(@Param('sessionId', ParseIntPipe) sid: number, @Req() req: any) {
    return this.examService.deleteSession(sid, req.user.id);
  }
}