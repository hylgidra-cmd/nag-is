import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { DashboardService } from './dashboard.service';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [EnrollmentsModule, CertificatesModule],
  controllers: [MeController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
