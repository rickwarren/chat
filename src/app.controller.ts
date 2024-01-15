import { Body, Controller, Get, Param, Post, Delete, Put } from '@nestjs/common';
import { AppService } from './app.service';
import { Message } from './chat/entity/message.entity';
import { CreateMessageDto } from './chat/dto/create-message.dto';

@Controller('messages')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(':id/:id2')
  getMessages(
    @Param('id') id: string,
    @Param('id2') id2: string
  ): Promise<Message[]> {
    return this.appService.getMessages(id, id2);
  }

  @Post()
  createMessage(@Body() message: CreateMessageDto): Promise<Message> {
    return this.appService.createMessage(message);
  }

  @Put()
  updateMesssage(@Body() message: Message): Promise<Message> {
    return this.appService.updateMessage(message);
  }

  @Delete(':id')
  deleteMessage(@Param('id') id: string): Promise<boolean> {
    return this.appService.deleteMessage(id);
  }
}
