import { Game_solo } from './game_solo.js';
import { Game_ligne } from './game_ligne.js';


export function init_menu(): void {
    const menu = document.getElementById("menu") as HTMLElement;
    const local_btn = document.getElementById('localBtn') as HTMLButtonElement;
    const ligne_btn = document.getElementById('ligneBtn') as HTMLButtonElement;

    const menu_local = document.getElementById("menu_local") as HTMLElement;
    const solo_btn = document.getElementById('soloBtn') as HTMLButtonElement;
    const versus_btn = document.getElementById('versusBtn') as HTMLButtonElement;

    const menu_ligne = document.getElementById("menu_ligne") as HTMLElement;
    const solo_ligne_btn = document.getElementById('solo_ligneBtn') as HTMLButtonElement;
    const multi_btn = document.getElementById('multiBtn') as HTMLButtonElement;
    const tournoi_btn = document.getElementById('tournoiBtn') as HTMLButtonElement;

    const game = document.getElementById("game") as HTMLElement;

    const restart = document.getElementById("restartBtn") as HTMLButtonElement;
    const control_1 = document.getElementById("control_1") as HTMLElement;
    const control_2 = document.getElementById("control_2") as HTMLElement;
    const score_equip_1 = document.getElementById("scoreP1") as HTMLElement;
    const score_equip_2 = document.getElementById("scoreP2") as HTMLElement;
    const control_player_2 = document.getElementById("control_player_2") as HTMLElement;
    const control_player_2_command = document.getElementById("control_player_2_command") as HTMLElement;
    
    
    function choose_mode(mode: 'local' | 'ligne'): void
    {
        menu.style.display = "none";

        if (mode == 'local')
            menu_local.style.display = "block";
        else
            menu_ligne.style.display = "block";
    }

    // mode de jeu SOLO
    function start_game_solo(mode: 'solo' | 'versus'): void
    {
        const game_solo = new Game_solo(mode);
        
        menu_local.style.display = "none";
        menu_ligne.style.display = "none";
        game.style.display = "block";
        restart.style.display = "block";

        if (mode == "solo")
        {
            control_player_2.textContent = 'IA';
            control_player_2_command.textContent = "";
        }
        control_1.style.display = 'block';
        
        game_solo.start_game_loop();
    }

    // mode en ligne MULTI (2v2)
    function start_game_multi(): void
    {
        const game_ligne = new Game_ligne();

        menu_ligne.style.display = "none";
        game.style.display = "block";

        control_2.style.display = 'block';
        score_equip_1.textContent = "Equipe 1 : 0";
        score_equip_2.textContent = "Equipe 2 : 0";
        game_ligne.start_game_loop();
    }

    // mode en ligne SOLO (1v1)
    function start_game_ligne_solo(): void
    {
        const game_solo = new Game_solo('solo');
        
        menu_local.style.display = "none";
        menu_ligne.style.display = "none";
        game.style.display = "block";
        restart.style.display = "block";
        
        game_solo.start_game_loop();
    }
    
    local_btn.addEventListener('click', () => choose_mode('local'));
    ligne_btn.addEventListener('click', () => choose_mode('ligne'));

    // en local
    solo_btn.addEventListener('click', () => start_game_solo('solo'));
    versus_btn.addEventListener('click', () => start_game_solo('versus'));

    // en ligne
    solo_ligne_btn.addEventListener('click', () => start_game_ligne_solo());
    multi_btn.addEventListener('click', () => start_game_multi());
    //tournoi_btn.addEventListener('click', () => start_game('versus'));
}
