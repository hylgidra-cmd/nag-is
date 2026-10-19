import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [EnrollmentsModule, CertificatesModule],
  controllers: [LessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
