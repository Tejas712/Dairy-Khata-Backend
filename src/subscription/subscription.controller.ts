import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  UpdatePlanStatusDto,
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
  @ApiOperation({ summary: 'List subscription plans' })
  findAllPlans(@CurrentUser() user: any, @Query('all') all?: string) {
    const includeInactive =
      all === 'true' && user.role === UserRole.SUPER_ADMIN;
    return this.subscriptionService.findAllPlans(includeInactive);
  }

  @Patch('plans/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a subscription plan' })
  updatePlan(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.subscriptionService.updatePlan(id, dto, String(user.userId));
  }

  @Patch('plans/:id/status')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update subscription plan status' })
  updatePlanStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdatePlanStatusDto,
  ) {
    return this.subscriptionService.updatePlanStatus(
      id,
      dto.status,
      String(user.userId),
    );
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

  @Get('company-subscriptions')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all company subscriptions' })
  findAllCompanySubscriptions() {
    return this.subscriptionService.findAllCompanySubscriptions();
  }
}
