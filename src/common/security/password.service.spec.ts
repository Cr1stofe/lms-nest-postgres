import { describe, it, expect } from 'vitest';
import { PasswordService } from './password.service.js';
import { generateToken, sha256 } from './tokens.js';

describe('PasswordService & Security Utils', () => {
  const pepper = 'test_pepper_secret_123';
  const passwordService = new PasswordService(pepper);

  it('deve gerar hash scrypt no formato padronizado', async () => {
    const rawPassword = 'MinhaSenhaForte@123';
    const hash = await passwordService.hash(rawPassword);

    expect(hash).toContain('scrypt$v=1$norm=NFC$N=16384,r=8,p=1$');
    expect(hash.split('$').length).toBe(6);
  });

  it('deve verificar senha correta retornando true', async () => {
    const rawPassword = 'OutraSenhaSegura#456';
    const hash = await passwordService.hash(rawPassword);

    const isValid = await passwordService.verify(rawPassword, hash);
    expect(isValid).toBe(true);
  });

  it('deve rejeitar senha incorreta retornando false', async () => {
    const rawPassword = 'SenhaOriginal@123';
    const wrongPassword = 'SenhaIncorreta@123';
    const hash = await passwordService.hash(rawPassword);

    const isValid = await passwordService.verify(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it('deve gerar token seguro base64url e calcular hash SHA-256 consistente', async () => {
    const token = await generateToken(32);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThanOrEqual(40);

    const hash1 = sha256(token);
    const hash2 = sha256(token);

    expect(hash1).toBeInstanceOf(Buffer);
    expect(hash1.equals(hash2)).toBe(true);
    expect(hash1.length).toBe(32);
  });
});
