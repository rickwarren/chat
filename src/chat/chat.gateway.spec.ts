import { Test } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { INestApplication } from '@nestjs/common';
import { Socket, io } from 'socket.io-client';

async function createNestApp(...gateways: any): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({
    providers: gateways,
  }).compile();
  return testingModule.createNestApplication();
}

async function eventReception(from: Socket, event: string): Promise<void> {
  return new Promise<void>((resolve) => {
    from.on(event, () => {
      resolve();
    });
  });
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let app: INestApplication;
  let ioClient: Socket;
  let receiverClient: Socket;

  beforeEach(async () => {
    // Instantiate the app
    app = await createNestApp(ChatGateway);
    // Get the gateway instance from the app instance
    gateway = app.get<ChatGateway>(ChatGateway);
    // Create a new client that will interact with the gateway
    ioClient = io('http://localhost:3000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
    receiverClient = io('http://localhost:3000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });

    app.listen(3000);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it("should send a private message to another client", async () => {
    receiverClient.on("private message", (data) => {
      expect(data).toHaveProperty("from");
      expect(data.from).toBe(ioClient.id);
      expect(data).toHaveProperty("message");
      expect(data.message).toBe("Hello from the other side");
    });
  
    ioClient.connect();
    await eventReception(ioClient, "connect");
  
    receiverClient.connect();
    await eventReception(receiverClient, "connect");
  
    ioClient.emit("private message", {
      from: ioClient.id,
      to: receiverClient.id,
      message: "Hello from the other side",
    });
    await eventReception(receiverClient, "private message");
  
    ioClient.disconnect();
    receiverClient.disconnect();
  });

  it("should send a typing event to another client", async () => {
    receiverClient.on("typing...", (data) => {
      expect(data).toHaveProperty("from");
      expect(data.from).toBe(ioClient.id);
      expect(data).toHaveProperty("message");
      expect(data.message).toBe("is typing...");
    });

    ioClient.connect();
    await eventReception(ioClient, "connect");
    receiverClient.connect();
    await eventReception(receiverClient, "connect");
  
    ioClient.emit("typing...", {
      from: ioClient.id,
      to: receiverClient.id,
      message: "is typing...",
    });
    await eventReception(receiverClient, "typing...");
  
    ioClient.disconnect();
    receiverClient.disconnect();
  });

  it("should send a idle event to another client", async () => {
    receiverClient.on("idle", (data) => {
      expect(data).toHaveProperty("from");
      expect(data.from).toBe(ioClient.id);
    });

    ioClient.connect();
    await eventReception(ioClient, "connect");
    receiverClient.connect();
    await eventReception(receiverClient, "connect");
  
    ioClient.emit("idle", {
      from: ioClient.id,
      to: receiverClient.id,
    });
    await eventReception(receiverClient, "idle");
  
    ioClient.disconnect();
    receiverClient.disconnect();
  });

  it("should send a active event to another client", async () => {
    receiverClient.on("active", (data) => {
      expect(data).toHaveProperty("from");
      expect(data.from).toBe(ioClient.id);
    });

    ioClient.connect();
    await eventReception(ioClient, "connect");
    receiverClient.connect();
    await eventReception(receiverClient, "connect");
  
    ioClient.emit("active", {
      from: ioClient.id,
      to: receiverClient.id,
    });
    await eventReception(receiverClient, "active");
  
    ioClient.disconnect();
    receiverClient.disconnect();
  });

  it("should send the number of clients on the server when connecting", async () => {
    receiverClient.on("connected clients", (data) => {
      expect(data.length).toBe(2);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userID: ioClient.id,
          }),
          expect.objectContaining({
            userID: receiverClient.id,
          }),
        ]),
      );
    });
    ioClient.connect();
    await eventReception(ioClient, "connect");
    
    receiverClient.connect();

    await Promise.all([
      eventReception(receiverClient, "connect"),
      eventReception(receiverClient, "connected clients")
    ]);

    ioClient.disconnect();
    receiverClient.disconnect();
  });
});
