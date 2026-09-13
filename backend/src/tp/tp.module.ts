import { Module } from '@nestjs/common';
import { TpService } from './tp.service';
import { TpController } from './tp.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tp } from './entities/tp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tp])],
  controllers: [TpController],
  providers: [TpService],
})
export class TpModule {}
