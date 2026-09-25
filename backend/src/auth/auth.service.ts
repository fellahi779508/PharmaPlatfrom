import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare } from 'bcrypt';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { JwtPayloadType } from './types/jwt-payload.type';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from './types/current-user';
import { randomUUID } from 'crypto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly i18n: I18nService,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) { }
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
    const user = await this.userService.findOne(userId);

    if (user.currentJti) {
      throw new UnauthorizedException(
        this.i18n.translate('errors.user.already_logged_in', {
          lang: this.currentLang,
          defaultValue:
            'Another user is already using this account. Please wait for them to disconnect.',
        }),
      );
    }

    const jti = randomUUID();
    const payload: JwtPayloadType = {
      sub: userId,
      role,
      email,
      jti,
    };

    await this.userService.updateCurrentJti(userId, jti);
    return this.jwtService.sign(payload);
  }
  async validateJwtUser(userId: string) {
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

  async logout(userId: string) {
    await this.userService.updateCurrentJti(userId, '');
    return {
      message: this.i18n.translate('success.user.logged_out', {
        lang: this.currentLang,
        defaultValue: 'Logged out successfully',
      }),
    };
  }
}
