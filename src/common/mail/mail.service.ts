import { Injectable, Logger } from '@nestjs/common';
import { EMAIL_KEY, FROM_EMAIL } from '../config/env.js';

export interface SendMailOptions {
  from?: string;
  to: string;
  subject: string;
  body: string;
}

interface ResendSuccessResponse {
  id: string;
}

interface ResendErrorResponse {
  statusCode?: number;
  message?: string;
  name?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor() {
    this.apiKey = EMAIL_KEY;
    this.fromEmail = FROM_EMAIL;
  }

  async send({
    from,
    to,
    subject,
    body,
  }: SendMailOptions): Promise<{ ok: boolean; id?: string; error?: string }> {
    if (!this.apiKey || this.apiKey === 'dummy_key' || this.apiKey === 'email_dev_key') {
      this.logger.warn(
        `[MailService] Chave da Resend não configurada (EMAIL_KEY). E-mail para <${to}> não foi enviado externamente.`,
      );
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: from || this.fromEmail,
          to: [to],
          subject,
          html: body,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as
        | ResendSuccessResponse
        | ResendErrorResponse;

      if (!response.ok) {
        const errorMsg =
          (data as ResendErrorResponse).message || JSON.stringify(data);
        this.logger.error(
          `[MailService] Falha no envio pela Resend (HTTP ${response.status}): ${errorMsg}`,
        );
        return { ok: false, error: errorMsg };
      }

      const successData = data as ResendSuccessResponse;
      this.logger.log(
        `[MailService] E-mail enviado com sucesso via Resend para <${to}> (ID: ${successData.id})`,
      );
      return { ok: true, id: successData.id };
    } catch (err) {
      this.logger.error('[MailService] Erro inesperado ao conectar à API da Resend:', err);
      return { ok: false, error: 'erro_de_conexao' };
    }
  }
}
