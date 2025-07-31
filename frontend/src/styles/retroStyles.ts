// retroStyles.js - Système de styles rétro gaming en Tailwind CSS
// Direction artistique : Violet/Neon/Retro Gaming

export const retroStyles = {
    // Classes de base pour les textes néon
    neonText: "text-purple-300 drop-shadow-[0_0_3px_rgb(187,134,252)] drop-shadow-[0_0_6px_rgb(187,134,252)] drop-shadow-[0_0_9px_rgb(187,134,252)] animate-pulse",
    
    // Titre principal avec effet néon
    retroTitle: "text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-center drop-shadow-[0_0_10px_rgb(157,78,221)] animate-pulse",
    
    // Boutons rétro avec effets néon
    retroButton: `
        bg-gradient-to-br from-purple-900/20 via-black to-purple-900/20 
        border-2 border-purple-400 
        shadow-[0_0_10px_rgb(157,78,221,0.4),inset_0_0_10px_rgb(157,78,221,0.2)] 
        transition-all duration-300 
        relative 
        overflow-hidden
        hover:border-purple-300 
        hover:shadow-[0_0_20px_rgb(157,78,221),inset_0_0_20px_rgb(157,78,221,0.3)] 
        hover:scale-105
        before:content-[''] 
        before:absolute 
        before:top-0 
        before:-left-full 
        before:w-full 
        before:h-full 
        before:bg-gradient-to-r 
        before:from-transparent 
        before:via-purple-400/40 
        before:to-transparent 
        before:transition-all 
        before:duration-500
        hover:before:left-full
    `,
    
    // Panneaux rétro avec bordures néon
    retroPanel: `
        bg-black/95 
        border-2 border-purple-400 
        shadow-[0_0_15px_rgb(157,78,221,0.4),inset_0_0_15px_rgb(157,78,221,0.2)] 
        backdrop-blur-sm
    `,
    
    // Cadre de canvas de jeu
    gameCanvasFrame: `
        bg-black/95 
        border-4 border-purple-400 
        shadow-[0_0_30px_rgb(157,78,221,0.8),inset_0_0_30px_rgb(157,78,221,0.4)]
    `,
    
    // Tableau de score
    scoreboardPanel: `
        bg-gradient-to-br from-black via-purple-900/20 to-black 
        border-2 border-purple-400 
        shadow-[0_0_20px_rgb(157,78,221,0.6),inset_0_0_20px_rgb(157,78,221,0.3)]
    `,
    
    // Inputs rétro
    retroInput: `
        bg-gradient-to-br from-black to-purple-900/20 
        border-2 border-purple-400 
        text-purple-300 
        shadow-[0_0_10px_rgb(157,78,221,0.4),inset_0_0_10px_rgb(157,78,221,0.2)]
        focus:border-purple-300 
        focus:shadow-[0_0_20px_rgb(157,78,221),inset_0_0_20px_rgb(157,78,221,0.3)] 
        focus:outline-none
    `,
    
    // Indicateurs de coin
    cornerIndicator: `
        w-5 h-5 
        border-4 border-purple-400 
        shadow-[0_0_10px_rgb(157,78,221)]
    `,
    
    // Bordure néon générique
    neonBorder: `
        border-2 border-purple-400 
        shadow-[0_0_10px_rgb(157,78,221),inset_0_0_10px_rgb(157,78,221),0_0_20px_rgb(157,78,221,0.4)] 
        bg-gradient-to-br from-black via-purple-900/20 to-black
    `,
    
    // Classes pour les statuts d'amis
    statusOnline: "w-3 h-3 bg-green-400 rounded-full shadow-[0_0_5px_rgb(34,197,94)] mr-3",
    statusOffline: "w-3 h-3 bg-gray-500 rounded-full mr-3",
    
    // Item d'ami
    friendItem: "p-3 rounded-lg bg-gray-800/30 border border-gray-600/30 hover:bg-gray-700/40 transition-all duration-200",
    
    // Carte de joueur
    playerCard: "bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-400/30",
    
    // Container principal avec scan lines
    scanLinesContainer: `
        relative
        before:content-[''] 
        before:absolute 
        before:top-0 
        before:left-0 
        before:right-0 
        before:bottom-0 
        before:bg-gradient-to-b 
        before:from-transparent 
        before:via-purple-400/10 
        before:to-transparent 
        before:bg-[length:100%_4px] 
        before:animate-pulse 
        before:pointer-events-none
    `,
    
    // Champ d'étoiles (background fixe)
    starfield: `
        fixed top-0 left-0 w-full h-full pointer-events-none -z-10
        bg-[radial-gradient(2px_2px_at_20px_30px,rgb(157,78,221),transparent),
             radial-gradient(2px_2px_at_40px_70px,rgb(199,125,255),transparent),
             radial-gradient(1px_1px_at_90px_40px,rgb(157,78,221),transparent),
             radial-gradient(1px_1px_at_130px_80px,rgb(199,125,255),transparent),
             radial-gradient(2px_2px_at_160px_30px,rgb(157,78,221),transparent),
             radial-gradient(1px_1px_at_200px_90px,rgb(199,125,255),transparent),
             radial-gradient(2px_2px_at_240px_20px,rgb(157,78,221),transparent)]
        bg-[length:250px_150px]
        animate-pulse
    `
};

// Classes composées pour des éléments spécifiques
export const composedStyles = {
    // Bouton de retour
    backButton: `${retroStyles.retroButton} text-white font-bold py-2 px-6 rounded-lg`,
    
    // Bouton de mode de jeu
    gameModeButton: `${retroStyles.retroButton} text-purple-300 font-bold py-4 px-8 rounded-xl`,
    
    // Bouton de démarrage/action
    actionButton: `${retroStyles.retroButton} text-purple-300 font-bold py-2 px-6 rounded-lg`,
    
    // Titre de section
    sectionTitle: "text-3xl font-bold text-purple-300 mb-8 text-center",

    // username une fois connecte
    nametitle: "text-xl font-bold text-white mb-8 text-center",
    
    // Message d'erreur
    errorMessage: `${retroStyles.neonText} text-red-400 text-lg font-bold`,
    
    // Input de tournoi
    tournamentInput: `${retroStyles.retroInput} px-4 py-2 rounded-lg w-full text-center font-bold`,
    
    // Panneau de joueur (tournoi)
    playerPanel: `${retroStyles.retroPanel} rounded-xl p-6 flex flex-col items-center`,
    
    // Avatar de joueur
    playerAvatar: "w-16 h-16 rounded-full bg-gray-800/50 backdrop-blur-sm border-4 border-purple-400/50 flex items-center justify-center",
    
    // Contrôles de jeu
    controlPanel: `${retroStyles.retroPanel} rounded-2xl p-6`,
    controlItem: `${retroStyles.retroPanel} rounded-lg p-4 text-center`,
    
    // Interface 1v1
    onlineInterface: "bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/30",
    friendsPanel: "bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30 w-full flex flex-col h-full"
};

// Fonction utilitaire pour appliquer les styles
export function applyRetroStyles(element, styleKey) {
    if (retroStyles[styleKey]) {
        element.className = retroStyles[styleKey];
    } else if (composedStyles[styleKey]) {
        element.className = composedStyles[styleKey];
    }
}

// Export des classes individuelles pour utilisation directe
export const classes = {
    ...retroStyles,
    ...composedStyles
};