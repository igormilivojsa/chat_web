import { io } from 'socket.io-client'

let socket;

export const getSocket = () => {
    if (!socket || socket.disconnected) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
            withCredentials: true
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

const resetSocket = () => socket = null;