import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthProvider, Plan, User } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

/** Prisma User with its related Plan eagerly loaded. */
export type UserWithPlan = User & { plan: Plan };

/** Shared include clause — keeps every query consistent. */
const WITH_PLAN = { plan: true } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserWithPlan> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: WITH_PLAN,
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserWithPlan | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: WITH_PLAN,
    });
  }

  async findByProviderAndId(
    provider: AuthProvider,
    providerId: string,
  ): Promise<UserWithPlan | null> {
    return this.prisma.user.findUnique({
      where: {
        authProvider_authProviderId: {
          authProvider: provider,
          authProviderId: providerId,
        },
      },
      include: WITH_PLAN,
    });
  }

  async updateProfile(id: string, data: UpdateProfileDto): Promise<UserWithPlan> {
    await this.findById(id); // Throws if not found

    return this.prisma.user.update({
      where: { id },
      data,
      include: WITH_PLAN,
    });
  }
}
