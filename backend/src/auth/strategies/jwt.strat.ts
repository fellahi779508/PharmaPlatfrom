import * as config from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from '../config/jwt.config';
import { JwtPayloadType } from '../types/jwt-payload.type';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
@Injectable()
export class jwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private jwtConfiguration: config.ConfigType<typeof jwtConfig>,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfiguration.secret as string,
    });
  }
  async validate(payload: JwtPayloadType) {
    const user = await this.userService.findOne(payload.sub);
    if (!user || user.currentJti !== payload.jti) {
      throw new UnauthorizedException('Session expired or invalid');
    }
    return { id: payload.sub, role: payload.role, email: payload.email };
  }
}
