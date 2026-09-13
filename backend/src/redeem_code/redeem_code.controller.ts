import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RedeemCodeService } from './redeem_code.service';
import { CreateRedeemCodeDto } from './dto/create-redeem_code.dto';
import { UpdateRedeemCodeDto } from './dto/update-redeem_code.dto';

@Controller('redeem-code')
export class RedeemCodeController {
  constructor(private readonly redeemCodeService: RedeemCodeService) {}

  @Post()
  create(@Body() createRedeemCodeDto: CreateRedeemCodeDto) {
    return this.redeemCodeService.create(createRedeemCodeDto);
  }

  @Get()
  findAll() {
    return this.redeemCodeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.redeemCodeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRedeemCodeDto: UpdateRedeemCodeDto) {
    return this.redeemCodeService.update(+id, updateRedeemCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.redeemCodeService.remove(+id);
  }
}
