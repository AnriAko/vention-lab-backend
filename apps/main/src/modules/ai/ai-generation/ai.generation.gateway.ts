import { Injectable } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';

@Injectable()
@WebSocketGateway()
export class AiGateway {}
