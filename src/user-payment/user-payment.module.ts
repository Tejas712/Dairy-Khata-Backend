import { Module } from '@nestjs/common';
import { UserPaymentService } from './user-payment.service';
import { UserPaymentController } from './user-payment.controller';
import { CompanyAccessModule } from '../common/company-access/company-access.module';

@Module({
  imports: [CompanyAccessModule],
  controllers: [UserPaymentController],
  providers: [UserPaymentService],
  exports: [UserPaymentService],
})
export class UserPaymentModule {}
