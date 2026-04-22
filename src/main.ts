// Load .env SEBELUM import lain — supaya `llm.config.ts` (yang dieval
// pada import-time) bisa baca process.env.LLM_*.
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');

  // CORS: explicit origin (wildcard '*' tidak boleh dipakai bersama credentials).
  // Set FRONTEND_ORIGIN ke URL Next.js (default localhost:3000).
  // Bisa multiple, dipisah koma. Contoh:
  //   FRONTEND_ORIGIN=http://localhost:3000,https://app.gurupintar.id
  const origins =
    (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Guru Pintar AI API')
    .setDescription(
      'GraphQL & REST endpoint untuk generate RPP via vLLM lokal.',
    )
    .setVersion('1.0')
    .addTag('rpp')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);

  const url = await app.getUrl();
  logger.log(`Backend listening on ${url}`);
  logger.log(`GraphQL playground: ${url}/api/graphql`);
  logger.log(`Swagger:            ${url}/swagger`);
  logger.log(`Allowed origins:    ${origins.join(', ')}`);
}
bootstrap();
