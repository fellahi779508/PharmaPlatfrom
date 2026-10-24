import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import {
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Socket.IO WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

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

  // Fix CORS: Avoid wildcard origin with credentials: true
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? [frontendUrl] : true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  return app;
}

// VPS / Docker Deployment
if (!process.env.VERCEL) {
  bootstrap().then((app) => {
    const port = Number(process.env.PORT) || 7000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  });
}

// Vercel Serverless
let cachedServer: any;

export default async function (req: any, res: any) {
  try {
    if (!cachedServer) {
      const app = await bootstrap();
      await app.init();
      cachedServer = app.getHttpAdapter().getInstance();
    }

    return cachedServer(req, res);
  } catch (error) {
    console.error('FATAL ERROR DURING APP INITIALIZATION:', error);

    res.status(500).send({
      message: 'Server failed to start',
      error: (error as Error)?.message || String(error),
    });
  }
}