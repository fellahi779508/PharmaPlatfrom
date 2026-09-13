import { Module } from '@nestjs/common';
import { RedeemCodeService } from './redeem_code.service';
import { RedeemCodeController } from './redeem_code.controller';

@Module({
  controllers: [RedeemCodeController],
  providers: [RedeemCodeService],
})
export class RedeemCodeModule {}
