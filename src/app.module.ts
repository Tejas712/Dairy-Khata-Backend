import { Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { UserProductModule } from './user-product/user-product.module';
import { EntryModule } from './entry/entry.module';
import { UserPaymentModule } from './user-payment/user-payment.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ReportModule } from './report/report.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { SubscriptionGuard } from './auth/guards/subscription.guard';
import { CompanyStatusGuard } from './auth/guards/company-status.guard';
import { CompanyContextGuard } from './auth/guards/company-context.guard';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CompanyModule,
    UserModule,
    ProductModule,
    UserProductModule,
    EntryModule,
    UserPaymentModule,
    SubscriptionModule,
    WhatsAppModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CompanyStatusGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CompanyContextGuard,
    },
  ],
})
export class AppModule {}
