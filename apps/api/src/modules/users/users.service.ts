import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthProvider, User } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByProviderAndId(
    provider: AuthProvider,
    providerId: string,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        authProvider_authProviderId: {
          authProvider: provider,
          authProviderId: providerId,
        },
      },
    });
  }

  async updateProfile(id: string, data: UpdateProfileDto): Promise<User> {
    await this.findById(id); // Throws if not found

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
