import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RedeemCodeService } from './redeem_code.service';
import { CreateRedeemCodeDto } from './dto/create-redeem_code.dto';
import { UpdateRedeemCodeDto } from './dto/update-redeem_code.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Role } from 'src/auth/enums/role.enum';

@Controller('redeem-code')
export class RedeemCodeController {
  constructor(private readonly redeemCodeService: RedeemCodeService) { }


  @Post()
  @Roles(Role.ADMIN, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  create(@Body() createRedeemCodeDto: CreateRedeemCodeDto) {
    return this.redeemCodeService.create(createRedeemCodeDto);
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.redeemCodeService.findAll();
  }


  @Post('revoke/admin')
  @Roles(Role.ADMIN, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  revokeSubscriptionAdmin(@Body('userId') userId: string) {
    return this.redeemCodeService.revokeSubscriptionAdmin(userId);
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.redeemCodeService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('assign')
  assignCodeToUser(@Body('code') code: string, @Req() req: any) {
    console.log(code);

    return this.redeemCodeService.assignCodeToUser(code, req.user.id);
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.redeemCodeService.remove(+id);
  }
}
