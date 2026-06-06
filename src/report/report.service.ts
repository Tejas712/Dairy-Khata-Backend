import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindLedgerDto } from './dto/find-ledger.dto';
import {
  EntryType,
  PaymentType,
  Status,
  UserRole,
} from '@prisma/client';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../common/utils/pagination.util';

export interface LedgerLine {
  id: string;
  date: Date;
  type: 'ENTRY' | 'PAYMENT';
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getLedger(
    companyId: string,
    query: FindLedgerDto,
    actorRole?: UserRole,
  ) {
    const { userId, startDate, endDate } = query;
    const pagination = resolvePagination({ page: query.page, limit: query.limit });

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
        role: { in: [UserRole.CUSTOMER, UserRole.SUPPLIER] },
      },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('Party not found');
    }

    if (actorRole === UserRole.STAFF && user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Staff can only view customer ledgers');
    }

    const entryType =
      user.role === UserRole.SUPPLIER ? EntryType.PURCHASE : EntryType.SALE;
    const paymentType =
      user.role === UserRole.SUPPLIER ? PaymentType.CASH_OUT : PaymentType.CASH_IN;

    const rangeStart = startDate ? new Date(startDate) : undefined;
    const rangeEnd = endDate ? new Date(endDate) : undefined;

    const openingBalance = await this.balanceBefore(
      companyId,
      userId,
      entryType,
      paymentType,
      rangeStart,
    );

    const entryWhere = {
      companyId,
      userId,
      status: Status.ACTIVE,
      type: entryType,
      ...(rangeStart || rangeEnd
        ? {
            entryDate: {
              ...(rangeStart ? { gte: rangeStart } : {}),
              ...(rangeEnd ? { lte: rangeEnd } : {}),
            },
          }
        : {}),
    };

    const paymentWhere = {
      companyId,
      userId,
      status: Status.ACTIVE,
      type: paymentType,
      ...(rangeStart || rangeEnd
        ? {
            paymentDate: {
              ...(rangeStart ? { gte: rangeStart } : {}),
              ...(rangeEnd ? { lte: rangeEnd } : {}),
            },
          }
        : {}),
    };

    const [entries, payments] = await Promise.all([
      this.prisma.entry.findMany({
        where: entryWhere,
        include: { product: { select: { name: true } } },
        orderBy: [{ entryDate: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.userPayment.findMany({
        where: paymentWhere,
        orderBy: [{ paymentDate: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    const rawLines: Omit<LedgerLine, 'balance'>[] = [
      ...entries.map((entry) => ({
        id: entry.id,
        date: entry.entryDate,
        type: 'ENTRY' as const,
        particulars: this.entryParticulars(entry),
        debit: entry.amount.toNumber(),
        credit: 0,
      })),
      ...payments.map((payment) => ({
        id: payment.id,
        date: payment.paymentDate,
        type: 'PAYMENT' as const,
        particulars: payment.note?.trim() || payment.paymentMode,
        debit: 0,
        credit: payment.amount.toNumber(),
      })),
    ].sort((a, b) => {
      const dateDiff = a.date.getTime() - b.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      if (a.type === b.type) return a.id.localeCompare(b.id);
      return a.type === 'ENTRY' ? -1 : 1;
    });

    let runningBalance = openingBalance;
    const lines: LedgerLine[] = rawLines.map((line) => {
      runningBalance += line.debit - line.credit;
      return { ...line, balance: runningBalance };
    });

    const totalDebit = rawLines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = rawLines.reduce((sum, line) => sum + line.credit, 0);
    const closingBalance = runningBalance;

    const total = lines.length;
    const pagedLines =
      pagination.limit === null
        ? lines
        : lines.slice(pagination.skip!, pagination.skip! + pagination.take!);

    const pageResult = buildPaginatedResult(
      pagedLines,
      total,
      pagination.page,
      pagination.limit,
    );

    return {
      party: user,
      openingBalance,
      closingBalance,
      totalDebit,
      totalCredit,
      ...pageResult,
    };
  }

  private entryParticulars(entry: {
    product: { name: string } | null;
    quantity: { toNumber(): number };
    price: { toNumber(): number };
  }) {
    const productName = entry.product?.name ?? 'Product';
    const qty = entry.quantity.toNumber();
    const price = entry.price.toNumber();
    return `${productName} (${qty} x ₹${price.toFixed(2)})`;
  }

  private async balanceBefore(
    companyId: string,
    userId: string,
    entryType: EntryType,
    paymentType: PaymentType,
    beforeDate?: Date,
  ) {
    const entryWhere = {
      companyId,
      userId,
      status: Status.ACTIVE,
      type: entryType,
      ...(beforeDate ? { entryDate: { lt: beforeDate } } : {}),
    };

    const paymentWhere = {
      companyId,
      userId,
      status: Status.ACTIVE,
      type: paymentType,
      ...(beforeDate ? { paymentDate: { lt: beforeDate } } : {}),
    };

    const [entriesSum, paymentsSum] = await Promise.all([
      this.prisma.entry.aggregate({ where: entryWhere, _sum: { amount: true } }),
      this.prisma.userPayment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
      }),
    ]);

    const totalEntries = entriesSum._sum.amount?.toNumber() ?? 0;
    const totalPayments = paymentsSum._sum.amount?.toNumber() ?? 0;

    return totalEntries - totalPayments;
  }
}
