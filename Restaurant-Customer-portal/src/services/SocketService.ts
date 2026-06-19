import { io, Socket } from "socket.io-client";

class SocketService {
    private static instance: SocketService;
    private socket: Socket | null = null;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    // Connect to server
    public connect(url: string, options = {}): void {
        if (this.socket) return;
        const tempURL = url.endsWith('/') ? `${url}order-status` : `${url}/order-status`;
        this.socket = io(tempURL, {
            transports: ["polling", "websocket"],
            reconnection: true,
            reconnectionDelay: 5000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
            timeout: 20000,
            ...options,
        });

        this.socket.on("connect", () => {
            console.log("Socket connected:", this.socket?.id);
        });

        this.socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });
    }

    // Listen to events
    public on(event: string, callback: (...args: any[]) => void) {
        this.socket?.on(event, callback);
    }

    // Remove event listener
    public off(event: string, callback: (...args: any[]) => void) {
        this.socket?.off(event, callback);
    }

    // Emit events
    public emit(event: string, data?: any) {
        this.socket?.emit(event, data);
    }

    // Disconnect
    public disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    // Get socket id
    public getId() {
        return this.socket?.id;
    }
}

export default SocketService;
