// src/auth/guards/subscription/subscription.guard.ts
import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(private readonly dataSource: DataSource) { }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const req = ctx.switchToHttp().getRequest();
        const userId = req.user?.id;
        if (!userId) throw new UnauthorizedException();

        const user = await this.dataSource.getRepository(User).findOne({
            where: { id: userId },
            relations: { redeemCode: true },
        });
        if (user?.role == Role.OWNER || user?.role == Role.ADMIN || user?.role == Role.TEACHER) {
            return true;
        }

        const code = user?.redeemCode;
        const active =
            user?.isActive === true &&
            code?.isActivated === true &&
            !!code?.expiryDate &&
            new Date(code.expiryDate).getTime() > Date.now();

        if (!active) throw new ForbiddenException('subscription_expired');
        return true;
    }
}