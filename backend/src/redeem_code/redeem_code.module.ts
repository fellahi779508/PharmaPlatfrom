import { Module } from '@nestjs/common';
import { RedeemCodeService } from './redeem_code.service';
import { RedeemCodeController } from './redeem_code.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedeemCode } from './entities/redeem_code.entity';

@Module({
  controllers: [RedeemCodeController],
  providers: [RedeemCodeService],
  imports: [TypeOrmModule.forFeature([RedeemCode])],
})
export class RedeemCodeModule {}
