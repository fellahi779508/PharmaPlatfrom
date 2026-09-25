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

  return app;
}

// 1. LOCAL DEVELOPMENT: Boot the server normally
// Vercel automatically injects the VERCEL environment variable. 
// If it's missing, we assume you are running it locally.
if (!process.env.VERCEL) {
  bootstrap().then((app) => {
    const port = process.env.PORT ?? 3000;
    app.listen(port, () => {
      console.log(`Server running locally on port ${port}`);
    });
  });
}

// 2. VERCEL SERVERLESS: Export a cached server handler
let cachedServer: any;

export default async function (req: any, res: any) {
  // Only initialize the Nest app once per serverless function instance
  if (!cachedServer) {
    const app = await bootstrap();
    await app.init(); // Initialize without listening to a port
    cachedServer = app.getHttpAdapter().getInstance(); // Get the raw Express instance
  }

  // Pass the incoming Vercel request to the NestJS Express handler
  return cachedServer(req, res);
}