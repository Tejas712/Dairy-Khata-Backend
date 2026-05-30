import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { UserPaymentService } from './user-payment.service';
import { CreateUserPaymentDto } from './dto/user-payment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  Roles,
  CurrentCompanyId,
  CurrentUser,
} from '../auth/decorators/auth.decorator';
import { UserRole, PaymentType } from '@prisma/client';

@ApiTags('user-payments')
@ApiBearerAuth()
@Controller('user-payments')
export class UserPaymentController {
  constructor(private readonly userPaymentService: UserPaymentService) {}

  @Post()
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Add a user payment' })
  create(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Body() dto: CreateUserPaymentDto,
  ) {
    return this.userPaymentService.create(companyId, dto, String(user.userId));
  }

  @Get()
  @ApiOperation({ summary: 'List user payments' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: PaymentType })
  findAll(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Query('userId') userId?: string,
    @Query('type') type?: PaymentType,
  ) {
    const targetUserId = userId || undefined;

    if (user.role === UserRole.CUSTOMER) {
      if (targetUserId && targetUserId !== String(user.userId)) {
        throw new ForbiddenException('You can only view your own payments');
      }
      return this.userPaymentService.findAll(
        companyId,
        String(user.userId),
        type ?? PaymentType.CASH_IN,
      );
    }

    return this.userPaymentService.findAll(companyId, targetUserId, type);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a payment record' })
  remove(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.userPaymentService.remove(companyId, id, String(user.userId));
  }
}
