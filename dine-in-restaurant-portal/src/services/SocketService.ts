import { io, Socket } from "socket.io-client";
import { apiBaseUrl } from "../api/axiosClient";

class SocketService {
    private static instance: SocketService;
    private sockets: Map<string, Socket> = new Map();

    private constructor() { }

    static getInstance() {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    connect(namespace: string, token: string) {
        if (this.sockets.has(namespace)) {
            return this.sockets.get(namespace)!;
        }

        const tempStatusURL = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`;

        const socket = io(`${tempStatusURL.replace("https", "wss")}${namespace}`, {
            auth: { token },
            autoConnect: false,
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
            timeout: 20000,
        });

        socket.on("connect", () => {
            console.log(`[${namespace}] connected`, socket.id);
        });

        socket.on("disconnect", (reason) => {
            console.log(`[${namespace}] disconnected`, reason);
        });

        socket.on("connect_error", (err) => {
            console.error(`[${namespace}] error`, err.message);
        });

        this.sockets.set(namespace, socket);

        socket.connect();

        return socket;
    }

    emit(namespace: string, event: string, payload?: any) {
        const socket = this.sockets.get(namespace);
        if (!socket) {
            console.warn(`Socket not connected for namespace: ${namespace}`);
            return;
        }
        socket.emit(event, payload);
    }

    on(namespace: string, event: string, callback: (...args: any[]) => void) {
        this.sockets.get(namespace)?.on(event, callback);
    }

    off(namespace: string, event: string, callback?: (...args: any[]) => void) {
        const socket = this.sockets.get(namespace);
        if (!socket) return;
        callback ? socket.off(event, callback) : socket.off(event);
    }

    disconnect(namespace: string) {
        const socket = this.sockets.get(namespace);
        socket?.removeAllListeners();
        socket?.disconnect();
        this.sockets.delete(namespace);
    }

    disconnectAll() {
        this.sockets.forEach((socket) => {
            socket.removeAllListeners();
            socket.disconnect();
        });
        this.sockets.clear();
    }
}

export default SocketService;
