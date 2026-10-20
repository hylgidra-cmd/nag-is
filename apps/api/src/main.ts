import 'reflect-metadata';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(AppConfigService);
  app.useLogger(app.get(Logger));

  // URI versioning: every route lives under /api/v1/...
  app.setGlobalPrefix(config.globalPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.use(cookieParser());

  app.use(
    helmet({
      // The API serves JSON, not HTML, so a restrictive CSP here would only
      // affect the Swagger UI. CSP for the site itself is set by Next.js.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  /**
   * In development the browser reaches the API through the Next.js rewrite,
   * so requests are same-origin and CORS never comes up. The allowlist is
   * here for direct API clients and for deployments that split the hosts.
   */
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    maxAge: 86_400,
  });

  // Trust the reverse proxy so req.ip is the real client, which rate limiting
  // and audit logging both depend on.
  app.set('trust proxy', 1);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (!config.isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("NAG'IS API")
      .setDescription(
        'REST API for the NAGIS online IT education platform. ' +
          'All user-facing copy is rendered by the web app in Qaraqalpaq; this API ' +
          'returns stable machine-readable error codes rather than translated text.',
      )
      .setVersion('1.0')
      .addCookieAuth('nagis_at', { type: 'apiKey', in: 'cookie' }, 'session')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
      .addTag('auth', 'Registration, login, sessions and password reset')
      .addTag('courses', 'Public course catalog')
      .addTag('categories', 'Course categories')
      .addTag('me', 'The signed-in student')
      .addTag('health', 'Liveness and dependency status')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${config.globalPrefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  /*
   * A managed platform tells the process which port to bind by injecting
   * PORT, and routes traffic to it. That is deployment plumbing rather than
   * application configuration, so it is read straight from the environment
   * instead of going through the validated schema; API_PORT stays the
   * authoritative setting everywhere else.
   */
  const port = Number(process.env['PORT'] ?? config.port);

  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(
    `NAGIS API listening on http://localhost:${port}/${config.globalPrefix}/v1 ` +
      `(env=${config.nodeEnv}, payments=${config.payments.driver}, video=${config.video.driver})`,
  );
  if (!config.isProduction) {
    logger.log(`Swagger UI: http://localhost:${port}/${config.globalPrefix}/docs`);
  }
}

void bootstrap().catch((error: unknown) => {
  // Configuration failures happen before the logger exists, so this is the
  // one place a bare console write is the right tool.
  console.error('Failed to start the NAGIS API:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
