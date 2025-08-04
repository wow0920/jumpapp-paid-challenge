import "dotenv/config";
import express from "express";
import ViteExpress from "vite-express";
import routes from "./routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

interface CustomSocket extends Socket {
  user?: any;
}

const PORT = Number(process.env.PORT || 3000);

// Express app setup
const app = express();
app.use(cors({ credentials: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use("/api", routes);

// Create raw HTTP server
const httpServer = createServer(app);

// Attach Socket.IO to raw HTTP server
export const io = new SocketIOServer(httpServer, {
  pingTimeout: 600000,
  pingInterval: 25000,
  cors: {
    origin: "*",
    allowedHeaders: ["client-type"],
    credentials: false,
  },
  maxHttpBufferSize: 1e8,
});

function getSocketsByUserId(userId: string) {
  return Array.from(io.sockets.sockets.values()).filter((s: CustomSocket) => s.user?.id === userId);
}
export function sendMessageToUser(userId: string, message: string, payload: any = {}) {
  getSocketsByUserId(userId).forEach((socket) => {
    socket.emit(message, payload);
  });
}

io.use(async (socket: CustomSocket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      throw new Error("No auth token provided.");
    }
    const parsedCookies = cookie.parse(cookies);
    if (!parsedCookies?.token) {
      throw new Error("No auth token provided.");
    }
    const token = parsedCookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    socket.user = decoded;
    next();
  } catch (e) {
    console.log("Critical, socket handshake auth error", e.message);
    next(new Error(e.message));
  }
});
io.on("connection", (socket: CustomSocket) => {
  console.log("Socket connected:", socket.id, socket.user);
});

ViteExpress.bind(app, httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
