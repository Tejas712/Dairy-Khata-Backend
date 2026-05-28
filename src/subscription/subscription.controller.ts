import { Controller, Get, Post, Body } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import {
  CreatePlanDto,
  AssignPlanDto,
  RecordSubscriptionPaymentDto,
} from './dto/subscription.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles, CurrentUser } from '../auth/decorators/auth.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('plans')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new subscription plan' })
  createPlan(@CurrentUser() user: any, @Body() dto: CreatePlanDto) {
    return this.subscriptionService.createPlan(dto, String(user.userId));
  }

  @Get('plans')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'List all active plans' })
  findAllPlans() {
    return this.subscriptionService.findAllPlans();
  }

  @Post('assign')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign a plan to a company' })
  assignPlan(@CurrentUser() user: any, @Body() dto: AssignPlanDto) {
    return this.subscriptionService.assignPlan(dto, String(user.userId));
  }

  @Post('payments')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Record a subscription payment' })
  recordPayment(
    @CurrentUser() user: any,
    @Body() dto: RecordSubscriptionPaymentDto,
  ) {
    return this.subscriptionService.recordPayment(String(user.userId), dto);
  }
}
