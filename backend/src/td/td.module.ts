import { Module } from '@nestjs/common';
import { TdService } from './td.service';
import { TdController } from './td.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Td } from './entities/td.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Td])],
  controllers: [TdController],
  providers: [TdService],
})
export class TdModule {}
