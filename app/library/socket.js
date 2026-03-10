import { io } from 'socket.io-client'

let socket;

export const getSocket = (token) => {
    if (!socket) {
        socket = io('http://localhost:3001', {
            auth: {
                token
            }
        });

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connect error", err);
        });
    }

    return socket;
}