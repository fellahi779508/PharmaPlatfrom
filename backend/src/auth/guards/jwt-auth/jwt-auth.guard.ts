import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';
import { Reflector } from '@nestjs/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }
