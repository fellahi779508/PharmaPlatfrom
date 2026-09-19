import { IsNumber, IsString } from "class-validator";

export class CreateSummaryDto {
    @IsString()
    text: string;
    @IsNumber()
    courseId: number;

}
