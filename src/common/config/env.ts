import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = Number(process.env.PORT) || 3000;
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/lms?schema=public';
export const FROM_EMAIL =
  process.env.FROM_EMAIL || 'Veltro LMS <onboarding@resend.dev>';
export const SERVER_NAME = process.env.SERVER_NAME || 'localhost';

export const FILES_PATH =
  process.env.FILES_PATH && existsSync(process.env.FILES_PATH)
    ? process.env.FILES_PATH
    : existsSync(resolve(process.cwd(), 'seed/files'))
      ? resolve(process.cwd(), 'seed/files')
      : existsSync(resolve(process.cwd(), 'files'))
        ? resolve(process.cwd(), 'files')
        : '/files';

const emailKeyPath =
  process.env.EMAIL_KEY_FILE || resolve(process.cwd(), 'secrets/email_key.txt');
export const EMAIL_KEY = existsSync(emailKeyPath)
  ? readFileSync(emailKeyPath, 'utf-8').trim()
  : process.env.EMAIL_KEY || 'dummy_key';

const pepperPath =
  process.env.PEPPER_FILE || resolve(process.cwd(), 'secrets/pepper.txt');
export const PEPPER = existsSync(pepperPath)
  ? readFileSync(pepperPath, 'utf-8').trim()
  : process.env.PEPPER || 'segredo';
