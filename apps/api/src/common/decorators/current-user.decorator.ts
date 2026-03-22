import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface JwtUserPayload {
  sub: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUserPayload | undefined, ctx: ExecutionContext): JwtUserPayload | string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as JwtUserPayload;

    if (data) {
      return user[data];
    }

    return user;
  },
);
