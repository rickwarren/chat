import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entity/message.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message]),
        JwtModule.register({
            secret: 'somesecret',
            signOptions: { expiresIn: 3600 },
        }),
    ],
    providers: [ChatGateway],
})
export class ChatModule {}
