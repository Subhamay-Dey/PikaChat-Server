import { Server, Socket } from "socket.io";
import prisma from "./config/db.config.js";

interface CustomSocket extends Socket {
    room?: string
}

export function setupSocket(io: Server) {

    io.use((socket:CustomSocket, next) => {
        const room = socket.handshake.auth.room || socket.handshake.headers.room;
        if(!room) {
            return next(new Error("Invalid room"))
        }
        socket.room = room;
        next()
    })

    io.on('connection', (socket: CustomSocket) => {

        if (socket.room) {
            socket.join(socket.room);
        } else {
            console.error("Socket room is undefined for socket id:", socket.id);
        }

        console.log('The socket connected..', socket.id);

        socket.on("message", async (data) => {
            // console.log("Server side message", data);
            // socket.emit("message", data);
            await prisma.chats.create({
                data: data
            })
            if (socket.room) {
                socket.to(socket.room).emit("message", data);
            } else {
                console.error("Socket room is undefined for socket id:", socket.id);
            }
        });

        socket.on("disconnect", () => {
            console.log("A user disconnected", socket.id);
            
        });
    });
}