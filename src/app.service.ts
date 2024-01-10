import { Injectable } from '@nestjs/common';
import { Message } from './chat/entity/message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async getMessages(userId: string, userId2): Promise<Message[]> {
    const results = await this.messageRepository.find({ where: [
      { userId1: userId, userId2: userId2 },
      { userId1: userId2, userId2: userId }
    ], order: { createdAt: 'ASC' }});
    return results;
  }

  async createMessage(message: CreateMessageDto): Promise<Message> {
    const result = await this.messageRepository.create(message);
    return result;
  }

  async updateMessage(message: Message): Promise<Message> {
    const result = await this.messageRepository.save(message);
    return result;
  }

  async deleteMessage(id: string): Promise<boolean> {
    const result = await this.messageRepository.delete(id);
    return result.affected > 0;
  }
}
