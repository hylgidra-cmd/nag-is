import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AppConfigService } from '../../config/app-config.service';

/**
 * Password hashing.
 *
 * bcrypt with a configurable work factor (default 12). No custom
 * cryptography: this is the library's own `hash`/`compare`, which handle salt
 * generation and constant-time comparison.
 */
@Injectable()
export class PasswordService {
  constructor(private readonly config: AppConfigService) {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.config.auth.hashRounds);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plain, hash);
    } catch {
      // A malformed stored hash must read as "wrong password", never as a 500
      // that tells an attacker the account exists but is broken.
      return false;
    }
  }

  /**
   * Burns roughly the same CPU as a real verification.
   *
   * Called when login is attempted against an unknown email so the response
   * time does not reveal whether the address is registered.
   */
  async spendDummyWork(): Promise<void> {
    await bcrypt.compare(
      'nagis-timing-equaliser',
      '$2a$12$Ck6TJ4TBpTjFeV0uSpNx1OdpR1qfJ3qJ6eF1kR7uZ5jO9yQ8s1xYu',
    );
  }
}
