import { Injectable, Logger, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, originalUrl, body } = request;
    const startTime = Date.now();

    // Log incoming request with body for mutation methods
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method) && body && Object.keys(body as object).length > 0;
    const authHeader = request.headers.authorization;
    const authInfo = authHeader ? `[Auth: Bearer ...${authHeader.slice(-8)}]` : '[No Auth]';

    if (hasBody) {
      this.logger.log(`→ ${method} ${originalUrl} ${authInfo} Body: ${JSON.stringify(body)}`);
    } else {
      this.logger.log(`→ ${method} ${originalUrl} ${authInfo}`);
    }

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse<Response>();
        const elapsed = Date.now() - startTime;
        this.logger.log(`← ${method} ${originalUrl} ${String(response.statusCode)} ${String(elapsed)}ms`);
      }),
      catchError((error: unknown) => {
        const elapsed = Date.now() - startTime;
        const status = (error as { status?: number })?.status
          ?? (error as { response?: { statusCode?: number } })?.response?.statusCode
          ?? 500;
        const message = (error as { message?: string })?.message ?? 'Unknown error';
        this.logger.error(`← ${method} ${originalUrl} ${String(status)} ${String(elapsed)}ms | Error: ${message}`);
        throw error;
      }),
    );
  }
}
