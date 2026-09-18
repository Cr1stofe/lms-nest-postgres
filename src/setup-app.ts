import {
  type INestApplication,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

export function setupApp(app: INestApplication) {
  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (validationErrors) => {
        const errors: Record<string, string[]> = {};
        let firstTitle = 'dados inválidos';

        for (const error of validationErrors) {
          const field = error.property;
          const constraints = error.constraints
            ? Object.values(error.constraints)
            : ['valor inválido'];

          errors[field] = constraints;

          if (firstTitle === 'dados inválidos' && constraints[0]) {
            firstTitle = `${field}: ${constraints[0]}`;
          }
        }

        return new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            title: firstTitle,
            errors,
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      },
    }),
  );
}
