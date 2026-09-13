import {
  Controller,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: any) {
    const token = await this.authService.generateAccessToken(
      req.user.id,
      req.user.role,
      req.user.email,
    );
    return {
      id: req.user.id,
      token,
      role: req.user.role,
      email: req.user.email,
    };
  }
}
