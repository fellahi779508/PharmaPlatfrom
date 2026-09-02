import {
  Body,
  Controller,
  Post,
  BadRequestException,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { DataSource } from 'typeorm';

@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  @Post('verify-otp')
  @UseGuards(JwtAuthGuard)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return await this.emailService.verifyOtp(dto);
  }

  @Get('otpCode')
  @UseGuards(JwtAuthGuard)
  async getOtpCode(@Req() req) {
    const otpCode = this.generate6DigitOtp();
    const user = await this.dataSource.getRepository('user').findOne({
      where: { email: req.user.email },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 60 * 1000);
    await this.dataSource.getRepository('user').save(user);
    return await this.emailService.sendVerificationOtp(req.user.email, otpCode);
  }
  private generate6DigitOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
