import { Injectable } from '@nestjs/common';
import { EMAIL_KEY, FROM_EMAIL } from '../config/env.js';

export interface SendMailOptions {
  from?: string;
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class MailService {
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor() {
    this.apiKey = EMAIL_KEY;
    this.fromEmail = FROM_EMAIL;
  }

  async send({ from, to, subject, body }: SendMailOptions): Promise<{ ok: boolean }> {
    try {
      const response = await fetch('https://api.resend.com/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: from || this.fromEmail,
          to,
          subject,
          html: body,
        }),
      });

      if (!response.ok) {
        return { ok: false };
      }

      return { ok: true };
    } catch (err) {
      console.error('Erro ao enviar e-mail:', err);
      return { ok: false };
    }
  }
}
