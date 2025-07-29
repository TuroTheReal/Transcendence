// -------------------------- INTERFACES ------------------------------------

interface game_config {
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
}

interface game_state {
    left_score: number;
    right_score: number;
    is_paused: boolean;
    game_running: boolean;
    game_mode: 'solo' | 'versus' | 'multi';
    count_down_active: boolean;
    ia_mode: boolean;
    restart_active: boolean;
}

interface ball_interface {
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
}

interface paddle_interface {
    // Pour mode solo/versus (2 raquettes)
    left_paddle_y?: number;
    right_paddle_y?: number;
    // Pour mode multi (4 raquettes)
    paddles?: {
        p1_y: number;
        p2_y: number;
        p3_y: number;
        p4_y: number;
    }
    marge: number;
    current_shot: number;
}

interface ia_interface {
    depart: number;
    move_1: number;
    move_2: number;
    counter: number;
    rebond: number;
    random_move_1: boolean;
    random_move_2: boolean;
    move_flag: boolean;
    continue_flag: boolean;
    distance_with_marge: number;
    super_flag: boolean;
    random_paddle_move: boolean;
    ia_debug: boolean;
    ia_debug_2: boolean;
    close_rebond: boolean;
    far_rebond: boolean;
    far_far_rebond: boolean;
    service: boolean;
    delta_paddle: number;
    delta_error: number;
    error_percent: number;
}

interface PlayerInput {
    playerId: string;
    keys: Record<string, boolean>;
}

export interface GameStateMessage {
    type: 'gameState';
    ball: ball_interface;
    paddle: paddle_interface;
    state: game_state;
    config: game_config;
    timestamp: number;
}

// ------------------------ FONCTIONS UTILES -----------------------

function get_random_playable_angle(): number {
    let angle = 0;
    while (true) {
        angle = Math.random() * 2 * Math.PI;

        const is_too_vertical = (
        (angle >= 1 && angle <= 2.1) ||   // proche de π/2
        (angle >= 4.4 && angle <= 5.1)      // proche de 3π/2
        );

        const is_too_horizontal = (
        (angle >= 0 && angle <= 0.4) ||                   // proche de 0
        (angle >= 2 * Math.PI - 0.4 && angle <= 2 * Math.PI) ||  // proche de 2π
        (angle >= Math.PI - 0.4 && angle <= Math.PI + 0.4)       // proche de π
        );

        if (is_too_vertical || is_too_horizontal) 
            continue;
    
        return angle;
    }
}

function random_number(min: number, max: number): number {
    let num = 0;
    
    while(true) {
        num = Math.random();

        const to_max = (num > max);
        const to_min = (num < min);

        if(to_max || to_min)
            continue;

        return num;
    }
}

function calculate_ball_speed(ball: ball_interface): number {
    return Math.sqrt(ball.ball_dir_x * ball.ball_dir_x + ball.ball_dir_y * ball.ball_dir_y);
}

function random_bool(): boolean {
    return Math.random() < 0.5;
}

// --------------------------- CLASSES -----------------------------

export class ServerPong {
    private start_time: number;
    private config: game_config;
    private state: game_state;
    private paddle: paddle_interface;
    private ball: ball_interface;
    private keys_pressed: Record<string, boolean> = {};
    private ia: ia_interface;
    private accumulator: number = 0;
    private fixed_timestep: number = 16.67;
    private last_frame_time: number = 0;
    private gameId: string;
    private gameMode: 'solo' | 'versus' | 'multi';
    private players: Map<string, PlayerInput> = new Map();

    // Callbacks pour communication avec le serveur
    private onStateUpdate?: (state: GameStateMessage) => void;
    private onGameEnd?: (winner: 'left' | 'right') => void;

    constructor(gameId: string, mode: 'solo' | 'versus' | 'multi') {
        this.gameId = gameId;
        this.gameMode = mode;
        this.start_time = Date.now();
        
        this.config = {
            canvas_width: 800,
            canvas_height: 600,
            paddle_width: 10,
            paddle_height: 100,
            ball_real_speed: 8 * (3/2),
            ball_speed: 4.5 * (3/2),
            ball_max_speed: 12 * (3/2),
            paddle_speed: 8.5 * (3/2),
            score_to_win: 5,
            increase_vitesse: 175,
            time_before_new_ball: 3000
        };

        this.state = {
            left_score: 0,
            right_score: 0,
            is_paused: false,
            game_running: true,
            game_mode: mode,
            count_down_active: false,
            ia_mode: mode === 'solo',
            restart_active: false
        };

        this.ball = {
            ball_x: this.config.canvas_width / 2,
            ball_y: this.config.canvas_height / 2,
            ball_dir_x: 0,
            ball_dir_y: 0,
            angle: 0,
            ia_x: 0,
            ia_y: 0,
            time_ia_in_frame: 0,
            distance_ia: 0,
            current_rebond: 0
        };

        // Initialiser les paddles selon le mode
        if (mode === 'multi') {
            // Mode 4 raquettes (2v2)
            this.paddle = {
                paddles: {
                    p1_y: (this.config.canvas_height - this.config.paddle_height) / 4,
                    p2_y: 3 * (this.config.canvas_height - this.config.paddle_height) / 4,
                    p3_y: (this.config.canvas_height - this.config.paddle_height) / 4,
                    p4_y: 3 * (this.config.canvas_height - this.config.paddle_height) / 4,
                },
                marge: 5,
                current_shot: 0
            };
        } else {
            // Mode 2 raquettes (solo/versus)
            this.paddle = {
                left_paddle_y: (this.config.canvas_height - this.config.paddle_height) / 2,
                right_paddle_y: (this.config.canvas_height - this.config.paddle_height) / 2,
                marge: 5,
                current_shot: 0
            };
        }

        this.ia = {
            depart: 0,
            move_1: 0,
            move_2: 0,
            counter: 0,
            rebond: 0,
            random_move_1: false,
            random_move_2: false,
            move_flag: false,
            continue_flag: true,
            distance_with_marge: 0,
            super_flag: true,
            random_paddle_move: false,
            ia_debug: true,
            ia_debug_2: true,
            close_rebond: false,
            far_rebond: false,
            far_far_rebond: false,
            service: true,
            delta_paddle: 0,
            delta_error: 0,
            error_percent: 0.2
        };

        this.init_ball_direction();
    }

    // Méthodes publiques pour l'API
    setCallbacks(
        onStateUpdate: (state: GameStateMessage) => void,
        onGameEnd: (winner: 'left' | 'right') => void
    ) {
        this.onStateUpdate = onStateUpdate;
        this.onGameEnd = onGameEnd;
    }

    handlePlayerInput(playerId: string, keys: Record<string, boolean>) {
        this.players.set(playerId, { playerId, keys });
        
        // Merger les inputs de tous les joueurs
        this.keys_pressed = {};
        for (const [_, input] of this.players) {
            Object.assign(this.keys_pressed, input.keys);
        }
    }

    getGameState(): GameStateMessage {
        return {
            type: 'gameState',
            ball: { ...this.ball },
            paddle: { ...this.paddle },
            state: { ...this.state },
            config: { ...this.config },
            timestamp: Date.now()
        };
    }

    start(): void {
        console.log("🎮 Server Pong game starting...");
        
        // Countdown de 3 secondes
        setTimeout(() => {
            this.state.count_down_active = true;
            let countdown = 3;
            
            const countdownInterval = setInterval(() => {
                countdown--;
                
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    this.state.count_down_active = false;
                    this.start_time = Date.now();
                    this.last_frame_time = Date.now();
                    this.game_loop();
                }
            }, 1000);
        }, 1000);
    }

    game_loop(): void {
        if (!this.state.game_running) return;

        const current_time = Date.now();
        const delta_time = current_time - this.last_frame_time;
        this.last_frame_time = current_time;

        this.accumulator += delta_time;

        while(this.accumulator >= this.fixed_timestep) {
            if (!this.state.is_paused) {
                // IA simple pour le mode solo seulement
                if (this.state.game_mode === "solo" && this.state.ia_mode) {
                    this.simple_ai();
                }
                
                this.update_paddle();
                this.update_ball();
            }
            this.accumulator -= this.fixed_timestep;
        }

        // Envoyer l'état au client
        if (this.onStateUpdate) {
            this.onStateUpdate(this.getGameState());
        }

        if (this.state.game_running) {
            setTimeout(() => this.game_loop(), this.fixed_timestep);
        }
    }

    // Toutes les autres méthodes restent identiques...
    // (Je copie le reste des méthodes depuis PongGame.ts)

    update_paddle(): void {
        if (this.state.count_down_active) return;
        
        if (this.paddle.paddles) {
            // Mode multi (4 raquettes)
            // p1 move (joueur 1 haut)
            if (this.keys_pressed["w"] && this.paddle.paddles.p1_y > 0)
                this.paddle.paddles.p1_y -= this.config.paddle_speed;
            if (this.keys_pressed["s"] && this.paddle.paddles.p1_y <= (this.config.canvas_height / 2) - this.config.paddle_height)
                this.paddle.paddles.p1_y += this.config.paddle_speed;

            // p2 move (joueur 1 bas)
            if (this.keys_pressed["j"] && this.paddle.paddles.p2_y > (this.config.canvas_height / 2))
                this.paddle.paddles.p2_y -= this.config.paddle_speed;
            if (this.keys_pressed["m"] && this.paddle.paddles.p2_y < this.config.canvas_height - this.config.paddle_height)
                this.paddle.paddles.p2_y += this.config.paddle_speed;

            // p3 move (joueur 2 haut)
            if (this.keys_pressed["9"] && this.paddle.paddles.p3_y > 0)
                this.paddle.paddles.p3_y -= this.config.paddle_speed;
            if (this.keys_pressed["6"] && this.paddle.paddles.p3_y <= (this.config.canvas_height / 2) - this.config.paddle_height)
                this.paddle.paddles.p3_y += this.config.paddle_speed;

            // p4 move (joueur 2 bas)
            if (this.keys_pressed["ArrowUp"] && this.paddle.paddles.p4_y > this.config.canvas_height / 2)
                this.paddle.paddles.p4_y -= this.config.paddle_speed;
            if (this.keys_pressed["ArrowDown"] && this.paddle.paddles.p4_y < this.config.canvas_height - this.config.paddle_height)
                this.paddle.paddles.p4_y += this.config.paddle_speed;
        } else {
            // Mode solo/versus (2 raquettes)
            if (this.keys_pressed["w"] && this.paddle.left_paddle_y! > 0)
                this.paddle.left_paddle_y! -= this.config.paddle_speed;
            if (this.keys_pressed["s"] && this.paddle.left_paddle_y! < this.config.canvas_height - this.config.paddle_height)
                this.paddle.left_paddle_y! += this.config.paddle_speed;

            if (this.keys_pressed["ArrowUp"] && this.paddle.right_paddle_y! > 0)
                this.paddle.right_paddle_y! -= this.config.paddle_speed;
            if (this.keys_pressed["ArrowDown"] && this.paddle.right_paddle_y! < this.config.canvas_height - this.config.paddle_height)
                this.paddle.right_paddle_y! += this.config.paddle_speed;
        }
    }

    private checkLineRectCollision(
        lineStart: { x: number; y: number },
        lineEnd: { x: number; y: number },
        rect: { x: number; y: number; width: number; height: number }
    ): { collision: boolean; intersectionPoint?: { x: number; y: number } } {
        
        if (lineEnd.x >= rect.x && lineEnd.x <= rect.x + rect.width &&
            lineEnd.y >= rect.y && lineEnd.y <= rect.y + rect.height) {
            return { collision: true, intersectionPoint: lineEnd };
        }
        
        const rectLines = [
            { start: { x: rect.x, y: rect.y }, end: { x: rect.x, y: rect.y + rect.height } },
            { start: { x: rect.x + rect.width, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y + rect.height } },
            { start: { x: rect.x, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y } },
            { start: { x: rect.x, y: rect.y + rect.height }, end: { x: rect.x + rect.width, y: rect.y + rect.height } }
        ];
        
        for (const rectLine of rectLines) {
            const intersection = this.getLineIntersection(lineStart, lineEnd, rectLine.start, rectLine.end);
            if (intersection) {
                return { collision: true, intersectionPoint: intersection };
            }
        }
        
        return { collision: false };
    }

    private getLineIntersection(
        p1: { x: number; y: number }, p2: { x: number; y: number },
        p3: { x: number; y: number }, p4: { x: number; y: number }
    ): { x: number; y: number } | null {
        
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;
        
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 1e-10) return null;
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };
        }
        
        return null;
    }

    update_ball(): void {
        if (this.state.is_paused || this.state.count_down_active) return;

        const previousX = this.ball.ball_x;
        const previousY = this.ball.ball_y;
        const newX = this.ball.ball_x + this.ball.ball_dir_x;
        const newY = this.ball.ball_y + this.ball.ball_dir_y;

        if (Date.now() - this.start_time >= this.config.increase_vitesse && this.config.ball_speed < this.config.ball_max_speed) {
            this.config.ball_speed += 0.1;
            this.config.paddle_speed += 0.05;
            this.start_time = Date.now();
        }

        if (this.gameMode === 'multi' && this.paddle.paddles) {
            // Mode multi (4 raquettes)
            
            // Collision avec les paddles gauches
            if (this.ball.ball_dir_x < 0) {
                const leftPaddles = [
                    {
                        id: 1,
                        rect: {
                            x: 25,
                            y: this.paddle.paddles.p1_y - this.paddle.marge,
                            width: 15,
                            height: this.config.paddle_height + (this.paddle.marge * 2)
                        }
                    },
                    {
                        id: 2,
                        rect: {
                            x: 25,
                            y: this.paddle.paddles.p2_y - this.paddle.marge,
                            width: 15,
                            height: this.config.paddle_height + (this.paddle.marge * 2)
                        }
                    }
                ];

                for (const paddle of leftPaddles) {
                    const collision = this.checkLineRectCollision(
                        { x: previousX, y: previousY },
                        { x: newX, y: newY },
                        paddle.rect
                    );
                    
                    if (collision.collision) {
                        console.log(`🏓 Rebond raquette P${paddle.id} détecté`);
                        
                        if (collision.intersectionPoint) {
                            this.ball.ball_x = collision.intersectionPoint.x;
                            this.ball.ball_y = collision.intersectionPoint.y;
                        }
                        
                        if (paddle.id === 1) {
                            if (this.config.ball_speed < this.config.ball_real_speed) {
                                this.config.ball_speed = this.config.ball_real_speed;
                            }
                            this.update_ball_dir(1);
                        } else {
                            this.update_ball_dir(2);
                        }
                        
                        this.normalize_ball_speed();
                        return;
                    }
                }
            }

            // Collision avec les paddles droites
            if (this.ball.ball_dir_x > 0) {
                const rightPaddles = [
                    {
                        id: 3,
                        rect: {
                            x: this.config.canvas_width - 40,
                            y: this.paddle.paddles.p3_y - this.paddle.marge,
                            width: 15,
                            height: this.config.paddle_height + (this.paddle.marge * 2)
                        }
                    },
                    {
                        id: 4,
                        rect: {
                            x: this.config.canvas_width - 40,
                            y: this.paddle.paddles.p4_y - this.paddle.marge,
                            width: 15,
                            height: this.config.paddle_height + (this.paddle.marge * 2)
                        }
                    }
                ];

                for (const paddle of rightPaddles) {
                    const collision = this.checkLineRectCollision(
                        { x: previousX, y: previousY },
                        { x: newX, y: newY },
                        paddle.rect
                    );
                    
                    if (collision.collision) {
                        console.log(`🏓 Rebond raquette P${paddle.id} détecté`);
                        
                        if (collision.intersectionPoint) {
                            this.ball.ball_x = collision.intersectionPoint.x;
                            this.ball.ball_y = collision.intersectionPoint.y;
                        }
                        
                        this.update_ball_dir(paddle.id);
                        this.normalize_ball_speed();
                        return;
                    }
                }
            }
        } else {
            // Mode solo/versus (2 raquettes)
            
            // Collision avec la raquette gauche
            if (this.ball.ball_dir_x < 0) {
                const leftPaddleRect = {
                    x: 25,
                    y: this.paddle.left_paddle_y! - this.paddle.marge,
                    width: 15,
                    height: this.config.paddle_height + (this.paddle.marge * 2)
                };
                
                const leftCollision = this.checkLineRectCollision(
                    { x: previousX, y: previousY },
                    { x: newX, y: newY },
                    leftPaddleRect
                );
                
                if (leftCollision.collision) {
                    console.log(`🏓 Rebond raquette gauche détecté`);
                    
                    if (leftCollision.intersectionPoint) {
                        this.ball.ball_x = leftCollision.intersectionPoint.x;
                        this.ball.ball_y = leftCollision.intersectionPoint.y;
                    }
                    
                    if (this.config.ball_speed < this.config.ball_real_speed) {
                        this.config.ball_speed = this.config.ball_real_speed;
                    }
                    this.update_ball_dir(0);
                    this.normalize_ball_speed();
                    return;
                }
            }

            // Collision avec la raquette droite
            if (this.ball.ball_dir_x > 0) {
                const rightPaddleRect = {
                    x: this.config.canvas_width - 40,
                    y: this.paddle.right_paddle_y! - this.paddle.marge,
                    width: 15,
                    height: this.config.paddle_height + (this.paddle.marge * 2)
                };
                
                const rightCollision = this.checkLineRectCollision(
                    { x: previousX, y: previousY },
                    { x: newX, y: newY },
                    rightPaddleRect
                );
                
                if (rightCollision.collision) {
                    console.log(`🏓 Rebond raquette droite détecté`);
                    
                    if (rightCollision.intersectionPoint) {
                        this.ball.ball_x = rightCollision.intersectionPoint.x;
                        this.ball.ball_y = rightCollision.intersectionPoint.y;
                    }
                    
                    if (this.config.ball_speed < this.config.ball_real_speed) {
                        this.config.ball_speed = this.config.ball_real_speed;
                    }
                    this.update_ball_dir(1);
                    this.normalize_ball_speed();
                    return;
                }
            }
        }

        this.ball.ball_x = newX;
        this.ball.ball_y = newY;

        // Vérifier les buts
        if (this.ball.ball_x < 0 || this.ball.ball_x > this.config.canvas_width) {
            this.state.is_paused = true;
            console.log(`🎯 BUT ! ball_x = ${this.ball.ball_x}`);
            this.handle_goal();
            // Reset pour le mode solo si nécessaire
            if (this.state.game_mode === "solo") {
                // Réinitialiser les variables d'IA si nécessaires
                this.state.ia_mode = true; // Garder l'IA active en mode solo
            }
            return;
        }

        // Rebonds sur les murs haut et bas
        if (this.ball.ball_y <= 5 || this.ball.ball_y >= this.config.canvas_height - 5) {
            if (this.ball.ball_x <= 50) {
                this.ball.ball_y = this.ball.ball_y <= 5 ? 6 : this.config.canvas_height - 6;
            }
            if (this.ball.ball_x >= this.config.canvas_width - 50) {
                this.ball.ball_y = this.ball.ball_y <= 5 ? 6 : this.config.canvas_height - 6;
            }
            
            this.ball.ball_dir_y *= -1;
            this.ball.current_rebond++;
            this.normalize_ball_speed();
        }
    }

    handle_goal(): void {
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        this.update_score(1);
        
        if (this.state.left_score == this.config.score_to_win || this.state.right_score == this.config.score_to_win) {
            this.end_game();
            return;
        }
        
        this.config.ball_speed = 4.5 * (3/2);
        this.config.paddle_speed = 8.5 * (3/2);

        setTimeout(() => {
            this.ball.ball_x = this.config.canvas_width / 2;
            this.ball.ball_y = this.config.canvas_height / 2;
            if (this.paddle.left_paddle_y != undefined) {
                this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            }
            if (this.paddle.right_paddle_y != undefined) {
                this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            }
            this.start_count_down();
        }, 1500);
    }

    end_game(): void {
        const winner = this.state.left_score == this.config.score_to_win ? 'left' : 'right';
        console.log(`🏆 Game ended! Winner: ${winner}`);
        
        this.state.game_running = false;
        
        if (this.onGameEnd) {
            this.onGameEnd(winner);
        }
    }

    update_ball_dir(paddle: number): void {
        let paddle_y = 0;

        if (this.gameMode === 'multi' && this.paddle.paddles) {
            // Mode multi (4 raquettes)
            if (paddle == 1)
                paddle_y = this.paddle.paddles.p1_y;
            else if (paddle == 2)
                paddle_y = this.paddle.paddles.p2_y;
            else if (paddle == 3)
                paddle_y = this.paddle.paddles.p3_y;
            else
                paddle_y = this.paddle.paddles.p4_y;
        } else {
            // Mode solo/versus (2 raquettes)
            if (paddle == 0)
                paddle_y = this.paddle.left_paddle_y!;
            else
                paddle_y = this.paddle.right_paddle_y!;
        }

        let relative_impact = (this.ball.ball_y - paddle_y) / this.config.paddle_height;
        let max_bounce_angle = Math.PI / 4;

        let bounce_angle = (relative_impact - 0.5) * 2 * max_bounce_angle;

        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(bounce_angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(bounce_angle);

        if (this.gameMode === 'multi') {
            if (paddle > 2) this.ball.ball_dir_x = -this.ball.ball_dir_x;
        } else {
            if (paddle === 1) this.ball.ball_dir_x = -this.ball.ball_dir_x;
        }
    }

    update_score(flag: number): void {
        if (this.ball.ball_x < 45)
            this.state.right_score++;
        else
            this.state.left_score++;

        if (flag == 0) {
            this.state.right_score = 0;
            this.state.left_score = 0;
        }
    }

    start_count_down(): void {
        let countdown = 3;
        this.state.count_down_active = true;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                this.state.count_down_active = false;
                this.init_ball_direction();
                this.start_time = Date.now();
                this.state.is_paused = false;
            }
        }, 1000);
    }

    init_ball_direction(): void {
        this.ball.angle = get_random_playable_angle();
        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(this.ball.angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(this.ball.angle);
    }

    normalize_ball_speed(): void {
        const current_speed = Math.sqrt(this.ball.ball_dir_x * this.ball.ball_dir_x + this.ball.ball_dir_y * this.ball.ball_dir_y);
        
        if (current_speed !== 0) {
            this.ball.ball_dir_x = (this.ball.ball_dir_x / current_speed) * this.config.ball_speed;
            this.ball.ball_dir_y = (this.ball.ball_dir_y / current_speed) * this.config.ball_speed;
        }
    }

    // Toutes les méthodes IA restent identiques (je les ajoute si nécessaire)
    ia_init() {
        this.ia.random_move_1 = random_bool();
        this.ia.random_move_2 = random_bool();
        this.ia.random_paddle_move = random_bool();
        this.ia.continue_flag = true;
        this.ia.move_flag = false;
        this.ia.super_flag = true;
        this.ia.rebond = 0;
        this.ball.distance_ia = 0;
        this.ia.ia_debug = true;
        this.ia.close_rebond = false;
        this.ia.far_rebond = false;
        this.ia.far_far_rebond = false;
        // Supprimé - pas besoin pour l'IA simple
    }

    // IA SIMPLIFIÉE - Suppression du code complexe original  
    simple_ai(): void {
        // IA simple : suit la balle avec un peu de retard
        if (this.paddle.right_paddle_y != undefined && this.state.game_mode === 'solo') {
            const ball_center = this.ball.ball_y;
            const paddle_center = this.paddle.right_paddle_y + this.config.paddle_height / 2;
            const speed = this.config.paddle_speed * 0.8; // IA un peu plus lente
            const tolerance = 15; // Zone morte pour éviter les oscillations
            
            if (ball_center > paddle_center + tolerance) {
                this.paddle.right_paddle_y = Math.min(
                    this.config.canvas_height - this.config.paddle_height,
                    this.paddle.right_paddle_y + speed
                );
            } else if (ball_center < paddle_center - tolerance) {
                this.paddle.right_paddle_y = Math.max(0, this.paddle.right_paddle_y - speed);
            }
        }
    }

    // Tout le code IA complexe original supprimé
    /*ia_detection(): void {
        let x = this.ball.ball_x;
        let y = this.ball.ball_y;
        let dir_x = this.ball.ball_dir_x;
        let dir_y = this.ball.ball_dir_y;
        let prev_x = x;
        let prev_y = y;
        
        while (x < this.config.canvas_width - 40) {
            if (y <= 0 || y >= this.config.canvas_height) {
                let distance = Math.sqrt(Math.pow(x - prev_x, 2) + Math.pow(y - prev_y, 2));
                this.ball.distance_ia += distance;
                dir_y *= -1;
                this.ia.rebond++;
                prev_x = x;
                prev_y = y;
                if (x <= this.config.canvas_width / 2)
                    this.ia.close_rebond = true;
                else if (x > this.config.canvas_width / 2)
                    this.ia.far_rebond = true;
                else if (x > (3 * this.config.canvas_width / 4))
                    this.ia.far_far_rebond = true;
            }
            x += dir_x;
            y += dir_y;
        }

        this.ball.ia_x = x;
        this.ball.ia_y = y;

        if (this.ia.rebond == 0)
           this.ball.distance_ia = Math.sqrt(Math.pow(this.ball.ball_x - x, 2) + Math.pow(this.ball.ball_y - y, 2));
        else {
            let final_distance = Math.sqrt(Math.pow(x - prev_x, 2) + Math.pow(y - prev_y, 2));
            this.ball.distance_ia += final_distance;
        }
        
        this.ball.time_ia_in_frame = this.ball.distance_ia / this.config.ball_speed;
    }

    ia_init_difficulty() {
        let random_depart = random_number(0.1, 0.2);
        this.ia.depart = random_depart * this.ball.time_ia_in_frame;

        let random_move_2 = random_number(0.1, 0.25);
        this.ia.move_2 = random_move_2 * this.ball.time_ia_in_frame;

        let random_move_1 = 1 - random_move_2 - random_depart;
        this.ia.move_1 = random_move_1 * this.ball.time_ia_in_frame;

        if (this.paddle.right_paddle_y && this.ball.ia_y >= this.paddle.right_paddle_y && this.ball.ia_y <= this.paddle.right_paddle_y + this.config.paddle_height)
            this.ia.delta_error = 0;
    }

    /*handle_paddle_move() {
        if (this.ia.rebond == 0) {
            if (this.ia.delta_error != 0)
                this.ia.random_move_1 = false;
            this.update_paddle_ia_with_time();
        }
        else if (this.ia.rebond == 1 && this.ia.close_rebond == true)
            this.update_paddle_ia_with_1_close_rebond();
        else if (this.ia.rebond == 1 && this.ia.far_rebond == true)
            this.update_paddle_ia_with_1_far_rebond();
        else if (this.ia.rebond == 2)
            this.update_paddle_ia_with_2_rebonds();
    }

    update_paddle_ia_with_time() {
        if (this.ia.depart >= this.ia.counter) 
            return;

        if (this.ia.move_1 >= this.ia.counter - this.ia.depart) {
            if (this.ia.ia_debug == true) {
                console.log("****** TIME move 1 *********");
                this.ia.ia_debug = false;
            }
            this.ia_ajustement(80, this.ia.random_move_1);
            return;
        }
        if (this.ia.super_flag == true) {
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
        }
        if (this.ia.move_2 >= (this.ia.counter - this.ia.move_1 - this.ia.depart)) {       
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** TIME move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 11)
                this.ia_ajustement(10, this.ia.random_move_2);
            else
                this.ia_ajustement(5, this.ia.random_move_2);
            return;
        }
    }

    update_paddle_ia_with_1_close_rebond() {
        if (this.ball.current_rebond < 1 && this.ia.depart >= this.ia.counter)
            return;
        if (this.ia.move_1 >= this.ia.counter) {
            if (this.ia.ia_debug == true) {
                console.log("****** 1 CLOSE move 1 *********");
                this.ia.ia_debug = false;
            }            
            this.ia_ajustement(200, this.ia.random_move_1);
            return;
        }
        if (this.ia.super_flag == true) {
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
        }
        if (this.ia.move_2 >= (this.ia.counter - this.ia.move_1 - this.ia.depart)) {
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 1 CLOSE move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 11)
                this.ia_ajustement(10, this.ia.random_move_2);
            else
                this.ia_ajustement(5, this.ia.random_move_2);
            return;
        }
    }

    update_paddle_ia_with_1_far_rebond() {
        if (this.ia.depart >= this.ia.counter)
            return;
        if (this.ball.current_rebond < 1) {
            if (this.ia.ia_debug == true) {
                console.log("****** 1 FAR move 1 *********");
                this.ia.ia_debug = false;
            }    
            this.ia_ajustement_rebond(200);
            return;
        }
        if (this.ia.super_flag == true) {
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
        }
        if (this.ball.current_rebond >= 1) {
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 1 FAR move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }            
            if (this.config.ball_speed > 11)
            this.ia_ajustement(10, false);
            else
                this.ia_ajustement(5, false);
            return;
        }
    }

    update_paddle_ia_with_2_rebonds() {
        if (this.ball.current_rebond < 1 && this.ia.depart >= this.ia.counter)
            return;
        if (this.ball.current_rebond < 2) {
            if (this.ia.ia_debug == true) {
                console.log("****** 2 REBONDS move 1 *********");
                this.ia.ia_debug = false;
            }           
            this.ia_ajustement_rebond(200);
            return;
        }
        if (this.ia.super_flag == true) {
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
        }
        if (this.ball.current_rebond >= 2) {
            if (this.ia.ia_debug == true) {
                let center_paddle = this.ia.delta_error + this.ia.delta_paddle + this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                console.log("****** 2 REBONDS move 2 *********");
                console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }      
            if (this.config.ball_speed > 11)
                this.ia_ajustement(10, false);
            else
                this.ia_ajustement(5, false);
            return;
        }
    }

    /*ia_ajustement(marge: number, random: boolean) {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        let distance = target_y - center_paddle;

        if (Math.abs(distance) <= marge && random == false) {
            console.log("FIN DE MOVE avec random = false");
            return;
        }
        
        if (Math.abs(distance) <= marge && random == true && this.ia.move_flag == true) {
            if (this.ia.continue_flag == true) {
                this.ia.distance_with_marge = center_paddle - this.ball.ia_y;
                this.ia.continue_flag = false;
            }
            this.continue_movement();  
            console.log("FIN DE MOVE continue");
            return;
        }

        if (Math.abs(distance) <= marge) {
            console.log("FIN DE MOVE");
            return;
        }

        if (distance > 0 && this.ia.continue_flag == true) {
            console.log(`ajust 1 et marge = ${marge}`);
            this.paddle.right_paddle_y += this.config.paddle_speed;
            this.ia.move_flag = true;
        }
        else if (distance < 0 && this.ia.continue_flag == true) {
            console.log(`ajust 2 et marge = ${marge}`);
            this.paddle.right_paddle_y -= this.config.paddle_speed;
            this.ia.move_flag = true;
        }

        this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
    }

    /*ia_ajustement_rebond(marge: number) {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        let distance = target_y - center_paddle;

        if (Math.abs(distance) <= marge) {
            if (this.ia.continue_flag == true) {
                this.ia.distance_with_marge = center_paddle - this.ball.ia_y;
                this.ia.continue_flag = false;
            }
            this.continue_movement_rebond();
            console.log("FIN DE MOVE continue");
            return;
        }

        if (distance > 0 && this.ia.continue_flag == true) {
            console.log(`ajust 1 et marge = ${marge}`);
            this.paddle.right_paddle_y += this.config.paddle_speed;
        }
        else if (distance < 0 && this.ia.continue_flag == true) {
            console.log(`ajust 2 et marge = ${marge}`);
            this.paddle.right_paddle_y -= this.config.paddle_speed;
        }

        this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
    }

    continue_movement() {   
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;

        if (this.ia.distance_with_marge < 0 && (this.config.canvas_height - target_y) >= (this.config.paddle_height / 2)) {
            if (center_paddle - target_y <= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y += this.config.paddle_speed;
                console.log("continue 1");
            }
            this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
            return;
        }
        else if (this.ia.distance_with_marge >= 0 && target_y >= (this.config.paddle_height / 2)) {
            if (center_paddle - target_y >= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y -= this.config.paddle_speed;
                console.log("continue 2");
            }
            this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
            return;
        }
        return;
    }

    continue_movement_rebond() {   
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;

        if (this.ia.distance_with_marge < 0) {
            if (center_paddle - target_y <= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y += this.config.paddle_speed;
                console.log("continue 1");
            }
            this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
            return;
        }
        else if (this.ia.distance_with_marge >= 0) {
            if (center_paddle - target_y >= (this.ia.distance_with_marge * -1 * 0.8)) {
                this.paddle.right_paddle_y -= this.config.paddle_speed;
                console.log("continue 2");
            }
            this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
            return;
        }
        return;
    }

    // Méthodes IA supprimées - pas nécessaires pour l'IA simple
    /*ia_delta_paddle(): number {
        let random = random_number(0, 0.38);
        let random_sign = random_bool();

        if (random_sign == true)
            random *= -1;

        return (random * 100);
    }

    handle_ia_error() {
        let random = random_number(0, 1);
        let ajust_percent_lose = 0;

        if (this.state.right_score - this.state.left_score >= 2)
            ajust_percent_lose = 0.15;

        if (this.state.right_score - this.state.left_score >= 3)
            ajust_percent_lose = 0.20;

        if (this.state.right_score - this.state.left_score >= 4)
            ajust_percent_lose = 0.30;

        if (this.paddle.current_shot < 9) {
            if (random < 0.15 + ajust_percent_lose) {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 80 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (80 + this.ia.delta_paddle) * -1;
            }
        }        
        else if (this.paddle.current_shot < 12) {
            if (random < 0.25 + ajust_percent_lose) {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 80 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (80 + this.ia.delta_paddle) * -1;
            }
        }        
        else {
            if (random < 0.35 + ajust_percent_lose) {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 80 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (80 + this.ia.delta_paddle) * -1;
            }
        }

        if (this.ia.delta_error != 0)
            console.log(`! ERROR ! avec cou = ${this.paddle.current_shot} avec delta = ${this.ia.delta_error}`);
    }*/
}