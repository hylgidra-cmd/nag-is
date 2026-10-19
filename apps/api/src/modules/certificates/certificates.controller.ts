import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CertificateVerification } from '@nagis/shared-types';
import { Public } from '../../common/decorators';
import { CertificatesService } from './certificates.service';

@ApiTags('certificates')
@Controller({ path: 'certificates', version: '1' })
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  /**
   * Public verification by code.
   *
   * Intentionally returns 200 with `valid: false` for an unknown code rather
   * than 404, so the verification page can state the outcome either way.
   * Only the printed certificate fields are exposed — never the holder's
   * email or user id.
   */
  @Public()
  @Get('verify/:code')
  @ApiOperation({ summary: 'Verify a certificate by its public code' })
  async verify(@Param('code') code: string): Promise<CertificateVerification> {
    return this.certificates.verify(code.trim().toUpperCase());
  }
}
