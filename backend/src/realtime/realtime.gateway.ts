import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const projectId = client.handshake.query.projectId || client.handshake.query.project_id;
    if (projectId) {
      const room = `project:${projectId}`;
      client.join(room);
      console.log(`[WS] Client ${client.id} joined room on connection: ${room}`);
    } else {
      console.log(`[WS] Client connected: ${client.id} without initial project ID`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_project')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    // Read project ID from payload or structured attributes
    const rawId = typeof data === 'string' ? data : (data?.projectId || data?.project_id);
    if (rawId) {
      const room = `project:${rawId}`;
      client.join(room);
      console.log(`[WS] Client ${client.id} joined room via event: ${room}`);
      return { status: 'ok', room };
    }
    return { status: 'error', message: 'projectId missing' };
  }

  broadcastToProject(projectId: string, event: string, payload: any) {
    if (!projectId) return;
    const room = `project:${projectId}`;
    console.log(`[WS] Broadcasting event "${event}" to "${room}" with payload:`, JSON.stringify(payload));
    
    // Safety check in case server is not initialized yet during bootstrap
    if (this.server) {
      this.server.to(room).emit(event, payload);
    }
  }
}
