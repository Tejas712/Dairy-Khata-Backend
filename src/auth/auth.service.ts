import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Status } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const company = await this.prisma.company.findUnique({
      where: { companyCode: loginDto.companyCode },
    });

    if (!company) {
      throw new UnauthorizedException('Invalid company code');
    }

    if (company.status === Status.DELETED) {
      throw new UnauthorizedException('Company is deleted');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        companyId: company.id,
        mobile: loginDto.mobile,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid mobile number or password');
    }

    if (user.status !== Status.ACTIVE) {
      throw new ForbiddenException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid mobile number or password');
    }

    const payload = {
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        userId: user.id,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }
}
