// =============== CLIENT-SIDE POUR SERVER-SIDE PONG ===============

interface GameStateMessage {
    type: 'gameState';
    ball: {
        ball_x: number;
        ball_y: number;
        ball_dir_x: number;
        ball_dir_y: number;
        angle: number;
        ia_x: number;
        ia_y: number;
        time_ia_in_frame: number;
        distance_ia: number;
        current_rebond: number;
    };
    paddle: {
        // Pour mode solo/versus (2 raquettes)
        left_paddle_y?: number;
        right_paddle_y?: number;
        // Pour mode multi (4 raquettes)
        paddles?: {
            p1_y: number;
            p2_y: number;
            p3_y: number;
            p4_y: number;
        };
        marge: number;
        current_shot: number;
    };
    state: {
        left_score: number;
        right_score: number;
        is_paused: boolean;
        game_running: boolean;
        game_mode: 'solo' | 'versus';
        count_down_active: boolean;
        ia_mode: boolean;
        restart_active: boolean;
    };
    config: {
        canvas_width: number;
        canvas_height: number;
        paddle_width: number;
        paddle_height: number;
        ball_speed: number;
        ball_real_speed: number;
        ball_max_speed: number;
        paddle_speed: number;
        score_to_win: number;
        increase_vitesse: number;
        time_before_new_ball: number;
    };
    timestamp: number;
}

interface GameEndMessage {
    type: 'gameEnd';
    winner: 'left' | 'right';
    timestamp: number;
}

export class ServerPongClient {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private ws: WebSocket | null = null;
    private gameId: string | null = null;
    private gameMode: 'solo' | 'versus' | 'multi' = 'versus';
    private isConnecting: boolean = false;
    
    // État local (reçu du serveur)
    private gameState: GameStateMessage | null = null;
    private keys_pressed: Record<string, boolean> = {};
    
    // Éléments DOM
    private count_down: HTMLDivElement;
    private end_message: HTMLElement | null = null;
    
    // Configuration de rendu
    private start_time: number = 0;
    private animationId: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.count_down = document.getElementById("countdowndisplay") as HTMLDivElement;
        this.end_message = document.getElementById('endMessage');
        
        this.setup_events();
        this.start_time = performance.now();
        
        // Nettoyer automatiquement quand la page se ferme
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }

    // =============== CONNEXION AU SERVEUR ===============
    
    async connectToGame(gameId?: string, mode: 'solo' | 'versus' | 'multi' = 'versus'): Promise<void> {
        // Éviter les connexions multiples avec une vérification plus stricte
        if (this.isConnecting) {
            console.log("⚠️ Connection already in progress, ignoring...");
            return Promise.reject(new Error('Connection already in progress'));
        }
        
        // Éviter de se connecter si déjà connecté à un jeu
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.gameId) {
            console.log("⚠️ Already connected to game:", this.gameId);
            return Promise.reject(new Error('Already connected to a game'));
        }
        
        // Fermer la connexion existante si elle existe
        if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
            console.log("🔌 Closing existing WebSocket connection...");
            this.ws.close();
            this.ws = null;
        }
        
        this.isConnecting = true;
        
        try {
            // Si pas de gameId fourni, créer une nouvelle partie
            if (!gameId) {
                console.log("🎮 Creating new game...");
                const response = await fetch('/api/game/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode })
                });
                
                const result = await response.json();
                if (result.success) {
                    gameId = result.gameId;
                    console.log("✅ Game created:", gameId);
                } else {
                    throw new Error('Failed to create game');
                }
            }
            
            this.gameId = gameId;
            this.gameMode = mode; // Stocker le mode pour l'utiliser dans la connexion WebSocket
            await this.connectWebSocket();
            
            // ⚡ DÉMARRER LA PARTIE AUTOMATIQUEMENT
            console.log("🚀 Auto-starting game...");
            
        } catch (error) {
            console.error("❌ Failed to connect to game:", error);
            throw error;
        } finally {
            this.isConnecting = false;
        }
    }

    private async connectWebSocket(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.gameId) {
                reject(new Error('No game ID'));
                return;
            }

            // Détecter automatiquement le protocole selon la page actuelle
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const playerId = `player_${Date.now()}`;
            const wsUrl = `${protocol}//${window.location.host}/ws/game/${this.gameId}?playerId=${playerId}&mode=${this.gameMode}`;
            
            console.log("🔌 Connecting to WebSocket:", wsUrl);
            console.log("🔍 WebSocket Protocol:", protocol);
            console.log("🔍 Host:", window.location.host);
            console.log("🔍 Game Mode:", this.gameMode);
            console.log("🔍 Current page protocol:", window.location.protocol);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log("✅ WebSocket connected");
                console.log("🔍 WebSocket readyState:", this.ws?.readyState);
                resolve();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                } catch (error) {
                    console.error("Error parsing server message:", error);
                }
            };
            
            this.ws.onclose = (event) => {
                console.log("👋 WebSocket disconnected");
                console.log("🔍 Close code:", event.code);
                console.log("🔍 Close reason:", event.reason);
                console.log("🔍 Was clean:", event.wasClean);
                this.handleDisconnection();
            };
            
            this.ws.onerror = (error) => {
                console.error("❌ WebSocket error:", error);
                reject(error);
            };
        });
    }

    // =============== GESTION DES MESSAGES SERVEUR ===============
    
    private handleServerMessage(data: any) {
        switch (data.type) {
            case 'gameState':
                this.gameState = data as GameStateMessage;
                break;
                
            case 'gameEnd':
                this.handleGameEnd(data as GameEndMessage);
                break;
                
            default:
                console.log("Unknown server message:", data);
        }
    }

    private handleGameEnd(data: GameEndMessage) {
        console.log(`🏆 Game ended! Winner: ${data.winner}`);
        
        let message = '';
        if (data.winner === 'left') {
            message = '🏆 Joueur 1 gagne la partie !';
        } else {
            message = '🏆 Joueur 2 gagne la partie !';
        }

        if (this.end_message) {
            this.end_message.textContent = message;
            this.end_message.style.display = 'block';
        }
    }

    private handleDisconnection() {
        // Arrêter l'animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = 0;
        }
        
        // Afficher message de déconnexion
        if (this.count_down) {
            this.count_down.innerText = "Connexion perdue...";
        }
    }

    // =============== GESTION DES INPUTS ===============
    
    private setup_events(): void {
        document.addEventListener("keydown", this.handle_keydown);
        document.addEventListener("keyup", this.handle_keyup);
    }

    private handle_keydown = (e: KeyboardEvent) => {
        // Ne pas traiter les touches de répétition
        if (e.repeat) return;
        
        this.keys_pressed[e.key] = true;
        this.sendInputToServer();
        
        console.log(`🎮 Key pressed: ${e.key}`);
    };

    private handle_keyup = (e: KeyboardEvent) => {
        this.keys_pressed[e.key] = false;
        this.sendInputToServer();
        
        console.log(`🎮 Key released: ${e.key}`);
    };

    private sendInputToServer() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const inputMessage = {
                type: 'playerInput',
                keys: { ...this.keys_pressed },
                timestamp: Date.now()
            };
            
            this.ws.send(JSON.stringify(inputMessage));
            console.log('📤 Sending input to server:', inputMessage);
        } else {
            console.log('❌ Cannot send input - WebSocket not ready:', this.ws?.readyState);
        }
    }

    // =============== RENDU ===============
    
    start(): void {
        console.log("🎮 Starting client-side rendering...");
        this.render_loop();
    }

    private render_loop(): void {
        this.draw();
        this.animationId = requestAnimationFrame(() => this.render_loop());
    }

    private draw(): void {
        if (!this.ctx || !this.gameState) {
            // Afficher écran de chargement
            this.drawLoadingScreen();
            return;
        }

        const { ball, paddle, state, config } = this.gameState;

        // === 1. FOND NOIR AVEC DÉGRADÉ ===
        let bgGradient = this.ctx.createLinearGradient(0, 0, 0, config.canvas_height);
        bgGradient.addColorStop(0, "#0f0f0f");
        bgGradient.addColorStop(1, "#1a1a1a");
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, config.canvas_width, config.canvas_height);

        // === 2. LIGNES DU MILIEU EN POINTILLÉS ===
        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([10, 15]);
        this.ctx.strokeStyle = "#444";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(config.canvas_width / 2, 0);
        this.ctx.lineTo(config.canvas_width / 2, config.canvas_height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // === 3. RAQUETTES STYLE NÉON ===
        if (paddle.paddles) {
            // Mode multi (4 raquettes)
            // Raquettes gauches
            this.ctx.shadowColor = "#00ffff";
            this.ctx.shadowBlur = 20;
            
            let paddleGradientP1 = this.ctx.createLinearGradient(0, paddle.paddles.p1_y, 0, paddle.paddles.p1_y + config.paddle_height);
            paddleGradientP1.addColorStop(0, "#00ffff");
            paddleGradientP1.addColorStop(1, "#005f5f");
            this.ctx.fillStyle = paddleGradientP1;
            this.ctx.fillRect(30, paddle.paddles.p1_y, config.paddle_width, config.paddle_height);

            let paddleGradientP2 = this.ctx.createLinearGradient(0, paddle.paddles.p2_y, 0, paddle.paddles.p2_y + config.paddle_height);
            paddleGradientP2.addColorStop(0, "#00ffff");
            paddleGradientP2.addColorStop(1, "#005f5f");
            this.ctx.fillStyle = paddleGradientP2;
            this.ctx.fillRect(30, paddle.paddles.p2_y, config.paddle_width, config.paddle_height);

            // Raquettes droites
            this.ctx.shadowColor = "#ff00ff";
            this.ctx.shadowBlur = 20;

            let paddleGradientP3 = this.ctx.createLinearGradient(0, paddle.paddles.p3_y, 0, paddle.paddles.p3_y + config.paddle_height);
            paddleGradientP3.addColorStop(0, "#ff00ff");
            paddleGradientP3.addColorStop(1, "#5f005f");
            this.ctx.fillStyle = paddleGradientP3;
            this.ctx.fillRect(config.canvas_width - 30 - config.paddle_width, paddle.paddles.p3_y, config.paddle_width, config.paddle_height);
            
            let paddleGradientP4 = this.ctx.createLinearGradient(0, paddle.paddles.p4_y, 0, paddle.paddles.p4_y + config.paddle_height);
            paddleGradientP4.addColorStop(0, "#ff00ff");
            paddleGradientP4.addColorStop(1, "#5f005f");
            this.ctx.fillStyle = paddleGradientP4;
            this.ctx.fillRect(config.canvas_width - 30 - config.paddle_width, paddle.paddles.p4_y, config.paddle_width, config.paddle_height);
        } else if (paddle.left_paddle_y !== undefined && paddle.right_paddle_y !== undefined) {
            // Mode solo/versus (2 raquettes)
            // Raquette gauche
            this.ctx.shadowColor = "#00ffff";
            this.ctx.shadowBlur = 20;
            let paddleGradientLeft = this.ctx.createLinearGradient(0, paddle.left_paddle_y, 0, paddle.left_paddle_y + config.paddle_height);
            paddleGradientLeft.addColorStop(0, "#00ffff");
            paddleGradientLeft.addColorStop(1, "#005f5f");
            this.ctx.fillStyle = paddleGradientLeft;
            this.ctx.fillRect(30, paddle.left_paddle_y, config.paddle_width, config.paddle_height);

            // Raquette droite
            this.ctx.shadowColor = "#ff00ff";
            this.ctx.shadowBlur = 20;
            let paddleGradientRight = this.ctx.createLinearGradient(0, paddle.right_paddle_y, 0, paddle.right_paddle_y + config.paddle_height);
            paddleGradientRight.addColorStop(0, "#ff00ff");
            paddleGradientRight.addColorStop(1, "#5f005f");
            this.ctx.fillStyle = paddleGradientRight;
            this.ctx.fillRect(config.canvas_width - 30 - config.paddle_width, paddle.right_paddle_y, config.paddle_width, config.paddle_height);
        }

        // === 4. BALLE PULSANTE ET CLIGNOTANTE ===
        const pulse = 10 + Math.sin(Date.now() / 100) * 2;
        const blink = Math.floor(Date.now() / 200) % 2 === 0;
        this.ctx.shadowColor = blink ? "#ffff00" : "#ff00ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillStyle = blink ? "#ffff00" : "#ff00ff";
        this.ctx.beginPath();
        this.ctx.arc(ball.ball_x, ball.ball_y, pulse, 0, Math.PI * 2);
        this.ctx.fill();

        // === 5. HUD (score, vitesse) ===
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = "#00ffcc";
        this.ctx.font = "bold 18px 'Courier New', monospace";
        const currentSpeed = Math.sqrt(ball.ball_dir_x * ball.ball_dir_x + ball.ball_dir_y * ball.ball_dir_y);
        this.ctx.fillText(`🎯 Vitesse: ${currentSpeed.toFixed(2)}`, 20, 30);

        this.ctx.fillStyle = "#ff66cc";
        this.ctx.font = "14px 'Courier New', monospace";
        this.ctx.fillText(`⏱️ Latence: ${Date.now() - this.gameState.timestamp} ms`, 20, 55);

        // === 6. SCORE ===
        this.updateScoreDisplay(state.left_score, state.right_score);

        // === 7. COUNTDOWN SI ACTIF ===
        if (state.count_down_active && this.count_down) {
            this.count_down.style.display = 'block';
        } else if (this.count_down) {
            this.count_down.style.display = 'none';
        }
    }

    private drawLoadingScreen(): void {
        if (!this.ctx) return;

        // Fond noir
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Message de chargement
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "24px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Connexion au serveur...", this.canvas.width / 2, this.canvas.height / 2);
        
        // Animation de chargement
        const dots = ".".repeat((Math.floor(Date.now() / 500) % 4));
        this.ctx.fillText(dots, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    private updateScoreDisplay(leftScore: number, rightScore: number): void {
        const score_P1 = document.getElementById('scoreP1');
        const score_P2 = document.getElementById('scoreP2');

        if (score_P1) {
            score_P1.textContent = `Joueur 1 : ${leftScore}`;
        }
        if (score_P2) {
            score_P2.textContent = `Joueur 2 : ${rightScore}`;
        }
    }

    // =============== NETTOYAGE ===============
    
    disconnect(): void {
        console.log("🔌 Disconnecting from server...");
        
        // Arrêter l'animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = 0;
        }
        
        // Fermer la connexion WebSocket
        if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN) {
                console.log("📤 Sending disconnect message to server...");
                this.ws.send(JSON.stringify({ type: 'disconnect' }));
            }
            this.ws.close(1000, 'Client disconnecting');
            this.ws = null;
        }
        
        // Réinitialiser les états
        this.gameId = null;
        this.gameState = null;
        this.isConnecting = false;
        
        // Supprimer les event listeners
        document.removeEventListener("keydown", this.handle_keydown);
        document.removeEventListener("keyup", this.handle_keyup);
        
        console.log("✅ Client disconnected successfully");
    }

    // =============== MÉTHODES PUBLIQUES POUR COMPATIBILITÉ ===============
    
    restart(): void {
        // Dans la version server-side, le restart se fait côté serveur
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'restartGame'
            }));
        }
    }

    pause(): void {
        // Dans la version server-side, la pause se fait côté serveur
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'pauseGame'
            }));
        }
    }

    // Getters pour compatibilité avec l'ancien code
    get isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    get currentGameId(): string | null {
        return this.gameId;
    }
    
    // Debug getter
    get debugInfo() {
        return {
            gameId: this.gameId,
            wsState: this.ws?.readyState,
            isConnected: this.isConnected
        };
    }
}

// =============== CLASSE WRAPPER POUR COMPATIBILITÉ ===============

export class ServerGame_solo {
    private client: ServerPongClient;
    private restart_btn: HTMLButtonElement | null;
    private canvas: HTMLCanvasElement; 
    private mode: 'solo' | 'versus' | 'multi';
    private isStarting: boolean = false;
    private isDisconnected: boolean = false;

    constructor(mode: 'solo' | 'versus' | 'multi') {
        this.mode = mode;
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        this.restart_btn = document.getElementById("restartBtn") as HTMLButtonElement;
        
        this.client = new ServerPongClient(this.canvas);
        
        // Ajouter l'event listener seulement si le bouton existe
        if (this.restart_btn) {
            this.restart_btn.addEventListener('click', () => this.restart());
        }
    }

    async start_game_loop(): Promise<void> {
        // Éviter les démarrages multiples
        if (this.isStarting) {
            console.log("⚠️ Game already starting, ignoring...");
            return Promise.reject(new Error('Game already starting'));
        }
        
        // Ne pas redémarrer si déjà déconnecté
        if (this.isDisconnected) {
            console.log("⚠️ Game was disconnected, ignoring start request...");
            return Promise.reject(new Error('Game was disconnected'));
        }
        
        // Éviter de démarrer si déjà connecté
        if (this.client.isConnected) {
            console.log("⚠️ Game already connected, ignoring start request...");
            return Promise.reject(new Error('Game already connected'));
        }
        
        this.isStarting = true;
        
        try {
            console.log(`🎮 Starting ${this.mode} game with server-side logic...`);
            
            // Se connecter au serveur et créer une partie
            await this.client.connectToGame(undefined, this.mode);
            
            // Démarrer le rendu
            this.client.start();
            
        } catch (error) {
            console.error("Failed to start server-side game:", error);
            alert("Impossible de se connecter au serveur de jeu. Veuillez réessayer.");
        } finally {
            this.isStarting = false;
        }
    }

    restart(): void {
        console.log("🔄 Restarting server-side game...");
        this.client.restart();
    }

    disconnect(): void {
        if (!this.isDisconnected) {
            console.log("🔌 Disconnecting ServerGame_solo...");
            this.isDisconnected = true;
            this.client.disconnect();
        }
    }
    
    // Getters pour accéder aux propriétés du client
    get currentGameId(): string | null {
        return this.client.currentGameId;
    }
    
    get isConnected(): boolean {
        return this.client.isConnected;
    }
    
    get debugInfo() {
        return this.client.debugInfo;
    }
}