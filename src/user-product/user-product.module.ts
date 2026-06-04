import { Module } from '@nestjs/common';
import { UserProductService } from './user-product.service';
import { UserProductController } from './user-product.controller';
import { CompanyAccessModule } from '../common/company-access/company-access.module';

@Module({
  imports: [CompanyAccessModule],
  controllers: [UserProductController],
  providers: [UserProductService],
  exports: [UserProductService],
})
export class UserProductModule {}
