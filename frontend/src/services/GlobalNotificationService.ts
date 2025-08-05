/**
 * Global Notification Service
 * Handles WebSocket connections and notifications for all pages
 */

export class GlobalNotificationService {
    private static instance: GlobalNotificationService;
    private ws: WebSocket | null = null;
    private isConnected = false;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private userData: any = null;
    private messageHandlers: ((data: any) => void | boolean)[] = [];

    private constructor() {
        this.initializeUserData();
    }

    public static getInstance(): GlobalNotificationService {
        if (!GlobalNotificationService.instance) {
            GlobalNotificationService.instance = new GlobalNotificationService();
        }
        return GlobalNotificationService.instance;
    }

    private initializeUserData() {
        try {
            const currentUser = sessionStorage.getItem("currentUser");
            const userId = sessionStorage.getItem("userId");
            
            if (currentUser) {
                this.userData = JSON.parse(currentUser);
                if (userId) {
                    this.userData.id = parseInt(userId);
                }
            } else {
                console.log("❌ No currentUser in sessionStorage");
                this.userData = null;
            }
        } catch (error) {
            console.error("❌ Error initializing user data:", error);
            this.userData = null;
        }
    }

    public connect() {
        
        this.initializeUserData();
        
        if (!this.userData || !this.userData.username) {
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname;
            
            const wsUrl = `${protocol}//${host}:3002/ws/chat?username=${encodeURIComponent(this.userData.username)}&userId=${this.userData.id}`;
            
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error("Error parsing notification message:", error);
                }
            };

            this.ws.onclose = () => {
                console.log("🔌 Global notification service disconnected");
                this.isConnected = false;
                this.scheduleReconnect();
            };

            this.ws.onerror = () => {
                this.isConnected = false;
            };

        } catch (error) {

            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
        
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }

    private handleMessage(data: any) {
        
        let handled = false;
        for (let i = 0; i < this.messageHandlers.length; i++) {
            const handler = this.messageHandlers[i];
            try {
                const result = handler(data);
                if (result === true) {
                    handled = true;
                    break;
                } else {
                }
            } catch (error) {
            }
        }

        if (!handled) {
            switch (data.type) {
                case "tournament_notification":
                    this.showTournamentNotification(data.message);
                    break;
                case "game_invite_received":
                    this.showGameInviteNotification(data.senderUsername, data.inviteId);
                    break;
                case "game_invite_sent":
                    this.showSuccessMessage(`Game invitation sent to ${data.receiverUsername}`);
                    break;
                case "game_invite_accepted":
                    this.showSuccessMessage(`${data.receiverUsername} accepted your game invitation! ${data.message || ''}`);
                    break;
                case "game_invite_declined":
                    this.showErrorMessage(`${data.receiverUsername} declined your game invitation`);
                    break;
                case "game_invite_response":
                    if (data.status === "accepted") {
                        this.showSuccessMessage(`Game invitation ${data.status}! ${data.message || ''}`);
                    } else {
                        this.showErrorMessage(`Game invitation ${data.status}`);
                    }
                    break;
                case "redirect_to_game":
                    this.handleRedirectToGame(data);
                    break;
                default:
                    break;
            }
        }
    }

    private showTournamentNotification(message: string) {
        const existingNotifications = document.querySelectorAll('.tournament-notification');
        existingNotifications.forEach(notification => notification.remove());

        const notificationDiv = document.createElement("div");
        notificationDiv.className = "tournament-notification fixed top-4 left-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-lg shadow-[0_0_20px_rgb(147,51,234)] border border-purple-400/50 backdrop-blur-sm z-[9999] max-w-sm animate-pulse";
        notificationDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-purple-200 text-2xl">🏆</div>
                <div>
                    <div class="font-bold text-lg">Tournament Alert</div>
                    <div class="text-sm text-purple-200 mt-1">${message}</div>
                </div>
                <button class="ml-2 text-purple-200 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                    ✕
                </button>
            </div>
        `;
        
        document.body.appendChild(notificationDiv);

        setTimeout(() => {
            if (notificationDiv.parentNode) {
                notificationDiv.remove();
            }
        }, 10000);
    }

    private showGameInviteNotification(senderUsername: string, inviteId: number) {
        const notificationDiv = document.createElement("div");
        notificationDiv.className = "fixed top-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-lg shadow-[0_0_15px_rgb(34,197,94)] border border-green-400/50 backdrop-blur-sm z-[9999] max-w-sm";
        notificationDiv.innerHTML = `
            <div class="flex flex-col gap-3">
                <div class="flex items-center gap-3">
                    <div class="text-green-200">🎮</div>
                    <div>
                        <div class="font-medium">Game Invitation</div>
                        <div class="text-sm text-green-200">${senderUsername} wants to play Pong!</div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors" onclick="globalNotificationService.acceptGameInvite(${inviteId})">
                        Accept
                    </button>
                    <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors" onclick="globalNotificationService.declineGameInvite(${inviteId})">
                        Decline
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(notificationDiv);

        setTimeout(() => {
            if (notificationDiv.parentNode) {
                notificationDiv.remove();
            }
        }, 30000);
    }

    private handleRedirectToGame(data: any) {
        sessionStorage.setItem('gameRoomId', data.gameRoomId);
        sessionStorage.setItem('gameOpponent', data.opponent);
        
        this.showSuccessMessage(data.message || "Redirecting to game...");
        
        setTimeout(() => {
            import("../router/router.js").then(({ router }) => {
                router.navigate("/server-game/versus");
            });
        }, 1000);
    }

    private showSuccessMessage(message: string) {
        const successDiv = document.createElement("div");
        successDiv.className = "fixed top-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg shadow-[0_0_15px_rgb(34,197,94)] border border-green-400/50 backdrop-blur-sm z-[9999]";
        successDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-green-200">✅</div>
                <div class="font-medium">${message}</div>
            </div>
        `;
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    private showErrorMessage(message: string) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "fixed top-4 right-4 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg shadow-[0_0_15px_rgb(239,68,68)] border border-red-400/50 backdrop-blur-sm z-[9999]";
        errorDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-red-200">⚠️</div>
                <div class="font-medium">${message}</div>
            </div>
        `;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    public acceptGameInvite(inviteId: number) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: "accept_game_invite",
                inviteId: inviteId
            }));
        }
        // Remove the notification
        const notification = document.querySelector('.fixed.top-4.right-4');
        if (notification) {
            notification.remove();
        }
    }

    public declineGameInvite(inviteId: number) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: "decline_game_invite",
                inviteId: inviteId
            }));
        }
        // Remove the notification
        const notification = document.querySelector('.fixed.top-4.right-4');
        if (notification) {
            notification.remove();
        }
    }

    public sendGameInvite(receiverUsername: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: "send_game_invite",
                receiverUsername: receiverUsername
            }));
        }
    }

    public sendMessage(message: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error("❌ Cannot send message - WebSocket not ready");
        }
    }

    public addMessageHandler(handler: (data: any) => boolean | void) {
        this.removeMessageHandler(handler);
        this.messageHandlers.push(handler);
    }

    public removeMessageHandler(handler: (data: any) => boolean | void) {
        const index = this.messageHandlers.indexOf(handler);
        if (index > -1) {
            this.messageHandlers.splice(index, 1);
        }
    }

    public clearChatHandlers() {
        if (this.messageHandlers.length > 0) {
            this.messageHandlers = [];
        }
    }

    public disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this.isConnected = false;
        this.reconnectAttempts = 0;
    }

    public isReady(): boolean {
        return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
    }

    public getDebugInfo() {
        return {
            isConnected: this.isConnected,
            wsState: this.ws?.readyState,
            userData: this.userData,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    public forceReconnect() {
        console.log("🔧 Forcing reconnection...");
        if (this.ws) {
            this.ws.close();
        }
        this.isConnected = false;
        this.connect();
    }
}

const globalNotificationService = GlobalNotificationService.getInstance();

(window as any).globalNotificationService = globalNotificationService;

export default globalNotificationService;