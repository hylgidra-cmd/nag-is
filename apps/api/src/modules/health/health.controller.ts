import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';

interface HealthReport {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  environment: string;
  checks: {
    database: 'up' | 'down';
  };
  /**
   * Which integration drivers are active. Surfacing this makes it obvious at
   * a glance when the development payment adapter or the "no video provider"
   * fallback is in play, instead of it being a silent surprise.
   */
  drivers: {
    payments: string;
    video: string;
    storage: string;
    mail: string;
  };
}

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness and dependency status' })
  async check(): Promise<HealthReport> {
    const databaseUp = await this.prisma.isHealthy();

    return {
      status: databaseUp ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      environment: this.config.nodeEnv,
      checks: { database: databaseUp ? 'up' : 'down' },
      drivers: {
        payments: this.config.payments.driver,
        video: this.config.video.driver,
        storage: this.config.storage.driver,
        mail: this.config.mail.driver,
      },
    };
  }
}
