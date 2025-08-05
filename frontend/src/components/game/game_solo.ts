import { i18n } from "../../services/i18n.js";

// -------------------------- INTERFACES ------------------------------------

// import { json } from "stream/consumers";

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
    game_mode: 'solo' | 'versus' | 'tournament';
    count_down_active: boolean;
    ia_mode: boolean;
    restart_active: boolean;
}

interface ball_interface
{
    ball_x: number;
    ball_y: number;
    prev_x: number;
    prev_y: number;
    ball_dir_x: number;
    ball_dir_y: number;
    angle: number;
    ia_x: number;
    ia_y: number;
    time_ia_in_frame: number;
    distance_ia: number;
    current_rebond: number;
}

interface paddle_interface
{
    left_paddle_y: number;
    right_paddle_y: number;
    marge: number;
    time_ia_in_frame: number;
    current_shot: number;
}

interface ia_interface
{
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
    data: number;
}

interface data_score
{
    id: number;
    player1Id: number | null;
	player2Id?: number | null;
    winnerId: number | null;
    score1: number;
    score2: number;
    iaMode: boolean;
    tournamentMode: boolean;
    multiMode: boolean;
    played_at: Date;
    game_time: number;
    win_point_up: number;
    win_point_down: number;
    lose_point_up: number;
    lose_point_down: number;
}



// ------------------------ FONCTIONS UTILES -----------------------


function get_random_playable_angle(): number
{
    let angle = 0;
    while (true)
    {
        angle = Math.random() * 2 * Math.PI;

        const is_too_vertical = (
        (angle >= 1 && angle <= 2.1) ||
        (angle >= 4.4 && angle <= 5.1)
        );

        const is_too_horizontal = (
        (angle >= 0 && angle <= 0.4) ||
        (angle >= 2 * Math.PI - 0.4 && angle <= 2 * Math.PI) ||
        (angle >= Math.PI - 0.4 && angle <= Math.PI + 0.4)
        );

        if (is_too_vertical || is_too_horizontal)
            continue;

        return angle;
    }
}

function create_ID(): number
{
    return Math.floor(Math.random() * 1_000_001);
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
    private ia: ia_interface;
    private animation_id: number;
    private countdown_interval: ReturnType<typeof setTimeout> | null = null;
    private restart_timeout: ReturnType<typeof setTimeout> | null = null;
    private goal_timeout: ReturnType<typeof setTimeout> | null = null;
    private start_timeout: ReturnType<typeof setTimeout> | null = null;
    private end_message: HTMLElement | null = null;
    private accumulator: number = 0;
    private fixed_timestep: number = 16.67;
    private last_frame_time: number = 0;
    private data: data_score;
    private player_name: string | null;


    constructor(canvas : HTMLCanvasElement, mode: 'solo' | 'versus')
    {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.start_time = performance.now();
        this.count_down = document.getElementById("countdowndisplay") as HTMLDivElement;
        this.animation_id = 0;
        this.end_message = document.getElementById('endMessage');
        const token = sessionStorage.getItem("authToken");
        if (token)
        {
            const userId = sessionStorage.getItem("username");
            this.player_name =  userId;
        }
        else
        {
            if (i18n.getCurrentLanguage() == "en")
                this.player_name = "PLAYER 1";
            else if (i18n.getCurrentLanguage() == "fr")
                this.player_name = "JOUEUR 1";
            else
                this.player_name = "JUGADOR 1";
        }


        this.config =
        {
            canvas_width: 800,
            canvas_height: 600,
            paddle_width: 10,
            paddle_height: 100,
            ball_real_speed: 8 * (3/2),
            ball_speed: 4.5 * (3/2),
            ball_max_speed: 12 * (3/2),
            paddle_speed: 7.5 * (3/2),
            score_to_win: 3,
            increase_vitesse: 175, //250,
            time_before_new_ball: 3000
        }

        this.state =
        {
            left_score: 0,
            right_score: 0,
            is_paused: false,
            game_running: true,
            game_mode: mode,
            count_down_active: false,
            ia_mode: false,
            restart_active: false
        }

        this.ball =
        {
            ball_x: this.config.canvas_width / 2,
            ball_y: this.config.canvas_height / 2,
            prev_x: this.config.canvas_width / 2,
            prev_y: this.config.canvas_height / 2,
            ball_dir_x: 0,
            ball_dir_y: 0,
            angle: 0,
            ia_x: 0,
            ia_y: 0,
            time_ia_in_frame: 0,
            distance_ia: 0,
            current_rebond: 0
        }

        this.paddle =
        {
            left_paddle_y:  (this.config.canvas_height - this.config.paddle_height) / 2,
            right_paddle_y:  (this.config.canvas_height - this.config.paddle_height) / 2,
            marge: 5,
            time_ia_in_frame: 0,
            current_shot: 0
        }

        this.ia =
        {
            depart: 0,
            move_1: 0,
            move_2:0,
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
            error_percent: 0.2,
            data: 0
        }

        this.data =
        {
            id: 0,
            player1Id: null,
			player2Id: null,
			iaMode: false,
			tournamentMode: false,
			multiMode: false,
            winnerId: null,
            score1: 0,
            score2: 0,
            played_at: new Date(),
            game_time: performance.now(),
            win_point_up: 0,
            win_point_down: 0,
            lose_point_up: 0,
            lose_point_down: 0,
        }

        this.setup_event();
        this.init_ball_direction();
    }

    setup_event(): void
    {
        document.addEventListener("keydown", this.handle_keydown);
        document.addEventListener("keyup", this.handle_keyup);
    }

    // handle_keydown = (e: KeyboardEvent) =>
    // {
    //     // if (e.code === "Space")
    //     //     this.state.is_paused = !this.state.is_paused;
    //     // else if (e.key === "b")
    //     //     console.log("Ball_dir_x = ", this.ball.ball_dir_x, ", Ball_dir_y = ", this.ball.ball_dir_y)
    //     // else
    //     this.keys_pressed[e.key] = true;
    // };

    // handle_keyup = (e: KeyboardEvent) =>
    // {
    //     this.keys_pressed[e.key] = false;
    // };

    handle_keydown = (e: KeyboardEvent) =>
    {
        if (e.key === "ArrowUp" || e.key === "ArrowDown" ||
            e.key === "ArrowLeft" || e.key === "ArrowRight" ||
            e.key === "w" || e.key === "W" ||
            e.key === "s" || e.key === "S" ||
            e.code === "Space") {
            e.preventDefault();
        }

        this.keys_pressed[e.key] = true;
    };

    handle_keyup = (e: KeyboardEvent) =>
    {
        if (e.key === "ArrowUp" || e.key === "ArrowDown" ||
            e.key === "ArrowLeft" || e.key === "ArrowRight" ||
            e.key === "w" || e.key === "W" ||
            e.key === "s" || e.key === "S" ||
            e.code === "Space") {
            e.preventDefault();
        }

        this.keys_pressed[e.key] = false;
    };

    start(): void {
        // Vérifier et récupérer l'élément countdown au moment où on en a besoin
        this.ensureCountdownElement();

        if (!this.count_down) {
            //console.error("Impossible de démarrer : élément countdown introuvable");
            return;
        }

        this.draw(1);
        let countdown = 5;

        if (i18n.getCurrentLanguage() == "en")
            this.count_down.innerText = `The game will start in`;
        else if (i18n.getCurrentLanguage() == "fr")
            this.count_down.innerText = `Debut de partie dans`;
        else
            this.count_down.innerText = `El partido empieza en`;

        setTimeout(() => {
            // Vérifier à nouveau avant d'utiliser l'élément
            if (!this.count_down) {
                //console.error("Élément countdown perdu pendant le setTimeout");
                return;
            }

            this.state.count_down_active = true;
            this.count_down.innerText = `${countdown}`;

            let count_down_interval = setInterval(() => {
                countdown--;

                // Vérification à chaque itération
                if (!this.count_down) {
                    //console.error("Élément countdown perdu pendant le countdown");
                    clearInterval(count_down_interval);
                    return;
                }

                if (countdown > 0) {
                    this.count_down.innerText = `${countdown}`;
                } else {
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

    // Nouvelle méthode pour s'assurer que l'élément existe
    private ensureCountdownElement(): void {
        if (!this.count_down) {
            //console.log("Récupération de l'élément countdown...");
            this.count_down = document.getElementById("countdowndisplay") as HTMLDivElement;
        }
    }

    // start(): void
    // {
    //     this.draw(1);
    //     //console.log("ca demarre");
    //     let countdown = 3;

    //     if (i18n.getCurrentLanguage() == "en")
    //         this.count_down.innerText = `The game will start in`;
    //     else
    //         this.count_down.innerText = `Debut de partie dans`;
    //     setTimeout(() =>
    //     {
    //         this.state.count_down_active = true;

    //         if (!this.count_down)
    //         {
    //             //console.error("Element countdown non trouve");
    //             return;
    //         }

    //         this.count_down.innerText = `${countdown}`;

    //         let count_down_interval = setInterval(() =>
    //         {
    //             countdown--;

    //             if (countdown > 0)
    //                 this.count_down.innerText = `${countdown}`;
    //             else
    //             {
    //                 clearInterval(count_down_interval);
    //                 this.count_down.innerText = "";
    //                 this.state.count_down_active = false;
    //                 this.start_time = performance.now();
    //                 this.last_frame_time = performance.now();
    //                 this.game_loop();
    //             }
    //         }, 1000);
    //     }, 1000);
    // }


    game_loop(): void
    {
        const current_time = performance.now()

        // protection spirale de la mort
        const raw_delta_time = current_time - this.last_frame_time;
        let delta_time;
        if (raw_delta_time > 1000)
        {
            //console.log("Très long délai détecté, réinitialisation du timing");
            delta_time = this.fixed_timestep; // Traiter comme un frame normal
        }
        else
            delta_time = Math.min(raw_delta_time, 250); // Protection normale

        if (raw_delta_time > 250)
            console.warn(`Spirale de la mort évitée ! Temps réel: ${raw_delta_time.toFixed(2)}ms, temps traité: ${delta_time}ms`);


        this.last_frame_time = current_time;
        this.accumulator += delta_time;

        while(this.accumulator >= this.fixed_timestep)
        {
            if (!this.state.is_paused)
            {
                if (this.state.game_mode == "solo" && this.state.ia_mode == false && this.ball.ball_dir_x > 0)
                {
                    if (this.ia.service == true)
                    {
                        this.ia_detection();
                        this.ia.continue_flag = true;
                        this.ia.service = false;
                        //console.log("DETECTION servica IA");
                    }
                    //console.log("service IA");
                    this.ia_ajustement(15, false);
                }
                if (this.state.game_mode == "solo" && this.state.ia_mode == true)
                {
                    this.ia.counter++;
                    this.handle_paddle_move();
                }
                this.update_paddle();
                this.update_ball();
                //this.draw();

            }
            this.accumulator -= this.fixed_timestep;
            //frame_fois++;
        }
        //console.log(`fois frame = ${frame_fois}`)

        const interpolation = this.accumulator / this.fixed_timestep;

        if (!this.state.is_paused)
            this.draw(interpolation);


        if (this.state.game_running == true)
            this.animation_id = requestAnimationFrame(() => this.game_loop());
    }

    end_game(): void
    {
		//console.log("END GAME");
        let message = '';
        this.handle_data();
		//console.log("DATA HANDLED");
        setTimeout(() =>
        {
            const token = sessionStorage.getItem("authToken");
            if (token)
            {
                const userId = sessionStorage.getItem("username");
                if (this.state.left_score == this.config.score_to_win)
                {
                    if (i18n.getCurrentLanguage() == "en")
                        message = `🏆 ${userId} win the game !`;
                    else if (i18n.getCurrentLanguage() == "fr")
                        message = `🏆 ${userId} gagne la partie !`;
                    else
                        message = `🏆 ${userId} gana el partido !`;
                }
                else
                {
                    if (i18n.getCurrentLanguage() == "en")
                        message = `🏆 Player 2 win the game !`;
                    else if (i18n.getCurrentLanguage() == "fr")
                        message = `🏆 Joueur 2 gagne la partie !`;
                    else
                        message = `🏆 Jugador 2 gana el partido !`;
                }
            }
            else
            {
                if (this.state.left_score == this.config.score_to_win)
                {
                    if (i18n.getCurrentLanguage() == "en")
                        message = '🏆 Player 1 win the game !';
                    else if (i18n.getCurrentLanguage() == "fr")
                        message = '🏆 Joueur 1 gagne la partie !';
                    else
                        message = '🏆 Jugador 1 gana el partido !';
                }
                else
                {
                    if (i18n.getCurrentLanguage() == "en")
                        message = '🏆 Player 2 win the game !';
                    else if (i18n.getCurrentLanguage() == "fr")
                        message = '🏆 Joueur 2 gagne la partie !';
                    else
                        message = '🏆 Jugador 2 gana el partido !';
                }
            }
            if (this.end_message)
            {
                this.end_message.textContent = message;
                this.end_message.style.display = 'block';
            }
        }, 1000);
        this.state.game_running = false;
    }

    async handle_data()
    {
        const token = sessionStorage.getItem("authToken");
        if (!token)
            return;
		const currentUserStr = sessionStorage.getItem("currentUser");
		let currentUser;
		let userId: number | null = null;
		if (currentUserStr) {
			currentUser = JSON.parse(currentUserStr);
			userId = currentUser.id;
		}
		//console.log("USER ID: ", userId);
        this.data.player1Id = userId;
		//console.log("PLAYER ID: ", this.data.player1Id);

        this.data.id = create_ID();

		if (this.state.game_mode === "solo") {
			this.data.iaMode = true;
			this.data.multiMode = false;
			this.data.tournamentMode = false;
			this.data.player2Id = null;
		} else if (this.state.game_mode === "versus") {
			this.data.iaMode = false;
			this.data.multiMode = true;
			this.data.tournamentMode = false;
			this.data.player2Id = null;
		} else if (this.state.game_mode === "tournament") {
			this.data.iaMode = false;
			this.data.multiMode = false;
			this.data.tournamentMode = true;
			this.data.player2Id = null;
		}

        this.data.score1 = this.state.left_score;
        this.data.score2 = this.state.right_score;

		if (this.data.score1 > this.data.score2) {
			this.data.winnerId = this.data.player1Id;
		} else {
			this.data.winnerId = this.data.player2Id ?? null;
		}

        this.data.played_at = new Date();

        // mesure de la duree
        let t0 = this.data.game_time;
        let t1 = performance.now();
        this.data.game_time = t1 - t0;

        //console.log("DATA ENVOYE AU BACKEND !")

		//console.log("DATA : ", this.data);
        const response = await fetch("/api/game/add", {
            method: "POST",
            headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                players: this.data.iaMode ? 1 : 2,
                player1Id: this.data.player1Id,
                player2Id: this.data.player2Id,
                score1: this.data.score1,
                score2: this.data.score2,
                winnerId: this.data.winnerId,
                playedAt: this.data.played_at,
                lasted: Math.round(this.data.game_time / 1000 / 60),
                pointsUp: this.data.win_point_up,
                pointsDown: this.data.win_point_down,
                iaMode: this.data.iaMode,
                tournamentMode: this.data.tournamentMode,
                multiMode: this.data.multiMode
            }),
        });
		//console.log("RESPONSE : ", response.body);
		//console.log('Game Stats send!');
		const stats = await fetch(`/api/game/stats?username=${currentUser.username}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token}`
		},
		});
		if (stats.ok) {
			const statsdata = await stats.json();
			console.log('Stats retreived:', statsdata);
		}
        // else
        // {
		// 	console.log('Game Stats error!');
		// }
    }


    cleanup(): void
    {
        //console.log("🧹 Nettoyage des ressources du jeu...");

        this.clear_all_timers();
        this.state.game_running = false;
        this.state.is_paused = true;
        this.state.count_down_active = false;

        this.ball.ball_x = this.config.canvas_width / 2;
        this.ball.ball_y = this.config.canvas_height / 2;
        this.ball.prev_x = this.ball.ball_x;
        this.ball.prev_y = this.ball.ball_y;
        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;

        this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
        this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;

        this.update_score(0);

        if (this.count_down) {
            this.count_down.innerText = "";
        }

        if (this.end_message) {
            this.end_message.style.display = 'none';
            this.end_message.textContent = '';
        }

        this.ctx.clearRect(0, 0, this.config.canvas_width, this.config.canvas_height);
        //console.log("✅ Nettoyage terminé");
    }

    back_to_menu(): void
    {
        //console.log("🏠 Retour au menu principal...");

        this.cleanup();
        this.state.restart_active = false;
        this.state.ia_mode = false;

        this.ia.service = true;
        this.ia.continue_flag = true;
        this.ia.counter = 0;
        this.ia.rebond = 0;
        this.ia.random_move_1 = false;
        this.ia.random_move_2 = false;
        this.ia.move_flag = false;
        this.ia.super_flag = true;
        this.ia.random_paddle_move = false;

        // this.data.id = 0;
        // this.data.player1Id = "default";
        // this.data.ia_mode = false;
        // this.data.tournoi_mode = false;
        // this.data.multi_mode = false;
        // this.data.winnerId = "default";
        // this.data.score1 = 0;
        // this.data.score2 = 0;
        // this.data.played_at = new Date();
        // this.data.game_time = 0;
        // this.data.win_point_down = 0;
        // this.data.win_point_up = 0;
        // this.data.lose_point_down = 0;
        // this.data.lose_point_up = 0;

        this.config.ball_speed = 4.5 * (3/2);
        this.config.paddle_speed = 7.5 * (3/2);

        //console.log("✅ Retour au menu préparé");
    }

    destroy(): void
    {
        //console.log("💥 Destruction de l'instance de jeu...");

        this.cleanup();
        document.removeEventListener("keydown", this.handle_keydown);
        document.removeEventListener("keyup", this.handle_keyup);

        this.ctx.clearRect(0, 0, this.config.canvas_width, this.config.canvas_height);
        this.count_down = null as any;
        this.end_message = null;
        this.keys_pressed = {};
        this.state.game_running = false;

        //console.log("✅ Instance détruite");
    }

    restart(): void
    {
        //console.log("🔄 RESTART demandé");

        this.clear_all_timers();

        this.state.restart_active = true;
        if (this.end_message)
            this.end_message.style.display = 'none';
        this.state.is_paused = true;
        this.state.count_down_active = false;
        this.state.game_running = true;
        this.last_frame_time = performance.now();

        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;

        this.update_score(0);
        this.config.ball_speed = 4.5 * (3/2);
        this.config.paddle_speed = 8.5 * (3/2);

        if (i18n.getCurrentLanguage() == "en")
            this.count_down.innerText = "New game...";
        else
            this.count_down.innerText = "Nouvelle partie...";

        this.restart_timeout = setTimeout(() =>
        {
            //console.log("🚀 Nouvelle partie");

            this.last_frame_time = performance.now();
            this.ball.ball_x = this.config.canvas_width / 2;
            this.ball.ball_y = this.config.canvas_height / 2;
            this.ball.prev_x = this.ball.ball_x;
            this.ball.prev_y = this.ball.ball_y;
            this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.draw(1);
            this.start_count_down_for_restart();
            this.state.restart_active = false;

        }, 1500);
    }

    clear_all_timers(): void
    {
        if (this.countdown_interval)
        {
            clearInterval(this.countdown_interval);
            this.countdown_interval = null;
            //console.log("✅ Countdown interval nettoyé");
        }

        if (this.restart_timeout)
        {
            clearTimeout(this.restart_timeout);
            this.restart_timeout = null;
            //console.log("✅ Restart timeout nettoyé");
        }

        if (this.goal_timeout)
        {
            clearTimeout(this.goal_timeout);
            this.goal_timeout = null;
            //console.log("✅ Goal timeout nettoyé");
        }

        if (this.start_timeout)
        {
            clearTimeout(this.start_timeout);
            this.start_timeout = null;
            //console.log("✅ Start timeout nettoyé");
        }

        // Annule aussi l'animation frame si nécessaire
        if (this.animation_id)
        {
            cancelAnimationFrame(this.animation_id);
            this.animation_id = 0;
            //console.log("✅ Animation frame annulée");
        }
    }

    start_count_down_for_restart(): void
    {
        let countdown = 3;
        if (i18n.getCurrentLanguage() == "en")
            this.count_down.innerText = `Start in : ${countdown}`;
        else
            this.count_down.innerText = `Reprise dans : ${countdown}`;
        this.state.count_down_active = true;

        this.countdown_interval = setInterval(() => {
            countdown--;

            if (this.state.restart_active)
            {
                //console.log("⚠️ Restart annulé pendant le countdown");
                return;
            }

            if (countdown > 0)
            {
                if (i18n.getCurrentLanguage() == "en")
                    this.count_down.innerText = `Start in : ${countdown}`;
                else
                    this.count_down.innerText = `Reprise dans : ${countdown}`;
                //console.log(`⏰ Countdown : ${countdown}`);
            }
            else
            {
                //console.log("🎮 Fin du countdown, reprise du jeu");

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
        if ((this.keys_pressed["w"] || this.keys_pressed["W"]) && this.paddle.left_paddle_y > 0)
            this.paddle.left_paddle_y -= this.config.paddle_speed;
        if ((this.keys_pressed["s"] || this.keys_pressed["S"])  && this.paddle.left_paddle_y < this.config.canvas_height - this.config.paddle_height - 0)
            this.paddle.left_paddle_y += this.config.paddle_speed;

        if (this.state.game_mode != "solo")
        {
            if (this.keys_pressed["ArrowUp"] && this.paddle.right_paddle_y > 0)
                this.paddle.right_paddle_y -= this.config.paddle_speed;
            if (this.keys_pressed["ArrowDown"] && this.paddle.right_paddle_y < this.config.canvas_height - this.config.paddle_height - 0)
                this.paddle.right_paddle_y += this.config.paddle_speed;
        }
    }

    // detection collision
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

    // calculer intersections entre 2 segmenst
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

    update_ball(): void
    {
        if (this.state.is_paused || this.state.count_down_active)
            return;

        // garder en memoire les positions differentes pour l'interpolation
        this.ball.prev_x = this.ball.ball_x;
        this.ball.prev_y = this.ball.ball_y;

        // Sauvegarder la position précédente pour la détection continue (deja fait au dessus mais on sait jamais)
        const previousX = this.ball.ball_x;
        const previousY = this.ball.ball_y;

        // Calculer la nouvelle position
        const newX = this.ball.ball_x + this.ball.ball_dir_x;
        const newY = this.ball.ball_y + this.ball.ball_dir_y;

        if (performance.now() - this.start_time >= this.config.increase_vitesse && this.config.ball_speed < this.config.ball_max_speed)
        {
            this.config.ball_speed += 0.1;
            this.config.paddle_speed += 0.05;
            this.start_time = performance.now();
        }

        // verification collision avant de mttre a jour les coordonnes

        // Collision avec le paddle gauche
        if (this.ball.ball_dir_x < 0)
        {
            const leftPaddleRect =
            {
                x: 25,
                y: this.paddle.left_paddle_y - this.paddle.marge,
                width: 15, // De x=25 à x=40
                height: this.config.paddle_height + (this.paddle.marge * 2)
            };

            const leftCollision = this.checkLineRectCollision(
                { x: previousX, y: previousY },
                { x: newX, y: newY },
                leftPaddleRect
            );

            if (leftCollision.collision)
            {
                //console.log(`🏓 Rebond raquette gauche détecté par collision continue`);

                // Positionner la balle au point d'intersection pour éviter qu'elle reste dans le paddle
                if (leftCollision.intersectionPoint)
                {
                    this.ball.ball_x = leftCollision.intersectionPoint.x;
                    this.ball.ball_y = leftCollision.intersectionPoint.y;
                }

                // Appliquer la logique de rebond
                if (this.config.ball_speed < this.config.ball_real_speed)
                {
                    this.config.ball_speed = this.config.ball_real_speed;
                }
                this.update_ball_dir(0);
                this.normalize_ball_speed();

                if (this.state.game_mode == "solo")
                {
                    this.state.ia_mode = true;
                    this.ia_init();
                    this.ia_detection();
                    this.ia_init_difficulty();
                    this.ia.counter = 0;
                    this.ball.current_rebond = 0;
                    this.paddle.current_shot++;
                }
                return;
            }
        }

        // Collision avec le paddle droit
        if (this.ball.ball_dir_x > 0)
        {
            const rightPaddleRect =
            {
                x: this.config.canvas_width - 40,
                y: this.paddle.right_paddle_y - this.paddle.marge,
                width: 15,
                height: this.config.paddle_height + (this.paddle.marge * 2)
            };

            const rightCollision = this.checkLineRectCollision(
                { x: previousX, y: previousY },
                { x: newX, y: newY },
                rightPaddleRect
            );

            if (rightCollision.collision)
            {
                //console.log(`🏓 Rebond raquette droite détecté par collision continue`);

                // Positionner la balle au point d'intersection
                if (rightCollision.intersectionPoint)
                {
                    this.ball.ball_x = rightCollision.intersectionPoint.x;
                    this.ball.ball_y = rightCollision.intersectionPoint.y;
                }

                // Appliquer la logique de rebond
                if (this.config.ball_speed < this.config.ball_real_speed)
                {
                    this.config.ball_speed = this.config.ball_real_speed;
                }
                this.update_ball_dir(1);
                this.normalize_ball_speed();

                if (this.state.game_mode == "solo")
                {
                    this.state.ia_mode = false;
                    this.ball.current_rebond = 0;
                }
                return;
            }
        }

        // // Si aucune collision avec les paddles, mettre à jour la position normalement
        // this.ball.ball_x = newX;
        // this.ball.ball_y = newY;

        // Vérifier les buts
        if (this.ball.ball_x < 0 || this.ball.ball_x > this.config.canvas_width)
        {
            this.state.is_paused = true;
            // //console.log(`🎯 BUT ! ball_x = ${this.ball.ball_x} et ballspeed = ${this.config.ball_speed} et rebond = ${this.ball.current_rebond} et delta error = ${this.ia.delta_error} et delta_paddle = ${this.ia.delta_paddle}`);
            this.handle_goal();
            if (this.state.game_mode == "solo")
            {
                this.state.ia_mode = false;
                this.ia.service = true;
                this.paddle.current_shot = 0;
                this.ia.delta_error = 0;
                this.ia.delta_paddle = 0;
            }
            return;
        }

        // Si aucune collision avec les paddles, mettre à jour la position normalement
        this.ball.ball_x = newX;
        this.ball.ball_y = newY;

        // Rebonds sur les murs haut et bas
        if (this.ball.ball_y <= 5 || this.ball.ball_y >= this.config.canvas_height - 5)
        {
            //console.log(`AVANT rebond avec ball_x = ${this.ball.ball_x} et ball_y = ${this.ball.ball_y}`);

            if (this.ball.ball_x <= 70 )
            {
                if (this.ball.ball_y <= 5)
                    this.ball.ball_y = 6;
                else
                    this.ball.ball_y = this.config.canvas_height - 6;
                //console.log("ca passe ici zeubi")
            }
            if (this.ball.ball_x >= this.config.canvas_width - 70)
            {
                if (this.ball.ball_y <= 5)
                    this.ball.ball_y = 6;
                else
                    this.ball.ball_y = this.config.canvas_height - 6;
                //console.log("ca passe ici woula")
            }

            //console.log(`APRES rebond avec ball_x = ${this.ball.ball_x} et ball_y = ${this.ball.ball_y}`);

            this.ball.ball_dir_y *= -1;
            this.ball.current_rebond++;
            this.normalize_ball_speed();
        }
    }

    handle_goal(): void
    {
        // mettre a jour data
        if (this.ball.ball_x < 0)
        {
            if (this.ball.ball_y <= this.config.canvas_height)
                this.data.lose_point_up++;
            else
                this.data.lose_point_down++;
        }
        else
        {
            if (this.ball.ball_y <= this.config.canvas_height)
                this.data.win_point_up++;
            else
                this.data.win_point_down++;
        }


        this.ball.ball_dir_x = 0;
        this.ball.ball_dir_y = 0;
        this.update_score(1);
        if (this.state.left_score == this.config.score_to_win || this.state.right_score == this.config.score_to_win)
        {
            this.end_game();
            return ;
        }
        this.config.ball_speed = 4.5 * (3/2);
        this.config.paddle_speed = 8.5 * (3/2);

        this.goal_timeout = setTimeout(() =>
        {
            this.ball.ball_x = this.config.canvas_width / 2;
            this.ball.ball_y = this.config.canvas_height / 2;
            this.ball.prev_x = this.ball.ball_x;
            this.ball.prev_y = this.ball.ball_y;
            this.paddle.left_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.paddle.right_paddle_y = (this.config.canvas_height - this.config.paddle_height) / 2;
            this.draw(1);
            this.start_count_down();
        }, 1500);

        return;
    }

    update_ball_dir(side: number): void
    {
        let paddle_y = side === 0 ? this.paddle.left_paddle_y : this.paddle.right_paddle_y;
        let relative_impact = (this.ball.ball_y - paddle_y) / this.config.paddle_height;
        let max_bounce_angle = Math.PI / 4;

        // Convertit l'impact en angle [-max, +max]
        let bounce_angle = (relative_impact - 0.5) * 2 * max_bounce_angle;

        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(bounce_angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(bounce_angle);

        if (side === 1) this.ball.ball_dir_x = -this.ball.ball_dir_x;
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
            score_P1.textContent = `${this.player_name} : ${this.state.left_score}`;
        if (score_P2)
        {
            if (i18n.getCurrentLanguage() == "en")
                score_P2.textContent = `PLAYER 2 : ${this.state.right_score}`;
            else if (i18n.getCurrentLanguage() == "fr")
                score_P2.textContent = `JOUEUR 2 : ${this.state.right_score}`;
            else
                score_P2.textContent = `JUGADOR 2 : ${this.state.right_score}`;
        }
    }

    // Fonction start_count_down corrigée (après un but)
    start_count_down(): void
    {
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
            if (i18n.getCurrentLanguage() == "en")
                this.count_down.innerText = `Start in : ${countdown}`;
            else if (i18n.getCurrentLanguage() == "fr")
                this.count_down.innerText = `Reprise dans : ${countdown}`;
            else
                this.count_down.innerText = `Empieza en : ${countdown}`;

            // Utiliser this.countdown_interval
            this.countdown_interval = setInterval(() => {
                countdown--;

                if (this.state.restart_active)
                {
                    //console.log("⚠️ Countdown de but interrompu par restart");
                    return;
                }

                if (countdown > 0)
                {
                    if (i18n.getCurrentLanguage() == "en")
                        this.count_down.innerText = `Start in : ${countdown}`;
                    else if (i18n.getCurrentLanguage() == "fr")
                        this.count_down.innerText = `Reprise dans : ${countdown}`;
                    else
                        this.count_down.innerText = `Empieza en : ${countdown}`;
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
                }
            }, 1000);
        }, 1000);
    }

    init_ball_direction(): void
    {
        this.ball.angle = get_random_playable_angle();
        this.ball.ball_dir_x = this.config.ball_speed * Math.cos(this.ball.angle);
        this.ball.ball_dir_y = this.config.ball_speed * Math.sin(this.ball.angle);

        if (this.state.game_mode == "solo" && this.ball.ball_dir_x > 0)
        {

            let new_angle;

            if (Math.random() < 0.5)
            {
                new_angle = -Math.PI/6 + Math.random() * (Math.PI/6); // Entre -30° et 0°
            } else
            {
                new_angle = Math.random() * (Math.PI/6); // Entre 0° et 30°
            }

            this.ball.angle = new_angle;
            this.ball.ball_dir_x = this.config.ball_speed * Math.cos(this.ball.angle);
            this.ball.ball_dir_y = this.config.ball_speed * Math.sin(this.ball.angle);
        }

        this.ball.prev_x = this.ball.ball_x;
        this.ball.prev_y = this.ball.ball_y;
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

    draw(interpolation: number): void
    {
        if (!this.ctx)
            return;

        // calcul des coordonnees interpoles
        const interpolated_x = this.ball.prev_x + (this.ball.ball_x - this.ball.prev_x) * interpolation;
        const interpolated_y = this.ball.prev_y + (this.ball.ball_y - this.ball.prev_y) * interpolation;

        // fond noir degrade
        let bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.config.canvas_height);
        bgGradient.addColorStop(0, "#0f0f0f");
        bgGradient.addColorStop(1, "#1a1a1a");
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.config.canvas_width, this.config.canvas_height);

        // ligne centrale de pointilles
        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([10, 15]);
        this.ctx.strokeStyle = "#444";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.canvas_width / 2, 0);
        this.ctx.lineTo(this.config.canvas_width / 2, this.config.canvas_height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // raquettes
        // effet glow : couleur + ombre
        this.ctx.shadowColor = "#00ffff";
        this.ctx.shadowBlur = 20;

        let paddleGradientLeft = this.ctx.createLinearGradient(0, this.paddle.left_paddle_y, 0, this.paddle.left_paddle_y + this.config.paddle_height);
        paddleGradientLeft.addColorStop(0, "#00ffff");
        paddleGradientLeft.addColorStop(1, "#005f5f");
        this.ctx.fillStyle = paddleGradientLeft;
        this.ctx.fillRect(30, this.paddle.left_paddle_y, this.config.paddle_width, this.config.paddle_height);

        this.ctx.shadowColor = "#ff00ff";
        this.ctx.shadowBlur = 20;

        let paddleGradientRight = this.ctx.createLinearGradient(0, this.paddle.right_paddle_y, 0, this.paddle.right_paddle_y + this.config.paddle_height);
        paddleGradientRight.addColorStop(0, "#ff00ff");
        paddleGradientRight.addColorStop(1, "#5f005f");
        this.ctx.fillStyle = paddleGradientRight;
        this.ctx.fillRect(this.config.canvas_width - 30 - this.config.paddle_width, this.paddle.right_paddle_y, this.config.paddle_width, this.config.paddle_height);

        // balle
        const pulse = 10 + Math.sin(Date.now() / 100) * 2;
        const blink = Math.floor(Date.now() / 200) % 2 === 0;
        this.ctx.shadowColor = blink ? "#ffff00" : "#ff00ff";
        this.ctx.shadowBlur = 25;
        this.ctx.fillStyle = blink ? "#ffff00" : "#ff00ff";
        this.ctx.beginPath();
        //this.ctx.arc(this.ball.ball_x, this.ball.ball_y, pulse, 0, Math.PI * 2);
        this.ctx.arc(interpolated_x, interpolated_y, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // balle fantome
        // this.ctx.beginPath();
        // this.ctx.fillStyle = "gray";
        // this.ctx.arc(this.ball.ia_x, this.ball.ia_y, 10, 0,  Math.PI * 2)
        // this.ctx.fill();

        // === 5. HUD (score, vitesse) AVEC POLICE PIXEL ===
        // this.ctx.shadowBlur = 0;
        // this.ctx.fillStyle = "#00ffcc";
        // this.ctx.font = "bold 18px 'Courier New', monospace";
        // const currentSpeed = calculate_ball_speed(this.ball);
        // this.ctx.fillText(`🎯 Vitesse: ${currentSpeed.toFixed(2)}`, 20, 30);

        // this.ctx.fillStyle = "#ff66cc";
        // this.ctx.font = "14px 'Courier New', monospace";
        // this.ctx.fillText(`⏱️ Temps: ${get_time(this.start_time).toFixed(0)} ms`, 20, 55);
    }


    ia_init()
    {
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
        this.ia.data = 0;
        this.ia.delta_paddle = this.ia_delta_paddle();
        if (this.paddle.current_shot >= 4)
            this.handle_ia_error();
    }

    ia_detection(): void
    {
        let x = this.ball.ball_x;
        let y = this.ball.ball_y;
        let dir_x = this.ball.ball_dir_x;
        let dir_y = this.ball.ball_dir_y;
        let prev_x = x;
        let prev_y = y;

        while (x < this.config.canvas_width - 40)
        {
            if (y <= 0 || y >= this.config.canvas_height)
            {
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
        else
        {
            let final_distance = Math.sqrt(Math.pow(x - prev_x, 2) + Math.pow(y - prev_y, 2));
            this.ball.distance_ia += final_distance;
        }

        this.ball.time_ia_in_frame = this.ball.distance_ia / this.config.ball_speed;
        //this.paddle.time_ia_in_frame = Math.abs(this.ball.ia_y - this.paddle.right_paddle_y + 5) / this.config.paddle_speed;
    }

    ia_init_difficulty()
    {
        let random_depart = random_number(0.1, 0.2);
        this.ia.depart = random_depart * this.ball.time_ia_in_frame;

        let random_move_2 = random_number(0.1, 0.25);
        this.ia.move_2 = random_move_2 * this.ball.time_ia_in_frame;

        let random_move_1 = 1 - random_move_2 - random_depart;
        this.ia.move_1 = random_move_1 * this.ball.time_ia_in_frame;

        //console.log(`TIME IN FRAME = ${this.ball.time_ia_in_frame}`);
        //console.log(`random_depart = ${random_depart}`);
        //console.log(`random_move_1 = ${random_move_1}`);
        //console.log(`random_move_2 = ${random_move_2}`);


        // supression de l'erreur si paddle deja sur la trajectoire
        if (this.ball.ia_y >= this.paddle.right_paddle_y && this.ball.ia_y <= this.paddle.right_paddle_y + this.config.paddle_height)
            this.ia.delta_error = 0;
    }

    handle_paddle_move()
    {
        if (this.ia.rebond == 0)
        {
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

    update_paddle_ia_with_time()
    {
        if (this.ia.depart >= this.ia.counter)
            return ;

        if (this.ia.move_1 >= this.ia.counter - this.ia.depart)
        {
            if (this.ia.ia_debug == true)
            {
                //console.log("****** TIME move 1 *********");
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                if (Math.abs(distance) > 200)
                    this.ia.random_move_1 = false;
                this.ia.ia_debug = false;
            }
            this.ia_ajustement(80, this.ia.random_move_1);
            return ;
        }
        if (this.ia.super_flag == true)
        {
            //console.log("---------------- SUPER FLAG ---------------");
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
            //this.ia.ia_debug_2 = true;
        }
        if (this.ia.move_2 >= (this.ia.counter - this.ia.move_1 - this.ia.depart))
        {
            if (this.ia.ia_debug == true)
            {
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                //console.log("****** TIME move 2 *********");
                //console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 13)
                this.ia_ajustement(12, this.ia.random_move_2);
            else
                this.ia_ajustement(8, this.ia.random_move_2);
            //console.log("FIN DE MOOOOVE");
            return ;
        }
    }

    update_paddle_ia_with_1_close_rebond()
    {
        if (this.ball.current_rebond < 1 && this.ia.depart >= this.ia.counter)
            return ;
        if (this.ia.move_1 >= this.ia.counter)
        {
            if (this.ia.ia_debug == true)
            {
                //console.log("****** 1 CLOSE move 1 *********");
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                if (Math.abs(distance) > 200)
                    this.ia.random_move_1 = false;
                this.ia.ia_debug = false;
            }
            this.ia_ajustement(120, this.ia.random_move_1);
            return ;
        }
        if (this.ia.super_flag == true)
        {
            //console.log("---------------- SUPER FLAG ---------------");
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
            //this.ia.ia_debug_2 = true;
        }
        if (this.ia.move_2 >= (this.ia.counter - this.ia.move_1 - this.ia.depart))
        {
            if (this.ia.ia_debug == true)
            {
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                //console.log("****** 1 CLOSE move 2 *********");
                // //console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 13)
                this.ia_ajustement(12, this.ia.random_move_2);
            else
                this.ia_ajustement(10, this.ia.random_move_2);
            //console.log("FIN DE MOOOOVE");
            return ;
        }
    }

    update_paddle_ia_with_1_far_rebond()
    {
        if (this.ia.depart >= this.ia.counter)
            return ;
        if (this.ball.current_rebond < 1)
        {
            if (this.ia.ia_debug == true)
            {
                //console.log("****** 1 FAR move 1 *********");
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                this.ia.data = distance;
                this.ia.ia_debug = false;
            }
            if (this.ia.data > 250)
                this.ia_ajustement(120, false);
            else
                this.ia_ajustement_rebond(120);
            return ;
        }
        if (this.ia.super_flag == true)
        {
            //console.log("---------------- SUPER FLAG ---------------");
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
            //this.ia.ia_debug_2 = true;
        }
        if (this.ball.current_rebond >= 1)
        {
            if (this.ia.ia_debug == true)
            {
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                //console.log("****** 1 FAR move 2 *********");
                //console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 13)
                this.ia_ajustement(12, false);
            else
                this.ia_ajustement(10, false);
            //console.log("FIN DE MOOOOVE");
            return ;
        }
    }

    update_paddle_ia_with_2_rebonds()
    {
        if (this.ball.current_rebond < 1 && this.ia.depart >= this.ia.counter)
            return ;
        if (this.ball.current_rebond < 2)
        {
            if (this.ia.ia_debug == true)
            {
                //console.log("****** 2 REBONDS move 1 *********");
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                this.ia.data = distance;
                this.ia.ia_debug = false;
            }
            if (this.ia.data > 250)
                this.ia_ajustement(120, false);
            else
                this.ia_ajustement_rebond(120);
            return ;
        }
        if (this.ia.super_flag == true)
        {
            //console.log("---------------- SUPER FLAG ---------------");
            this.ia.continue_flag = true;
            this.ia.move_flag = false;
            this.ia.super_flag = false;
            this.ia.ia_debug = true;
            //this.ia.ia_debug_2 = true;
        }
        if (this.ball.current_rebond >= 2)
        {
            if (this.ia.ia_debug == true)
            {
                let center_paddle = this.paddle.right_paddle_y + this.config.paddle_height / 2;
                let target_y = this.ball.ia_y;
                let distance = target_y - center_paddle;
                //console.log("****** 2 REBONDS move 2 *********");
                //console.log(`distance = ${Math.abs(distance)} et delta_paddle = ${this.ia.delta_paddle} et random = ${this.ia.random_move_2}`);
                this.ia.ia_debug = false;
                if (Math.abs(distance) < 30)
                    this.ia.random_move_2 = false;
            }
            if (this.config.ball_speed > 13)
                this.ia_ajustement(12, false);
            else
                this.ia_ajustement(10, false);
            //console.log("FIN DE MOOOOVE");
            return ;
        }
    }


    ia_ajustement(marge: number, random: boolean)
    {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        let distance = target_y - center_paddle;

        //console.log(`distance = ${Math.abs(distance)} et marge = ${marge} et continue = ${this.ia.continue_flag}`);

        if (Math.abs(distance) <= marge && random == false)
        {
            //console.log("FIN DE MOVE avec random = false");
            return ;
        }

        if (Math.abs(distance) <= marge && random == true && this.ia.move_flag == true)
        {
            if (this.ia.continue_flag == true)
            {
                //console.log(" ----- CONTINUE FLAG ----- ");
                this.ia.distance_with_marge = center_paddle - this.ball.ia_y;
                this.ia.continue_flag = false;
            }
            this.continue_movement();
            //console.log("FIN DE MOVE continue");
            return ;
        }

        if (Math.abs(distance) <= marge)
        {
            //console.log("FIN DE MOVE");
            return ;
        }

        if (distance > 0 && this.ia.continue_flag == true)
        {
            //console.log(`ajust 1 et marge = ${marge}`);
            this.paddle.right_paddle_y += this.config.paddle_speed;
            this.ia.move_flag = true;
        }
        else if (distance < 0 && this.ia.continue_flag == true)
        {
            //console.log(`ajust 2 et marge = ${marge}`);
            this.paddle.right_paddle_y -= this.config.paddle_speed;
            this.ia.move_flag = true;
        }

        this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
    }

    ia_ajustement_rebond(marge: number)
    {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;
        let distance = target_y - center_paddle;

        if (Math.abs(distance) <= marge)
        {
            if (this.ia.continue_flag == true)
            {
                this.ia.distance_with_marge = center_paddle - this.ball.ia_y;
                this.ia.continue_flag = false;
            }
            this.continue_movement_rebond();
            //console.log("FIN DE MOVE continue");
            return ;
        }

        if (distance > 0 && this.ia.continue_flag == true)
        {
            //console.log(`ajust 1 et marge = ${marge}`);
            this.paddle.right_paddle_y += this.config.paddle_speed;
        }
        else if (distance < 0 && this.ia.continue_flag == true)
        {
            //console.log(`ajust 2 et marge = ${marge}`);
            this.paddle.right_paddle_y -= this.config.paddle_speed;
        }

        this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
    }

    continue_movement()
    {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;

        if (this.ia.distance_with_marge < 0 && (this.config.canvas_height - target_y) >= (this.config.paddle_height / 2))
        {
            if (center_paddle - target_y <= (this.ia.distance_with_marge * -1 * 0.55))
            {
                this.paddle.right_paddle_y += this.config.paddle_speed;
                //console.log("continue 1");
            }
            this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
            return ;
        }
        else if (this.ia.distance_with_marge >= 0 && target_y >= (this.config.paddle_height / 2))
        {
            if (center_paddle - target_y >= (this.ia.distance_with_marge * -1 * 0.55))
            {
                this.paddle.right_paddle_y -= this.config.paddle_speed;
                //console.log("continue 2");
            }
            this.paddle.right_paddle_y = Math.max(0, Math.min(this.config.canvas_height - this.config.paddle_height, this.paddle.right_paddle_y));
            return ;
        }
        return ;
    }

    continue_movement_rebond()
    {
        let center_paddle = this.paddle.right_paddle_y + this.ia.delta_error + this.ia.delta_paddle + this.config.paddle_height / 2;
        let target_y = this.ball.ia_y;

        if (this.ia.distance_with_marge < 0)
        {
            if (center_paddle - target_y <= (this.ia.distance_with_marge * -1 * 0.55))
            {
                this.paddle.right_paddle_y += this.config.paddle_speed;
                //console.log("continue 1");
            }
            this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
            return ;
        }
        else if (this.ia.distance_with_marge >= 0)
        {
            if (center_paddle - target_y >= (this.ia.distance_with_marge * -1 * 0.55))
            {
                this.paddle.right_paddle_y -= this.config.paddle_speed;
                //console.log("continue 2");
            }
            this.paddle.right_paddle_y = Math.max(5, Math.min(this.config.canvas_height - this.config.paddle_height - 5, this.paddle.right_paddle_y));
            return ;
        }
        return ;
    }

    ia_delta_paddle(): number
    {
        let random = random_number(0, 0.38);
        let random_sign = random_bool();

        if (random_sign == true)
            random *= -1;

        return (random * 100);
    }

    handle_ia_error()
    {
        let random = random_number(0, 1);
        let ajust_percent_lose = 0;

        if (this.state.right_score - this.state.left_score >= 2)
            ajust_percent_lose = 0.15;

        if (this.state.right_score - this.state.left_score >= 3)
            ajust_percent_lose = 0.20;

        if (this.state.right_score - this.state.left_score >= 4)
            ajust_percent_lose = 0.25;

        if (this.paddle.current_shot < 9)
        {
            if (random < 0.10 + ajust_percent_lose)
            {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 70 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (70 + this.ia.delta_paddle) * -1;
            }
        }
        else if (this.paddle.current_shot < 12)
        {
            if (random < 0.15 + ajust_percent_lose)
            {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 70 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (70 + this.ia.delta_paddle) * -1;
            }
        }
        else
        {
            if (random < 0.25 + ajust_percent_lose)
            {
                if (this.ia.delta_paddle > 0)
                    this.ia.delta_error = 70 - this.ia.delta_paddle;
                else
                    this.ia.delta_error = (70 + this.ia.delta_paddle) * -1;
            }
        }

        //if (this.ia.delta_error != 0)
            //console.log(`! ERROR ! avec cou = ${this.paddle.current_shot} avec delta = ${this.ia.delta_error}`);
    }

}

class GamePong
{
    static create_game(canvas : HTMLCanvasElement, mode: 'solo' | 'versus'): Pong
    {
        return new Pong(canvas, mode);
    }
}


export class Game_solo
{
    private current_game: Pong | null = null;
    private canvas: HTMLCanvasElement;
    private mode: 'solo' | 'versus';


    constructor(mode : 'solo' | 'versus')
    {
        this.mode = mode;
        this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        this.current_game = GamePong.create_game(this.canvas, this.mode);
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

    cleanup()
    {
        if (this.current_game)
        {
            this.current_game.cleanup();
        }
    }

    back_to_menu()
    {
        if (this.current_game)
        {
            this.current_game.back_to_menu();
        }
    }

    destroy()
    {
        if (this.current_game)
        {
            this.current_game.destroy();
        }
    }
}
