import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transform(data)));
  }

  private transform(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'bigint') {
      return data.toString();
    }

    // Handle Prisma Decimal
    if (data?.constructor?.name === 'Decimal' || data?.d) {
      if (typeof data.toNumber === 'function') {
        return data.toNumber();
      }
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.transform(item));
    }

    if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
      const transformed: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          transformed[key] = this.transform(data[key]);
        }
      }
      return transformed;
    }

    return data;
  }
}
