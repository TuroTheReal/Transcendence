
// -------------------------- INTERFACES ------------------------------------

//import { selected_game_mode } from "./menu.js";

interface game_config
{
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

interface game_state
{
    left_score: number;
    right_score: number;
    is_paused: boolean;
    game_running: boolean;
    count_down_active: boolean;
    restart_active: boolean;
}

interface ball_interface
{
    ball_x: number;
    ball_y: number;
    ball_dir_x: number;
    ball_dir_y: number;
    angle: number;
    current_rebond: number;
}

interface paddle_interface
{
    paddles: {
        p1_y: number;
        p2_y: number;
        p3_y: number;
        p4_y: number;
    }
    marge: number;
    current_shot: number;
}


// ------------------------ FONCTIONS UTILES -----------------------


function get_random_playable_angle(): number
{
    let angle = 0;
    while (true)
    {
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

function random_number(min: number, max: number): number
{
    let num = 0;
    
    while(true)
    {
        num = Math.random();

        const to_max = (num > max);
        const to_min = (num < min);

        if(to_max || to_min)
            continue;

        return num;
    }
}

function calculate_ball_speed(ball: ball_interface): number
{
    return Math.sqrt(ball.ball_dir_x * ball.ball_dir_x + ball.ball_dir_y * ball.ball_dir_y);
}


function get_time(start_time: DOMHighResTimeStamp): number
{
  return performance.now() - start_time;
}

function random_bool(): boolean
{
    return Math.random() < 0.5;
}


// --------------------------- CLASSES -----------------------------


class Pong
{
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private start_time: DOMHighResTimeStamp;
    private config: game_config;
    private state: game_state;
    private paddle: paddle_interface;
    private ball: ball_interface;
    private keys_pressed: Record<string, boolean> = {};
    private count_down: HTMLDivElement;
    private animation_id: number;
    private countdown_interval: ReturnType<typeof setTimeout> | null = null;
    private restart_timeout: ReturnType<typeof setTimeout> | null = null;
    private goal_timeout: ReturnType<typeof setTimeout> | null = null;
    private start_timeout: ReturnType<typeof setTimeout> | null = null;
    private restart_btn: HTMLButtonElement;
    private end_message: HTMLElement | null = null;
    private accumulator: number = 0;
    private fixed_timestep: number = 16.67;
    private last_frame_time: number = 0;

    constructor(canvas : HTMLCanvasElement)
    {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.start_time = performance.now();
        this.count_down = document.getElementById("countdowndisplay") as HTMLDivElement;
        this.animation_id = 0;
        this.restart_btn = document.getElementById("restartBtn") as HTMLButtonElement;
        this.restart_btn.addEventListener('click', () => this.restart());
        this.restart_btn.style.display = 'none';
        this.end_message = document.getElementById('endMessage');
        this.last_frame_time = 0;


        this.config =
        {
            canvas_width: 800,
            canvas_height: 600,
            paddle_width: 10,
            paddle_height: 78,
            ball_real_speed: 4 * (3/2),
            ball_speed: 3.5 * (3/2),
            ball_max_speed: 4.5 * (3/2),
            paddle_speed: 5.25 * (3/2),
            score_to_win: 5,
            increase_vitesse: 250,
            time_before_new_ball: 3000
        }

        this.state =
        {
            left_score: 0,
            right_score: 0,
            is_paused: false,
            game_running: true,
            count_down_active: false,
            restart_active: false
        }

        this.ball =
        {
            ball_x: this.config.canvas_width / 2,
            ball_y: this.config.canvas_height / 2,
            ball_dir_x: 0,
            ball_dir_y: 0,
            angle: 0,
            current_rebond: 0
        }

        this.paddle =
        {
            paddles : 
            {
                p1_y:  (this.config.canvas_height - this.config.paddle_height) / 4,
                p2_y:  3 * (this.config.canvas_height - this.config.paddle_height) / 4,
                p3_y:  (this.config.canvas_height - this.config.paddle_height) / 4,
                p4_y:  3 * (this.config.canvas_height - this.config.paddle_height) / 4,
            },
            marge: 5,
            current_shot: 0
        }

        this.setup_event();
        this.init_ball_direction()
    }

    setup_event(): void
    {
        document.addEventListener("keydown", this.handle_keydown);
        document.addEventListener("keyup", this.handle_keyup);
    }

    handle_keydown = (e: KeyboardEvent) =>
    {
        if (e.code === "Space")
            this.state.is_paused = !this.state.is_paused;
        else if (e.key === "b")
            console.log("Ball_dir_x = ", this.ball.ball_dir_x, ", Ball_dir_y = ", this.ball.ball_dir_y)
        else
            this.keys_pressed[e.key] = true;
    };

    handle_keyup = (e: KeyboardEvent) =>
    {
        this.keys_pressed[e.key] = false;
    };

    start(): void
    {
        this.draw();
        //console.log("ca demarre");
        let countdown = 3;
        this.count_down.innerText = `Debut de partie dans`;
        setTimeout(() => 
        {
            this.state.count_down_active = true;

            if (!this.count_down)
            {
                console.error("Element countdown non trouve");
                return;
            }

            this.count_down.innerText = `${countdown}`;

            let count_down_interval = setInterval(() =>
            {
                countdown--;

                if (countdown > 0)
                    this.count_down.innerText = `${countdown}`;
                else
                {
                    clearInterval(count_down_interval);
                    this.count_down.innerText = "";
                    this.state.count_down_active = false;
                    this.start_time = performance.now();
                    this.last_frame_time = performance.now();
                    this.game_loop();
                }
            }, 1000);
        }, 1000);
    }

    game_loop(): void
    {
        const current_time = performance.now()
        const delta_time = current_time - this.last_frame_time;
        this.last_frame_time = current_time;

        this.accumulator += delta_time;

        while(this.accumulator >= this.fixed_timestep)
        {
            if (!this.state.is_paused)
            {
                this.update_paddle();
                this.update_ball();
                //this.draw();
            }
            this.accumulator -= this.fixed_timestep;
        }

        if (!this.state.is_paused)
            this.draw();

        if (this.state.game_running == true)
            this.animation_id = requestAnimationFrame(() => this.game_loop()); // boucle infinie à 60 FPS
    }

    end_game(): void
    {
        let message = '';
        setTimeout(() =>
        {
            if (this.state.left_score == this.config.score_to_win)
                message = '🏆 Equipe 1 gagne la partie !';
            else
                message = '🏆 Equipe 2 gagne la partie !';

            if (this.end_message)
            {
                this.end_message.textContent = message;
                this.end_message.style.display = 'block';
                this.restart_btn.style.display = 'block';
            }
        }, 1000);
        this.state.game_running = false;
    }

    restart(): void
    {
        console.log("🔄 RESTART demandé");
        
        this.clear_all_timers();
        this.restart_btn.style.display = 'none';

        this.state.restart_active = true;
        if (this.end_message)
            this.end_message.style.display = 'none';
        this.state.is_paused = true;
        this.state.count_down_active = false;
        this.state.game_running = true;
        
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        
        this.update_score(0);
        this.config.ball_speed = 3.5 * (3/2);
        this.config.paddle_speed = 5.25 * (3/2);
        
        this.count_down.innerText = "Nouvelle partie...";
        
        this.restart_timeout = setTimeout(() =>
        {
            console.log("🚀 Nouvelle partie");
            
            // Repositionner tous les éléments
            this.ball.ball_x = this.config.canvas_width / 2;
            this.ball.ball_y = this.config.canvas_height / 2;
            this.paddle.paddles.p1_y = (this.config.canvas_height - this.config.paddle_height) / 4,
            this.paddle.paddles.p2_y = 3 * (this.config.canvas_height - this.config.paddle_height) / 4,
            this.paddle.paddles.p3_y = (this.config.canvas_height - this.config.paddle_height) / 4,
            this.paddle.paddles.p4_y = 3 * (this.config.canvas_height - this.config.paddle_height) / 4,
            this.draw();
            this.start_count_down_for_restart();
            this.state.restart_active = false;
        }, 1500);
    }

    // Fonction améliorée pour nettoyer TOUS les timers
    clear_all_timers(): void
    {        
        if (this.countdown_interval)
        {
            clearInterval(this.countdown_interval);
            this.countdown_interval = null;
        }
        
        if (this.restart_timeout)
        {
            clearTimeout(this.restart_timeout);
            this.restart_timeout = null;
        }
        
        if (this.goal_timeout)
        {
            clearTimeout(this.goal_timeout);
            this.goal_timeout = null;
        }
        
        if (this.start_timeout)
        {
            clearTimeout(this.start_timeout);
            this.start_timeout = null;
        }
        
        // Annule aussi l'animation frame si nécessaire
        if (this.animation_id)
        {
            cancelAnimationFrame(this.animation_id);
            this.animation_id = 0;
        }
    }

    start_count_down_for_restart(): void
    {
        let countdown = 3;
        this.count_down.innerText = `Reprise dans : ${countdown}`;
        this.state.count_down_active = true;
        
        this.countdown_interval = setInterval(() => {
            countdown--;
            
            if (this.state.restart_active)
            {
                return;
            }
            
            if (countdown > 0)
            {
                this.count_down.innerText = `Reprise dans : ${countdown}`;
                console.log(`⏰ Countdown : ${countdown}`);
            }
            else
            {
                
                clearInterval(this.countdown_interval!);
                this.countdown_interval = null;
                this.count_down.innerText = "";
                this.state.count_down_active = false;
                
                this.init_ball_direction();
                this.start_time = performance.now();
                this.state.is_paused = false;
                
                if (this.state.game_running)
                {
                    this.last_frame_time = performance.now();
                    this.game_loop();
                }
            }
        }, 1000);
    }


    update_paddle(): void
    {
        if (this.state.count_down_active)
            return ;

        // p1 move
        if (this.keys_pressed["w"] && this.paddle.paddles.p1_y > 0)
            this.paddle.paddles.p1_y  -= this.config.paddle_speed;
        if (this.keys_pressed["s"] && this.paddle.paddles.p1_y  <= (this.config.canvas_height / 2) - this.config.paddle_height)
            this.paddle.paddles.p1_y  += this.config.paddle_speed;

        // p2 move
        if (this.keys_pressed["j"] && this.paddle.paddles.p2_y > (this.config.canvas_height / 2))
            this.paddle.paddles.p2_y  -= this.config.paddle_speed;
        if (this.keys_pressed["m"] && this.paddle.paddles.p2_y  < this.config.canvas_height - this.config.paddle_height)
            this.paddle.paddles.p2_y  += this.config.paddle_speed;

        // p3 move
        if (this.keys_pressed["9"] && this.paddle.paddles.p3_y > 0)
            this.paddle.paddles.p3_y -= this.config.paddle_speed;
        if (this.keys_pressed["6"] && this.paddle.paddles.p3_y <= (this.config.canvas_height / 2) - this.config.paddle_height)
            this.paddle.paddles.p3_y += this.config.paddle_speed;

        // p4 move
        if (this.keys_pressed["ArrowUp"] && this.paddle.paddles.p4_y > this.config.canvas_height / 2)
            this.paddle.paddles.p4_y -= this.config.paddle_speed;
        if (this.keys_pressed["ArrowDown"] && this.paddle.paddles.p4_y < this.config.canvas_height - this.config.paddle_height)
            this.paddle.paddles.p4_y += this.config.paddle_speed;
    }

    // Fonction utilitaire pour la détection continue de collision
    // Cette fonction vérifie si un segment de droite (trajectoire de la balle) 
    // intersecte avec un rectangle (paddle)
    private checkLineRectCollision(
        lineStart: { x: number; y: number },
        lineEnd: { x: number; y: number },
        rect: { x: number; y: number; width: number; height: number }
    ): { collision: boolean; intersectionPoint?: { x: number; y: number } } {
        
        // Vérifier d'abord si le point de fin est déjà dans le rectangle
        // (cas où la balle est déjà en collision)
        if (lineEnd.x >= rect.x && lineEnd.x <= rect.x + rect.width &&
            lineEnd.y >= rect.y && lineEnd.y <= rect.y + rect.height) {
            return { collision: true, intersectionPoint: lineEnd };
        }
        
        // Calculer les 4 côtés du rectangle
        const rectLines = [
            // Côté gauche
            { start: { x: rect.x, y: rect.y }, end: { x: rect.x, y: rect.y + rect.height } },
            // Côté droit  
            { start: { x: rect.x + rect.width, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y + rect.height } },
            // Côté haut
            { start: { x: rect.x, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y } },
            // Côté bas
            { start: { x: rect.x, y: rect.y + rect.height }, end: { x: rect.x + rect.width, y: rect.y + rect.height } }
        ];
        
        // Vérifier l'intersection avec chaque côté du rectangle
        for (const rectLine of rectLines) {
            const intersection = this.getLineIntersection(lineStart, lineEnd, rectLine.start, rectLine.end);
            if (intersection) {
                return { collision: true, intersectionPoint: intersection };
            }
        }
        
        return { collision: false };
    }

    // Fonction pour calculer l'intersection entre deux segments de droite
    private getLineIntersection(
        p1: { x: number; y: number }, p2: { x: number; y: number },
        p3: { x: number; y: number }, p4: { x: number; y: number }
    ): { x: number; y: number } | null {
        
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const x4 = p4.x, y4 = p4.y;
        
        // Calculer les dénominateurs pour éviter la division par zéro
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 1e-10) return null; // Lignes parallèles
        
        // Calculer les paramètres t et u
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        // Vérifier si l'intersection est dans les deux segments
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

        // Sauvegarder la position précédente pour la détection continue
        // C'est crucial car nous devons analyser le "chemin" parcouru par la balle
        const previousX = this.ball.ball_x;
        const previousY = this.ball.ball_y;

        // Calculer la nouvelle position théorique
        const newX = this.ball.ball_x + this.ball.ball_dir_x;
        const newY = this.ball.ball_y + this.ball.ball_dir_y;

        // Gestion de l'augmentation de vitesse au cours du temps
        if (performance.now() - this.start_time >= this.config.increase_vitesse && this.config.ball_speed < this.config.ball_max_speed) {
            this.config.ball_speed += 0.1;
            this.config.paddle_speed += 0.05;
            this.start_time = performance.now();
        }

        // Vérifier les collisions avec les paddles de GAUCHE
        // On vérifie seulement si la balle se dirige vers la gauche (optimisation)
        if (this.ball.ball_dir_x < 0) {
            // Créer les rectangles pour les deux paddles de gauche (P1 et P2)
            const leftPaddles = [
                {
                    id: 1,
                    rect: {
                        x: 25,
                        y: this.paddle.paddles.p1_y - this.paddle.marge,
                        width: 15, // De x=25 à x=40
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

            // Vérifier la collision avec chaque paddle de gauche
            for (const paddle of leftPaddles) {
                const collision = this.checkLineRectCollision(
                    { x: previousX, y: previousY },
                    { x: newX, y: newY },
                    paddle.rect
                );
                
                if (collision.collision) {
                    console.log(`🏓 Rebond raquette P${paddle.id} détecté par collision continue`);
                    
                    // Positionner la balle au point d'intersection exact
                    // Cela évite que la balle reste "coincée" dans le paddle
                    if (collision.intersectionPoint) {
                        this.ball.ball_x = collision.intersectionPoint.x;
                        this.ball.ball_y = collision.intersectionPoint.y;
                    }
                    
                    // Appliquer la logique de rebond spécifique au paddle touché
                    if (paddle.id === 1) {
                        if (this.config.ball_speed < this.config.ball_real_speed) {
                            this.config.ball_speed = this.config.ball_real_speed;
                        }
                        this.update_ball_dir(1);
                    } else {
                        this.update_ball_dir(2);
                    }
                    
                    this.normalize_ball_speed();
                    return; // Sortir immédiatement pour éviter d'autres collisions cette frame
                }
            }
        }

        // Vérifier les collisions avec les paddles de DROITE
        // On vérifie seulement si la balle se dirige vers la droite
        if (this.ball.ball_dir_x > 0) {
            // Créer les rectangles pour les deux paddles de droite (P3 et P4)
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

            // Vérifier la collision avec chaque paddle de droite
            for (const paddle of rightPaddles) {
                const collision = this.checkLineRectCollision(
                    { x: previousX, y: previousY },
                    { x: newX, y: newY },
                    paddle.rect
                );
                
                if (collision.collision) {
                    console.log(`🏓 Rebond raquette P${paddle.id} détecté par collision continue`);
                    
                    // Positionner la balle au point d'intersection exact
                    if (collision.intersectionPoint) {
                        this.ball.ball_x = collision.intersectionPoint.x;
                        this.ball.ball_y = collision.intersectionPoint.y;
                    }
                    
                    // Appliquer la logique de rebond spécifique au paddle touché
                    this.update_ball_dir(paddle.id);
                    this.normalize_ball_speed();
                    return; 
                }
            }
        }

        // Si aucune collision avec les paddles n'a été détectée, 
        // mettre à jour la position de la balle normalement
        this.ball.ball_x = newX;
        this.ball.ball_y = newY;

        // Vérifier les buts (logique inchangée)
        if (this.ball.ball_x < 0 || this.ball.ball_x > this.config.canvas_width) {
            this.state.is_paused = true;
            // console.log(`🎯 BUT ! ball_x = ${this.ball.ball_x} et ballspeed = ${this.config.ball_speed}`);
            this.handle_goal();
            return;
        }

        // Cette partie gère les collisions avec les bordures horizontales
        if (this.ball.ball_y <= 5 || this.ball.ball_y >= this.config.canvas_height - 5) {
            // Ajustement de position pour éviter que la balle reste coincée dans les murs
            if (this.ball.ball_x <= 50) {
                this.ball.ball_y = this.ball.ball_y <= 5 ? 6 : this.config.canvas_height - 6;
            }
            if (this.ball.ball_x >= this.config.canvas_width - 50) {
                this.ball.ball_y = this.ball.ball_y <= 5 ? 6 : this.config.canvas_width - 6;
            }
            
            // Inverser la direction verticale et compter le rebond
            this.ball.ball_dir_y *= -1;
            this.ball.current_rebond++;
            this.normalize_ball_speed();
        }
    }

    handle_goal(): void
    {
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        this.update_score(1);
        if (this.state.left_score == this.config.score_to_win || this.state.right_score == this.config.score_to_win)
        {
            this.end_game();
            return ;
        }
        this.config.ball_speed = 3.5 * (3/2);
        this.config.paddle_speed = 5.25 * (3/2);

        setTimeout(() =>
        {
            this.ball.ball_x = this.config.canvas_width / 2;
            this.ball.ball_y = this.config.canvas_height / 2;
            this.paddle.paddles.p1_y = (this.config.canvas_height - this.config.paddle_height) / 4,
            this.paddle.paddles.p2_y = 3 * (this.config.canvas_height - this.config.paddle_height) / 4,
            this.paddle.paddles.p3_y = (this.config.canvas_height - this.config.paddle_height) / 4,
            this.paddle.paddles.p4_y = 3 * (this.config.canvas_height - this.config.paddle_height) / 4,
            this.draw();
            this.start_count_down();
        }, 1500);

        return;
    }

    update_ball_dir(paddle: number): void
    {
        let paddle_y = 0;

        if (paddle == 1)
            paddle_y = this.paddle.paddles.p1_y;
        else if (paddle == 2)
            paddle_y = this.paddle.paddles.p2_y;
        else if (paddle == 3)
            paddle_y = this.paddle.paddles.p3_y;
        else
            paddle_y = this.paddle.paddles.p4_y;

        
        let relative_impact = (this.ball.ball_y - paddle_y) / this.config.paddle_height;
        let max_bounce_angle = Math.PI / 4;

        // Convertit l'impact en angle [-max, +max]
        let bounce_angle = (relative_impact - 0.5) * 2 * max_bounce_angle;

        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(bounce_angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(bounce_angle);

        if (paddle > 2) this.ball.ball_dir_x = -this.ball.ball_dir_x;
    }

    update_score(flag: number): void
    {
        const score_P1 = document.getElementById('scoreP1');
        const score_P2 = document.getElementById('scoreP2');

        if (this.ball.ball_x < 45)
            this.state.right_score++;
        else
            this.state.left_score++;

        if (flag == 0)
        {
            this.state.right_score = 0;
            this.state.left_score = 0;
        }

        if (score_P1)
            score_P1.textContent = `Equipe 1 : ${this.state.left_score}`;
        if (score_P2)
            score_P2.textContent = `Equipe 2 : ${this.state.right_score}`;
    }

    // Fonction start_count_down corrigée (après un but)
    start_count_down(): void
    {
        //console.log("⏰ Démarrage du countdown après but");
        
        let countdown = 3;
        
        // Vérifier qu'on n'est pas en train de redémarrer
        if (this.state.restart_active)
        {
            //console.log("⚠️ Countdown annulé car restart actif");
            return;
        }
        
        this.goal_timeout = setTimeout(() =>
        {
            // Double vérification
            if (this.state.restart_active)
            {
                //console.log("⚠️ Timeout de but annulé car restart actif");
                return;
            }
            
            this.state.count_down_active = true;
            this.count_down.innerText = `Reprise dans : ${countdown}`;
            
            // Utiliser this.countdown_interval
            this.countdown_interval = setInterval(() => {
                countdown--;
                
                if (this.state.restart_active)
                {
                    //console.log("⚠️ Countdown de but interrompu par restart");
                    return;
                }
                
                if (countdown > 0) {
                    this.count_down.innerText = `Reprise dans : ${countdown}`;
                } else {
                    clearInterval(this.countdown_interval!);
                    this.countdown_interval = null;
                    this.count_down.innerText = "";
                    this.state.count_down_active = false;
                    this.init_ball_direction();
                    this.start_time = performance.now();
                    this.state.is_paused = false;
                }
            }, 1000);
        }, 1000);
    }

    init_ball_direction(): void
    {
        this.ball.angle = get_random_playable_angle();
        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(this.ball.angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(this.ball.angle);
    }


    normalize_ball_speed(): void
    {
        const current_speed = Math.sqrt(this.ball.ball_dir_x * this.ball.ball_dir_x + this.ball.ball_dir_y * this.ball.ball_dir_y);
        
        if (current_speed !== 0)
        {
            this.ball.ball_dir_x = (this.ball.ball_dir_x / current_speed) * this.config.ball_speed;
            this.ball.ball_dir_y = (this.ball.ball_dir_y / current_speed) * this.config.ball_speed;
        }
    }

    draw(): void {
        if (!this.ctx) return;

        // === 1. FOND NOIR AVEC DÉGRADÉ ===
        let bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.config.canvas_height);
        bgGradient.addColorStop(0, "#0f0f0f");
        bgGradient.addColorStop(1, "#1a1a1a");
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.config.canvas_width, this.config.canvas_height);

        // === 4. LIGNES DU MILIEU EN POINTILLÉS (optionnel mais rétro) ===
        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([10, 15]);
        this.ctx.strokeStyle = "#444";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.canvas_width / 2, 0);
        this.ctx.lineTo(this.config.canvas_width / 2, this.config.canvas_height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // === 2. RAQUETTES STYLE NÉON ===
        // Effet glow : couleur + ombre
        // raquettes de gauche
        this.ctx.shadowColor = "#00ffff";
        this.ctx.shadowBlur = 20;

        let paddleGradient_p1 = this.ctx.createLinearGradient(0, this.paddle.paddles.p1_y, 0, this.paddle.paddles.p1_y + this.config.paddle_height);
        paddleGradient_p1.addColorStop(0, "#00ffff");
        paddleGradient_p1.addColorStop(1, "#005f5f");
        this.ctx.fillStyle = paddleGradient_p1;
        this.ctx.fillRect(30, this.paddle.paddles.p1_y, this.config.paddle_width, this.config.paddle_height);

        let paddleGradient_p2 = this.ctx.createLinearGradient(0, this.paddle.paddles.p2_y, 0, this.paddle.paddles.p2_y + this.config.paddle_height);
        paddleGradient_p2.addColorStop(0, "#00ffff");
        paddleGradient_p2.addColorStop(1, "#005f5f");
        this.ctx.fillStyle = paddleGradient_p2;
        this.ctx.fillRect(30, this.paddle.paddles.p2_y, this.config.paddle_width, this.config.paddle_height);


        // raquette de droites
        this.ctx.shadowColor = "#ff00ff";
        this.ctx.shadowBlur = 20;

        let paddleGradient_p3 = this.ctx.createLinearGradient(0, this.paddle.paddles.p3_y, 0, this.paddle.paddles.p3_y + this.config.paddle_height);
        paddleGradient_p3.addColorStop(0, "#ff00ff");
        paddleGradient_p3.addColorStop(1, "#5f005f");
        this.ctx.fillStyle = paddleGradient_p3;
        this.ctx.fillRect(this.config.canvas_width - 30 - this.config.paddle_width, this.paddle.paddles.p3_y, this.config.paddle_width, this.config.paddle_height);
        
        this.ctx.shadowColor = "#ff00ff";
        this.ctx.shadowBlur = 20;
        
        let paddleGradient_p4 = this.ctx.createLinearGradient(0, this.paddle.paddles.p4_y, 0, this.paddle.paddles.p4_y+ this.config.paddle_height);
        paddleGradient_p4.addColorStop(0, "#ff00ff");
        paddleGradient_p4.addColorStop(1, "#5f005f");
        this.ctx.fillStyle = paddleGradient_p4;
        this.ctx.fillRect(this.config.canvas_width - 30 - this.config.paddle_width, this.paddle.paddles.p4_y, this.config.paddle_width, this.config.paddle_height);

        // === 3. BALLE PULSANTE ET CLIGNOTANTE ===
        const pulse = 10 + Math.sin(Date.now() / 100) * 2;
        const blink = Math.floor(Date.now() / 200) % 2 === 0;
        this.ctx.shadowColor = blink ? "#ffff00" : "#ff00ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillStyle = blink ? "#ffff00" : "#ff00ff";
        this.ctx.beginPath();
        this.ctx.arc(this.ball.ball_x, this.ball.ball_y, pulse, 0, Math.PI * 2);
        this.ctx.fill();

        // === 5. HUD (score, vitesse) AVEC POLICE PIXEL ===
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = "#00ffcc";
        this.ctx.font = "bold 18px 'Courier New', monospace";
        const currentSpeed = calculate_ball_speed(this.ball);
        this.ctx.fillText(`🎯 Vitesse: ${currentSpeed.toFixed(2)}`, 20, 30);

        this.ctx.fillStyle = "#ff66cc";
        this.ctx.font = "14px 'Courier New', monospace";
        this.ctx.fillText(`⏱️ Temps: ${get_time(this.start_time).toFixed(0)} ms`, 20, 55);
    }
}

 
class GamePong
{
    static create_game(canvas : HTMLCanvasElement): Pong
    {
        return new Pong(canvas);
    }
}


export class Game_ligne
{
    private current_game: Pong | null = null;
    //private restart_btn: HTMLButtonElement;
    private canvas: HTMLCanvasElement; 
    
    constructor()
    {
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        //this.restart_btn = document.getElementById("restartBtn") as HTMLButtonElement;
        //this.restart_btn.addEventListener('click', () => this.restart());
        this.current_game = GamePong.create_game(this.canvas);
    }

    start_game_loop(): void
    {
        if (this.current_game)
            this.current_game.start();
    }

    restart()
    {
        if (this.current_game)
        {
            this.current_game.restart();
        }
    }
}
