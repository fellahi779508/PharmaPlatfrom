import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { FlashcardService } from './flash-card.service';

@Controller('flashcard')
@UseGuards(JwtAuthGuard)
export class FlashcardController {
  constructor(private readonly flashcardService: FlashcardService) { }

  /** Today's flashcard for the user's year. */
  @Get('today')
  getToday(@Req() req: any) {
    return this.flashcardService.getTodayCardForUser(req.user.id);
  }

  /** Returns the semester number computed for today (debug helper). */
  @Get('current-semester')
  currentSemester() {
    return { semesterNumber: this.flashcardService.getCurrentSemesterNumber() };
  }

  /** Admin: force regenerate for all years. */
  @Post('regenerate')
  @Roles(Role.ADMIN, Role.OWNER)
  @UseGuards(RolesGuard)
  regenerate() {
    return this.flashcardService.generateForAllYears();
  }
}