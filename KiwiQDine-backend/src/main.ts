import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createDataSource, runSeeders } from './infrastructure/database/database.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.setGlobalPrefix('api');
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DineFlow API')
    .setDescription('API documentation for the DineFlow backend services')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Run database seeders
  try {
    const dataSource = createDataSource(configService);
    await runSeeders(dataSource);
  } catch (error) {
    console.error('Error running seeders:', error);
  }

  const port = configService.get<number>('PORT', 4001);
  const serverUrl = configService.get<string>('SERVER_URL', `http://localhost:${port}`);
  const wsUrl = configService.get<string>('WEBSOCKET_URL', serverUrl.replace('http://', 'ws://').replace('https://', 'wss://'));
  
  await app.listen(port);
  
  console.log(`Application is running on: ${serverUrl}/api`);
  console.log(`WebSocket server is available at: ${wsUrl}/order-status`);
  console.log(`Swagger documentation: ${serverUrl}/api/docs`);
}
bootstrap();
