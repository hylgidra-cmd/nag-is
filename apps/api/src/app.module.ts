import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/app-config.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AccessTokenGuard } from './common/guards/access-token.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditModule } from './modules/audit/audit.module';
import { MailModule } from './modules/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AdminModule } from './modules/admin/admin.module';
import { VideoModule } from './modules/video/video.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    AppConfigModule,

    // Structured request logging. Pino attaches a request id to every line,
    // which the exception filter echoes back so a user-reported error can be
    // found in the log.
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.logging.level,
          ...(config.logging.pretty
            ? {
                transport: {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true, translateTime: 'HH:MM:ss' },
                },
              }
            : {}),
          // Never log credentials or session material.
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers["set-cookie"]',
              'req.body.password',
              'req.body.newPassword',
              'req.body.currentPassword',
              'req.body.token',
            ],
            censor: '[redacted]',
          },
          autoLogging: {
            ignore: (req) => req.url === '/api/v1/health',
          },
        },
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        throttlers: [
          {
            ttl: config.throttle.ttlSeconds * 1000,
            limit: config.throttle.limit,
          },
        ],
      }),
    }),

    PrismaModule,
    AuditModule,
    MailModule,
    VideoModule,

    AuthModule,
    UsersModule,
    CategoriesModule,
    CoursesModule,
    EnrollmentsModule,
    LessonsModule,
    CertificatesModule,
    DashboardModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    // Order matters: rate limiting first, then authentication, then roles.
    // Registering the token guard globally makes every route private unless
    // it is explicitly marked @Public() or @OptionalAuth().
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
