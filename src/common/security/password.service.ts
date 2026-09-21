import { Injectable, Optional } from '@nestjs/common';
import {
  type BinaryLike,
  type ScryptOptions,
  createHmac,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { PEPPER } from '../config/env.js';
import { randomBytesAsync } from './tokens.js';

const scryptAsync: (
  password: BinaryLike,
  salt: BinaryLike,
  keylen: number,
  options?: ScryptOptions,
) => Promise<Buffer> = promisify(scrypt);

@Injectable()
export class PasswordService {
  private readonly pepper: string;
  private readonly norm = 'NFC';
  private readonly scryptOptions: ScryptOptions = {
    N: 2 ** 14,
    r: 8,
    p: 1,
  };
  private readonly dkLen = 32;
  private readonly saltLen = 16;

  constructor(@Optional() pepper?: string) {
    this.pepper = pepper ?? PEPPER;
  }

  async hash(password: string): Promise<string> {
    const passwordNormalized = password.normalize(this.norm);
    const passwordHmac = createHmac('sha256', this.pepper)
      .update(passwordNormalized)
      .digest();

    const salt = await randomBytesAsync(this.saltLen);
    const dk = await scryptAsync(
      passwordHmac,
      salt,
      this.dkLen,
      this.scryptOptions,
    );

    return (
      `scrypt$v=1$norm=${this.norm}$N=${this.scryptOptions.N},r=${this.scryptOptions.r},p=${this.scryptOptions.p}` +
      `$${salt.toString('hex')}$${dk.toString('hex')}`
    );
  }

  parse(passwordHash: string) {
    const [, , norm, options, storedSaltHex, storedDkHex] =
      passwordHash.split('$');
    const storedDk = Buffer.from(storedDkHex, 'hex');
    const storedSalt = Buffer.from(storedSaltHex, 'hex');
    const storedNorm = norm.replace('norm=', '');
    const storedOptions = options
      .split(',')
      .reduce((acc: Record<string, number>, kv) => {
        const [k, v] = kv.split('=');
        acc[k] = Number(v);
        return acc;
      }, {});

    return {
      storedOptions,
      storedNorm,
      storedDk,
      storedSalt,
    };
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    try {
      const { storedOptions, storedNorm, storedDk, storedSalt } =
        this.parse(passwordHash);

      const passwordNormalized = password.normalize(storedNorm);
      const passwordHmac = createHmac('sha256', this.pepper)
        .update(passwordNormalized)
        .digest();

      const dk = await scryptAsync(
        passwordHmac,
        storedSalt,
        this.dkLen,
        storedOptions,
      );

      if (dk.length !== storedDk.length) {
        return false;
      }

      return timingSafeEqual(dk, storedDk);
    } catch {
      return false;
    }
  }
}
