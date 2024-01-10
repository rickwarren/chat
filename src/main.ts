import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './chat/adapter/redis.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(3005);
}
bootstrap();
