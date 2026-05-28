import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionService } from '../../subscription/subscription.service';
import { UserRole, Status } from '@prisma/client';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const subscription =
      await this.subscriptionService.findCompanySubscription(
        String(user.companyId),
      );

    if (
      !subscription ||
      subscription.status !== Status.ACTIVE ||
      new Date() > subscription.endDate
    ) {
      // If method is not GET, block it
      if (request.method !== 'GET') {
        throw new ForbiddenException(
          'Subscription expired or inactive. System is in READ-ONLY mode.',
        );
      }
    }

    return true;
  }
}
