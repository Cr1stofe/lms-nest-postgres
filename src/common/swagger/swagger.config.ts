import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Veltro LMS API')
    .setDescription(
      'Enterprise LMS Backend API built with NestJS, PostgreSQL 18, and Prisma ORM. ' +
        'Features secure session-cookie RBAC, media streaming with X-Accel-Redirect, and dynamic PDF certificate generation.',
    )
    .setVersion('1.0.0')
    .addCookieAuth('__Secure-sid', {
      type: 'apiKey',
      in: 'cookie',
      name: '__Secure-sid',
      description: 'Secure session cookie issued upon authentication',
    })
    .addTag(
      'Auth',
      'Authentication, session management, password recovery, and user directory',
    )
    .addTag('LMS', 'Courses, lessons, student progress tracking, and PDF certificates')
    .addTag(
      'Files',
      'Binary streaming uploads and secure asset delivery via X-Accel-Redirect',
    )
    .addTag('Health', 'Application uptime and service health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Veltro LMS — API Docs',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui { background-color: #0b0f17; color: #f8fafc; }
      .swagger-ui .info .title { color: #f8fafc; font-family: system-ui, sans-serif; }
      .swagger-ui .info p, .swagger-ui .info li { color: #94a3b8; }
      .swagger-ui .scheme-container { background-color: #111827; box-shadow: none; border-bottom: 1px solid #1f2937; }
      .swagger-ui .opblock { border-radius: 8px; border: 1px solid #1f2937; background: #0f172a; margin-bottom: 12px; }
      .swagger-ui .opblock .opblock-summary { border-bottom: 1px solid #1f2937; }
      .swagger-ui .opblock .opblock-summary-method { border-radius: 6px; font-weight: bold; }
      .swagger-ui .opblock-description-wrapper p, .swagger-ui .opblock-external-docs-wrapper p, .swagger-ui .opblock-title_normal p { color: #cbd5e1; }
      .swagger-ui section.models { border-radius: 8px; border: 1px solid #1f2937; background: #0f172a; }
      .swagger-ui section.models h4 { color: #f8fafc; }
      .swagger-ui .model-box { background: #111827; }
      .swagger-ui select, .swagger-ui input[type=text], .swagger-ui textarea { background: #1e293b; color: #f8fafc; border: 1px solid #334155; border-radius: 6px; }
      .swagger-ui .btn { border-radius: 6px; }
      .swagger-ui .btn.authorize { color: #fcd34d; border-color: #fcd34d; }
      .swagger-ui .btn.authorize svg { fill: #fcd34d; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
