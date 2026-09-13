import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe with i18n support
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true, // Strips out properties that do not have decorators in the DTO
      transform: true, // Automatically transforms payloads to DTO instances
    }),
  );

  // Format validation errors into localized response objects
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: false, // Set to true if you need structured field error arrays
    }),
  );

  const port = process.env.PORT!;
  await app.listen(port);
}
bootstrap();
