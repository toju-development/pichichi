import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS — function-based origin to support WebView's `Origin: null`.
  // WebView loads HTML via `source={{ html }}` which sends `Origin: null`.
  // The cors package echoes back the matched origin, so `null` origins get
  // `Access-Control-Allow-Origin: null` which browsers/WebViews accept.
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // null/undefined origin: WebViews (send literal string "null"), same-origin, curl, etc.
      if (!origin || origin === 'null') return callback(null, true);
      const allowed =
        process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3001'];
      if (allowed.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Pichichi API')
    .setDescription('Tournament prediction platform API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Pichichi API running on port ${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/v1/docs`);
}

bootstrap();
