
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import {
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: false,
    }),
  );

  const port = process.env.PORT ?? 3000;

  await app.listen(port);
}

bootstrap();