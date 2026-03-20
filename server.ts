import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  // In-memory state
  const users = new Map<string, { id: string; name: string; avatar: string }>();
  const rooms = new Map<string, { id: string; name: string; type: 'private' | 'group'; members: string[] }>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", ({ name, avatar }) => {
      users.set(socket.id, { id: socket.id, name, avatar });
      io.emit("users_list", Array.from(users.values()));
    });

    socket.on("send_message", (message) => {
      // message: { roomId, text, senderId, type: 'text' | 'image' }
      io.to(message.roomId).emit("receive_message", {
        ...message,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
    });

    // WebRTC Signaling
    socket.on("call_user", ({ to, offer, from, type }) => {
      io.to(to).emit("incoming_call", { from, offer, type });
    });

    socket.on("answer_call", ({ to, answer }) => {
      io.to(to).emit("call_answered", { answer });
    });

    socket.on("ice_candidate", ({ to, candidate }) => {
      io.to(to).emit("ice_candidate", { candidate });
    });

    socket.on("end_call", ({ to }) => {
      io.to(to).emit("call_ended");
    });

    socket.on("disconnect", () => {
      users.delete(socket.id);
      io.emit("users_list", Array.from(users.values()));
      console.log("User disconnected:", socket.id);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
