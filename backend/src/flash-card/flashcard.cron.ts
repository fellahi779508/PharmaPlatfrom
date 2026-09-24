import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FlashcardService } from './flash-card.service';

@Injectable()
export class FlashcardCron {
    private readonly logger = new Logger(FlashcardCron.name);

    constructor(private readonly flashcardService: FlashcardService) { }

    /**
     * Runs every day at 00:05 UTC.
     * Generates one flashcard per year based on the current semester.
     *
     * Examples:
     *   '5 0 * * *', { timeZone: 'Africa/Algiers' } → 00:05 Algeria time
     *   '0 23 * * *'                                 → 23:00 UTC
     */
    @Cron('5 0 * * *', { timeZone: 'UTC' })
    async generateDailyFlashcards() {
        this.logger.log('Generating daily flashcards for all years…');
        try {
            const result = await this.flashcardService.generateForAllYears();
            this.logger.log(
                `Done — semester ${result.semesterNumber ?? 'n/a'}, ` +
                `${result.years.filter((y) => y.created).length} new, ` +
                `${result.years.filter((y) => !y.created).length} skipped`,
            );
        } catch (e: any) {
            this.logger.error('Failed to generate daily flashcards', e);
        }
    }
}