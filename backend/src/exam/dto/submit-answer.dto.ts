import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class SubmitAnswerDto {
    @Type(() => Number)
    @IsInt()
    qcmId: number;

    /** null / omitted = skipped */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    selectedAnswerId?: number | null;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    timeSpent?: number;
}