import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

import { existsSync, mkdirSync } from 'fs';

const getUploadDir = () => {
  const baseDir =
    process.cwd().includes('apps\\api') || process.cwd().includes('apps/api')
      ? process.cwd()
      : join(process.cwd(), 'apps/api');
  const uploadDir = join(baseDir, 'public', 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Serve uploaded files publicly at /uploads/*
  app.useStaticAssets(getUploadDir(), { prefix: '/uploads' });
  const logger = new Logger('Bootstrap');

  // Global validation pipe — transforms + validates all incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw if unknown properties sent
      transform: true,           // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // CORS for future frontend
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Wedding API running on http://localhost:${port}/api`);
}

bootstrap();
