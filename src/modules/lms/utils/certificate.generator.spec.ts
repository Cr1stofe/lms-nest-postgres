import { describe, it, expect } from 'vitest';
import { generateCertificate } from './certificate.generator.js';

describe('generateCertificate', () => {
  it('deve gerar um PDF de certificado válido como Buffer', () => {
    const certBuffer = generateCertificate({
      id: 'c1b489d8-9999-4d64-9844-3d0d8299831a',
      name: 'Dev Specialist',
      title: 'Full Stack Masterclass: Next.js & NestJS',
      hours: 40,
      lessons: 32,
      completed: '2026-09-29 14:00:00',
    });

    expect(certBuffer).toBeInstanceOf(Buffer);
    expect(certBuffer.length).toBeGreaterThan(1000);

    const pdfHeader = certBuffer.subarray(0, 5).toString('ascii');
    expect(pdfHeader).toBe('%PDF-');
  });
});
