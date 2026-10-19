import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

export interface PasswordResetMail {
  to: string;
  fullName: string;
  token: string;
}

/**
 * Outbound email, behind a driver boundary.
 *
 * MAIL_DRIVER=console (the default) writes the reset link to the server log
 * instead of sending anything. That makes the reset flow fully testable in
 * development without pretending that mail delivery works. Wiring a real
 * provider means implementing `deliver` for MAIL_DRIVER=smtp — see
 * docs/development.md.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: AppConfigService) {}

  async sendPasswordReset(mail: PasswordResetMail): Promise<void> {
    const url = `${this.config.siteUrl}/reset-password?token=${encodeURIComponent(mail.token)}`;

    await this.deliver({
      to: mail.to,
      subject: 'NAGIS — parolingizdi qayta tiklew',
      text: [
        `Sálem, ${mail.fullName}!`,
        '',
        'Parolingizdi qayta tiklew ushin tómendegi siltemeni ashıń:',
        url,
        '',
        'Silteme 1 saat ishinde ámel etedi. Eger bul soraw sizden bolmasa,',
        'bul xatqa itibar bermeńiz.',
        '',
        'NAGIS',
      ].join('\n'),
    });
  }

  /**
   * The transport boundary.
   *
   * Not `async`: the console driver is synchronous and the SMTP driver is not
   * implemented, so there is nothing to await yet. It still returns a Promise
   * so adding a real transport later is not a signature change.
   */
  private deliver(message: { to: string; subject: string; text: string }): Promise<void> {
    if (this.config.mail.driver === 'console') {
      this.logger.warn(
        [
          '',
          '──────────────────────────────────────────────────────────────',
          ' MAIL_DRIVER=console — no email was actually sent.',
          ` To:      ${message.to}`,
          ` Subject: ${message.subject}`,
          '',
          message.text,
          '──────────────────────────────────────────────────────────────',
        ].join('\n'),
      );
      return Promise.resolve();
    }

    // MAIL_DRIVER=smtp. The env schema already guarantees SMTP_HOST is set,
    // but no transport is implemented yet, so fail loudly rather than
    // silently dropping a password reset.
    return Promise.reject(
      new Error(
        'MAIL_DRIVER="smtp" is configured but no SMTP transport is implemented yet. ' +
          'Install nodemailer and implement MailService.deliver, or set MAIL_DRIVER="console". ' +
          'See docs/development.md.',
      ),
    );
  }
}
