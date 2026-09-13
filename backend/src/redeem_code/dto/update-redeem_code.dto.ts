import { PartialType } from '@nestjs/mapped-types';
import { CreateRedeemCodeDto } from './create-redeem_code.dto';

export class UpdateRedeemCodeDto extends PartialType(CreateRedeemCodeDto) {}
