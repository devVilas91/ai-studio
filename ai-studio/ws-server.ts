import { WebSocketServer as WSServer } from "ws";
import { createServer } from "http";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma-client";

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

interface ServerMessage {
  type: string;
  projectId?: string;
  userId?: string;
  [key: string]: any;
}

interface Client {
  ws: any;
  userId: string;
  projectId: string | null;
}

class WebSocketServer {
  private wss: any;
  private clients: Map<string, Client> = new Map(); // key: userId
  private projectRooms: Map<string, Set<string>> = new Map(); // projectId -> Set of userIds

  start(port: number = 8080) {
    const server = createServer();
    this.wss = new WSServer({ server });

    this.wss.on("connection", async (ws, req) => {
      // Authenticate via JWT token from query string
      const url = new URL(req.url || "", "ws://localhost");
      const token = url.searchParams.get("token");

      if (!token) {
        ws.send(JSON.stringify({ type: "error", code: "UNAUTHORIZED", message: "No token provided" }));
        ws.close();
        return;
      }

      try {
        const decoded: any = verify(token, JWT_SECRET);
        const userId = decoded.sub;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
          ws.send(JSON.stringify({ type: "error", code: "UNAUTHORIZED", message: "User not found" }));
          ws.close();
          return;
        }

        const client: Client = { ws, userId, projectId: null };
        this.clients.set(userId, client);

        ws.on("message", (data: Buffer) => {
          try {
            const msg: ServerMessage = JSON.parse(data.toString());
            this.handleMessage(client, msg);
          } catch (error) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
          }
        });

        ws.on("close", () => {
          this.handleDisconnect(client);
        });

        ws.send(JSON.stringify({ type: "connected", userId }));
      } catch (error) {
        ws.send(JSON.stringify({ type: "error", code: "UNAUTHORIZED", message: "Invalid token" }));
        ws.close();
      }
    });

    server.listen(port, () => {
      console.log(`WebSocket server listening on port ${port}`);
    });
  }

  private async handleMessage(client: Client, msg: ServerMessage) {
    const { type, projectId } = msg;

    switch (type) {
      case "join_project":
        if (projectId) {
          this.joinProject(client, projectId);
        }
        break;
      case "leave_project":
        if (projectId) {
          this.leaveProject(client, projectId);
        }
        break;
      case "cursor_update":
        this.broadcastToProject(client.projectId!, {
          type: "cursor_update",
          userId: client.userId,
          ...msg,
        }, [client.userId]);
        break;
      case "workflow_edit":
        // Broadcast workflow edit to other project members
        this.broadcastToProject(projectId!, {
          type: "workflow_edit",
          ...msg,
          userId: client.userId,
        }, [client.userId]);
        break;
      default:
        console.warn("Unknown message type:", type);
    }
  }

  private joinProject(client: Client, projectId: string) {
    // Leave current project if in one
    if (client.projectId) {
      this.leaveProject(client, client.projectId);
    }

    client.projectId = projectId;
    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set());
    }
    this.projectRooms.get(projectId)!.add(client.userId);

    // Notify others in the project
    this.broadcastToProject(projectId, {
      type: "user_joined",
      userId: client.userId,
    }, [client.userId]);

    client.ws.send(JSON.stringify({ type: "joined", projectId }));
  }

  private leaveProject(client: Client, projectId: string) {
    const room = this.projectRooms.get(projectId);
    if (room) {
      room.delete(client.userId);
      if (room.size === 0) {
        this.projectRooms.delete(projectId);
      }
    }

    // Notify others
    this.broadcastToProject(projectId, {
      type: "user_left",
      userId: client.userId,
    }, [client.userId]);

    client.projectId = null;
  }

  private broadcastToProject(projectId: string, message: ServerMessage, excludeUserIds: string[] = []) {
    const room = this.projectRooms.get(projectId);
    if (!room) return;

    const data = JSON.stringify(message);
    room.forEach((userId) => {
      if (!excludeUserIds.includes(userId)) {
        const client = this.clients.get(userId);
        if (client && client.ws.readyState === 1) { // OPEN
          client.ws.send(data);
        }
      }
    });
  }

  private handleDisconnect(client: Client) {
    this.clients.delete(client.userId);
    if (client.projectId) {
      this.leaveProject(client, client.projectId);
    }
  }

  // Public method to broadcast events from API routes (e.g., workflow execution updates)
  broadcastToProjectId(projectId: string, message: ServerMessage) {
    this.broadcastToProject(projectId, message);
  }
}

// Export singleton instance
export const wsServer = new WebSocketServer();

// Start server if this file is executed directly
if (require.main === module) {
  const port = parseInt(process.env.WS_PORT || "8080");
  wsServer.start(port);
}
