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
    // fallback
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

  doc.setFillColor('#090d16');
  doc.rect(0, 0, width, height, 'F');

  doc.setFillColor('#0f172a');
  doc.roundedRect(15, 15, width - 30, height - 30, 8, 8, 'F');
  doc.setFillColor('#0a0e1a');
  doc.roundedRect(20, 20, width - 40, height - 40, 6, 6, 'F');

  doc.setDrawColor('#d4af37');
  doc.setLineWidth(1.5);
  doc.rect(28, 28, width - 56, height - 56);

  doc.setDrawColor('#856514');
  doc.setLineWidth(0.75);
  doc.rect(34, 34, width - 68, height - 68);

  const cornerSize = 18;
  const corners = [
    { x: 34, y: 34, dx: 1, dy: 1 },
    { x: width - 34, y: 34, dx: -1, dy: 1 },
    { x: 34, y: height - 34, dx: 1, dy: -1 },
    { x: width - 34, y: height - 34, dx: -1, dy: -1 },
  ];

  for (const corner of corners) {
    const lx = corner.x + corner.dx * 8;
    const ly = corner.y + corner.dy * 8;
    drawDiamond(doc, lx, ly, 8, 8, '#d4af37');

    doc.setDrawColor('#d4af37');
    doc.setLineWidth(1);
    doc.line(corner.x, corner.y, corner.x + corner.dx * cornerSize, corner.y);
    doc.line(corner.x, corner.y, corner.x, corner.y + corner.dy * cornerSize);
  }

  doc.setDrawColor('#d4af37');
  doc.setLineWidth(1);
  doc.line(centerX - 120, 65, centerX - 18, 65);
  doc.line(centerX + 18, 65, centerX + 120, 65);

  drawDiamond(doc, centerX, 65, 12, 12, '#e5c07b');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor('#94a3b8');
  doc.text(
    'PLATAFORMA LMS   |   CERTIFICAÇÃO PROFISSIONAL DE EXCELÊNCIA',
    centerX,
    88,
    { align: 'center' },
  );

  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor('#f8fafc');
  doc.text('CERTIFICADO DE CONCLUSÃO', centerX, 126, { align: 'center' });

  doc.setDrawColor('#d4af37');
  doc.setLineWidth(1);
  doc.line(centerX - 180, 138, centerX + 180, 138);
  doc.setFillColor('#e5c07b');
  doc.circle(centerX, 138, 2.5, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor('#94a3b8');
  doc.text('Certificamos para os devidos fins que', centerX, 168, {
    align: 'center',
  });

  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor('#ffffff');
  doc.text(c.name, centerX, 206, { align: 'center' });

  doc.setDrawColor('#334155');
  doc.setLineWidth(1);
  doc.line(centerX - 150, 218, centerX + 150, 218);
  doc.setDrawColor('#d4af37');
  doc.setLineWidth(1.5);
  doc.line(centerX - 40, 218, centerX + 40, 218);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor('#94a3b8');
  doc.text(
    'concluiu com êxito todos os módulos e requisitos do curso:',
    centerX,
    244,
    { align: 'center' },
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor('#fcd34d');
  doc.text(`"${c.title}"`, centerX, 274, { align: 'center' });

  const formattedDate = formatDate(c.completed);
  const badges = [
    { label: 'CARGA HORÁRIA', value: `${c.hours} Horas` },
    { label: 'CONTEÚDO', value: `${c.lessons} Aulas Concluídas` },
    { label: 'DATA DE EMISSÃO', value: formattedDate },
  ];

  const badgeWidth = 160;
  const badgeHeight = 44;
  const badgeGap = 20;
  const totalBadgesWidth =
    badges.length * badgeWidth + (badges.length - 1) * badgeGap;
  const startBadgeX = (width - totalBadgesWidth) / 2;
  const badgeY = 302;

  badges.forEach((b, idx) => {
    const bx = startBadgeX + idx * (badgeWidth + badgeGap);

    doc.setFillColor('#0f172a');
    doc.roundedRect(bx, badgeY, badgeWidth, badgeHeight, 5, 5, 'F');

    doc.setDrawColor('#1e293b');
    doc.setLineWidth(1);
    doc.roundedRect(bx, badgeY, badgeWidth, badgeHeight, 5, 5, 'S');

    doc.setDrawColor('#d4af37');
    doc.setLineWidth(1.5);
    doc.line(bx + 12, badgeY, bx + badgeWidth - 12, badgeY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor('#64748b');
    doc.text(b.label, bx + badgeWidth / 2, badgeY + 16, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor('#f8fafc');
    doc.text(b.value, bx + badgeWidth / 2, badgeY + 32, { align: 'center' });
  });

  const footerY = 378;

  const sealCenterX = 180;
  const sealCenterY = footerY + 36;
  const sealRadius = 31;

  const numRays = 20;
  doc.setDrawColor('#a17d1e');
  doc.setLineWidth(1);
  for (let i = 0; i < numRays; i++) {
    const angle = (i * 2 * Math.PI) / numRays;
    const x1 = sealCenterX + sealRadius * Math.cos(angle);
    const y1 = sealCenterY + sealRadius * Math.sin(angle);
    const x2 = sealCenterX + (sealRadius + 4) * Math.cos(angle);
    const y2 = sealCenterY + (sealRadius + 4) * Math.sin(angle);
    doc.line(x1, y1, x2, y2);
  }

  doc.setDrawColor('#d4af37');
  doc.setLineWidth(1.5);
  doc.circle(sealCenterX, sealCenterY, sealRadius, 'S');

  doc.setDrawColor('#856514');
  doc.setLineWidth(0.75);
  doc.circle(sealCenterX, sealCenterY, sealRadius - 5, 'S');

  doc.setFillColor('#0f172a');
  doc.circle(sealCenterX, sealCenterY, sealRadius - 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor('#e5c07b');
  doc.text('OFFICIAL', sealCenterX, sealCenterY - 11, { align: 'center' });

  drawVectorStar(doc, sealCenterX - 11, sealCenterY, 3.2, '#fcd34d');
  drawVectorStar(doc, sealCenterX, sealCenterY - 1, 4.4, '#fcd34d');
  drawVectorStar(doc, sealCenterX + 11, sealCenterY, 3.2, '#fcd34d');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor('#e5c07b');
  doc.text('VERIFIED', sealCenterX, sealCenterY + 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor('#94a3b8');
  doc.text('Selo de Autenticidade', sealCenterX, sealCenterY + 45, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor('#64748b');
  doc.text('Conformidade Digital', sealCenterX, sealCenterY + 55, {
    align: 'center',
  });

  const signCenterX = width - 180;
  const signCenterY = footerY + 36;

  doc.setDrawColor('#94a3b8');
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

  doc.setDrawColor('#334155');
  doc.setLineWidth(1);
  doc.line(
    signCenterX - 90,
    signCenterY + 6,
    signCenterX + 90,
    signCenterY + 6,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor('#e2e8f0');
  doc.text('Diretoria Acadêmica & Ensino', signCenterX, signCenterY + 20, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#64748b');
  doc.text('Certificação Digital Homologada', signCenterX, signCenterY + 32, {
    align: 'center',
  });

  const verifyY = height - 70;

  doc.setFillColor('#0b101d');
  doc.roundedRect(48, verifyY - 10, width - 96, 32, 4, 4, 'F');
  doc.setDrawColor('#1e293b');
  doc.setLineWidth(0.75);
  doc.roundedRect(48, verifyY - 10, width - 96, 32, 4, 4, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor('#94a3b8');
  doc.text(`CÓDIGO DE AUTENTICIDADE: ${c.id}`, 65, verifyY + 9);

  const verificationUrl = `${SERVER_NAME}/api/lms/certificate/${c.id}`;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor('#60a5fa');
  doc.text(`Validar em: ${verificationUrl}`, width - 65, verifyY + 9, {
    align: 'right',
  });

  return Buffer.from(doc.output('arraybuffer'));
}
