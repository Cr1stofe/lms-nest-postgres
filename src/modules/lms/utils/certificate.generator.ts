import { jsPDF } from 'jspdf';
import { SERVER_NAME } from '../../../common/config/env.js';

export interface CertificateData {
  id: string;
  name: string;
  title: string;
  hours: number;
  lessons: number;
  completed: string;
}

function formatDate(dateStr: string): string {
  try {
    const parsed = new Date(dateStr.replace(' ', 'T'));
    if (!isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(parsed);
    }
  } catch {
    return dateStr;
  }
  return dateStr;
}

function drawVectorStar(
  doc: jsPDF,
  cx: number,
  cy: number,
  rOut: number,
  color: string,
) {
  const rIn = rOut * 0.42;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? rOut : rIn;
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  doc.setFillColor(color);
  for (let i = 0; i < 10; i++) {
    const next = (i + 1) % 10;
    doc.triangle(
      cx,
      cy,
      points[i].x,
      points[i].y,
      points[next].x,
      points[next].y,
      'F',
    );
  }
}

function drawDiamond(
  doc: jsPDF,
  cx: number,
  cy: number,
  w: number,
  h: number,
  color: string,
) {
  doc.setFillColor(color);
  doc.triangle(cx, cy - h / 2, cx + w / 2, cy, cx, cy + h / 2, 'F');
  doc.triangle(cx, cy - h / 2, cx - w / 2, cy, cx, cy + h / 2, 'F');
}

export function generateCertificate(c: CertificateData): Buffer {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const centerX = width / 2;

  doc.setFillColor('#f8fafc');
  doc.rect(0, 0, width, height, 'F');

  doc.setFillColor('#ffffff');
  doc.roundedRect(18, 18, width - 36, height - 36, 6, 6, 'F');

  doc.setDrawColor('#e2e8f0');
  doc.setLineWidth(1.2);
  doc.roundedRect(18, 18, width - 36, height - 36, 6, 6, 'S');

  doc.setFillColor('#2563eb');
  doc.rect(18, 18, width - 36, 6, 'F');
  doc.setFillColor('#4f46e5');
  doc.rect(centerX - 100, 18, 200, 6, 'F');

  doc.setDrawColor('#cbd5e1');
  doc.setLineWidth(0.75);
  doc.rect(30, 30, width - 60, height - 60);

  const cornerSize = 16;
  const corners = [
    { x: 30, y: 30, dx: 1, dy: 1 },
    { x: width - 30, y: 30, dx: -1, dy: 1 },
    { x: 30, y: height - 30, dx: 1, dy: -1 },
    { x: width - 30, y: height - 30, dx: -1, dy: -1 },
  ];

  for (const corner of corners) {
    const lx = corner.x + corner.dx * 7;
    const ly = corner.y + corner.dy * 7;
    drawDiamond(doc, lx, ly, 7, 7, '#2563eb');

    doc.setDrawColor('#2563eb');
    doc.setLineWidth(1.2);
    doc.line(corner.x, corner.y, corner.x + corner.dx * cornerSize, corner.y);
    doc.line(corner.x, corner.y, corner.x, corner.y + corner.dy * cornerSize);
  }

  doc.setDrawColor('#e2e8f0');
  doc.setLineWidth(1);
  doc.line(centerX - 130, 62, centerX - 20, 62);
  doc.line(centerX + 20, 62, centerX + 130, 62);

  drawDiamond(doc, centerX, 62, 10, 10, '#2563eb');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor('#64748b');
  doc.text(
    'PLATAFORMA LMS   •   CERTIFICAÇÃO PROFISSIONAL DE EXCELÊNCIA',
    centerX,
    84,
    { align: 'center' },
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor('#0f172a');
  doc.text('CERTIFICADO DE CONCLUSÃO', centerX, 122, { align: 'center' });

  doc.setDrawColor('#2563eb');
  doc.setLineWidth(1.5);
  doc.line(centerX - 120, 134, centerX + 120, 134);
  doc.setFillColor('#1d4ed8');
  doc.circle(centerX, 134, 2.5, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor('#475569');
  doc.text('Certificamos para os devidos fins que', centerX, 164, {
    align: 'center',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor('#0f172a');
  doc.text(c.name, centerX, 202, { align: 'center' });

  doc.setDrawColor('#e2e8f0');
  doc.setLineWidth(1);
  doc.line(centerX - 160, 214, centerX + 160, 214);
  doc.setDrawColor('#2563eb');
  doc.setLineWidth(2);
  doc.line(centerX - 40, 214, centerX + 40, 214);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor('#475569');
  doc.text(
    'concluiu com êxito todos os módulos e requisitos do curso:',
    centerX,
    240,
    { align: 'center' },
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor('#1d4ed8');
  doc.text(`"${c.title}"`, centerX, 268, { align: 'center' });

  const formattedDate = formatDate(c.completed);
  const badges = [
    { label: 'CARGA HORÁRIA', value: `${c.hours} Horas` },
    { label: 'CONTEÚDO', value: `${c.lessons} Aulas Concluídas` },
    { label: 'DATA DE EMISSÃO', value: formattedDate },
  ];

  const badgeWidth = 164;
  const badgeHeight = 44;
  const badgeGap = 18;
  const totalBadgesWidth =
    badges.length * badgeWidth + (badges.length - 1) * badgeGap;
  const startBadgeX = (width - totalBadgesWidth) / 2;
  const badgeY = 296;

  badges.forEach((b, idx) => {
    const bx = startBadgeX + idx * (badgeWidth + badgeGap);

    doc.setFillColor('#f8fafc');
    doc.roundedRect(bx, badgeY, badgeWidth, badgeHeight, 5, 5, 'F');

    doc.setDrawColor('#e2e8f0');
    doc.setLineWidth(1);
    doc.roundedRect(bx, badgeY, badgeWidth, badgeHeight, 5, 5, 'S');

    doc.setDrawColor('#2563eb');
    doc.setLineWidth(1.5);
    doc.line(bx + 14, badgeY, bx + badgeWidth - 14, badgeY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor('#64748b');
    doc.text(b.label, bx + badgeWidth / 2, badgeY + 16, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor('#0f172a');
    doc.text(b.value, bx + badgeWidth / 2, badgeY + 32, { align: 'center' });
  });

  const footerY = 372;

  const sealCenterX = 180;
  const sealCenterY = footerY + 36;
  const sealRadius = 30;

  const numRays = 20;
  doc.setDrawColor('#3b82f6');
  doc.setLineWidth(0.75);
  for (let i = 0; i < numRays; i++) {
    const angle = (i * 2 * Math.PI) / numRays;
    const x1 = sealCenterX + sealRadius * Math.cos(angle);
    const y1 = sealCenterY + sealRadius * Math.sin(angle);
    const x2 = sealCenterX + (sealRadius + 4) * Math.cos(angle);
    const y2 = sealCenterY + (sealRadius + 4) * Math.sin(angle);
    doc.line(x1, y1, x2, y2);
  }

  doc.setDrawColor('#2563eb');
  doc.setLineWidth(1.5);
  doc.circle(sealCenterX, sealCenterY, sealRadius, 'S');

  doc.setDrawColor('#93c5fd');
  doc.setLineWidth(0.75);
  doc.circle(sealCenterX, sealCenterY, sealRadius - 5, 'S');

  doc.setFillColor('#eff6ff');
  doc.circle(sealCenterX, sealCenterY, sealRadius - 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor('#1d4ed8');
  doc.text('OFFICIAL', sealCenterX, sealCenterY - 10, { align: 'center' });

  drawVectorStar(doc, sealCenterX - 11, sealCenterY + 1, 3.2, '#f59e0b');
  drawVectorStar(doc, sealCenterX, sealCenterY, 4.4, '#f59e0b');
  drawVectorStar(doc, sealCenterX + 11, sealCenterY + 1, 3.2, '#f59e0b');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor('#1d4ed8');
  doc.text('VERIFIED', sealCenterX, sealCenterY + 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor('#0f172a');
  doc.text('Selo de Autenticidade', sealCenterX, sealCenterY + 44, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor('#64748b');
  doc.text('Conformidade Digital', sealCenterX, sealCenterY + 54, {
    align: 'center',
  });

  const signCenterX = width - 180;
  const signCenterY = footerY + 36;

  doc.setDrawColor('#2563eb');
  doc.setLineWidth(1.2);
  doc.line(
    signCenterX - 60,
    signCenterY - 6,
    signCenterX - 30,
    signCenterY - 14,
  );
  doc.line(
    signCenterX - 30,
    signCenterY - 14,
    signCenterX - 5,
    signCenterY - 2,
  );
  doc.line(
    signCenterX - 5,
    signCenterY - 2,
    signCenterX + 25,
    signCenterY - 16,
  );
  doc.line(
    signCenterX + 25,
    signCenterY - 16,
    signCenterX + 55,
    signCenterY - 4,
  );

  doc.setDrawColor('#cbd5e1');
  doc.setLineWidth(1);
  doc.line(
    signCenterX - 90,
    signCenterY + 6,
    signCenterX + 90,
    signCenterY + 6,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor('#0f172a');
  doc.text('Diretoria Acadêmica & Ensino', signCenterX, signCenterY + 20, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor('#64748b');
  doc.text('Certificação Digital Homologada', signCenterX, signCenterY + 31, {
    align: 'center',
  });

  const verifyY = height - 68;

  doc.setFillColor('#f1f5f9');
  doc.roundedRect(44, verifyY - 10, width - 88, 30, 4, 4, 'F');
  doc.setDrawColor('#e2e8f0');
  doc.setLineWidth(0.75);
  doc.roundedRect(44, verifyY - 10, width - 88, 30, 4, 4, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor('#475569');
  doc.text(`CÓDIGO DE AUTENTICIDADE: ${c.id}`, 58, verifyY + 9);

  const verificationUrl = `${SERVER_NAME}/api/lms/certificate/${c.id}`;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor('#2563eb');
  doc.text(`Validar em: ${verificationUrl}`, width - 58, verifyY + 9, {
    align: 'right',
  });

  return Buffer.from(doc.output('arraybuffer'));
}
