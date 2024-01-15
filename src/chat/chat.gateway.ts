import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entity/message.entity';
import { Repository } from 'typeorm';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transport: 'websocket'
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers: Map<string, string> = new Map();
  private connectedSockets: Map<string, string> = new Map();

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private  jwtService: JwtService,
  ) {}

  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log('Initialized');
  }

  async handleConnection(client: any, ...args: any[]) {
    const { sockets } = this.io.sockets;
    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
    const userId = client.handshake.auth.id;
    const token = client.handshake.auth.token;
 
    try {
      const payload = await this.verifyAccessToken(token);

    if (!userId || !payload) {
      client.disconnect(true);
      return;
    }

    this.connectedUsers.set(userId, client.id);
    this.connectedSockets.set(client.id, userId)

    client.emit("connected clients", this.connectedUsers);
    } catch (e) {
      console.log(e);
    }
  }

  handleDisconnect(client: any) {
    this.logger.log(`Cliend id:${client.id} disconnected`);
    client.emit("connected clients", this.connectedUsers);
  }

  @SubscribeMessage('message')
  async handlePrivateMessage(
    client: any,
    data: any 
  ) {
    const message = {
      userId1: this.connectedSockets.get(client.id),
      userId2: data.to,
      message: data.message,
      status: 'unread'
    };
    const response = await this.messageRepository.save(message);

    if(this.connectedUsers.get(data.to)) {
      client.to(this.connectedUsers.get(data.to)).emit('message', {
        from: client.id,
        message: data.message,
      });
    }
  }

  @SubscribeMessage('typing...')
  handleTyping(
    client,
    data
  ) {
    client.to(data.to).emit('typing...', {
      from: client.id,
      message: data.message,
    });
  }

  @SubscribeMessage('idle')
  handleIdleStatus(
    client,
    data
  ) {
    client.to(data.to).emit('idle', {
      from: client.id,
    });
  }

  @SubscribeMessage('active')
  handleActiveStatus(
    client,
    data
  ) {
    client.to(data.to).emit('active', {
      from: client.id,
    });
  }

  async verifyAccessToken(accessToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: 'secretkey',
      });

      return payload;
    } catch (err) {
      return err;
    }
  }
}
