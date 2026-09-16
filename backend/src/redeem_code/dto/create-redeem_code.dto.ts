import { IsNumber } from 'class-validator';

export class CreateRedeemCodeDto {
  @IsNumber()
  yearId: number;
}
