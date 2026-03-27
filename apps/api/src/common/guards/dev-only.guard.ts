import {
  CanActivate,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class DevOnlyGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'This endpoint is only available in development',
      );
    }

    return true;
  }
}
