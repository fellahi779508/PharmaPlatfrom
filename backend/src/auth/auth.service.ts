import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { compare } from 'bcrypt';
import { I18nContext, I18nService } from 'nestjs-i18n';
import * as jwt from 'jsonwebtoken';
import { JwtPayloadType } from './types/jwt-payload.type';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from './types/current-user';
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly i18n: I18nService,
    private readonly jwtService: JwtService,
  ) {}
  private get currentLang(): string {
    return I18nContext.current()?.lang!;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user)
      throw new NotFoundException(
        this.i18n.translate('errors.user.not_found', {
          lang: this.currentLang,
        }),
      );
    const isPassMatched = await compare(password, user.password);
    if (!isPassMatched)
      throw new NotFoundException(
        this.i18n.translate('errors.user.invalid_password', {
          lang: this.currentLang,
        }),
      );
    return { id: user.id, role: user.role, email: user.email };
  }
  async generateAccessToken(userId: string, role: string, email: string) {
    const payload: JwtPayloadType = {
      sub: userId,
      role,
      email,
    };

    return this.jwtService.sign(payload);
  }
  async validateJwtUser(userId: number) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException(
        this.i18n.translate('errors.user.not_found', {
          lang: this.currentLang,
        }),
      );
    }
    const curretnUser: CurrentUser = {
      id: user.id,
      role: user.role,
      email: user.email,
    };
    return curretnUser;
  }
}
