// front/src/styles/pongStyles.ts

export const pongClasses = {
  // Conteneurs de jeu - Tailles fixes
  gameContainer: "relative overflow-hidden rounded-2xl border border-cyan-400/30 backdrop-blur-lg bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95",
  gameWrapper: "flex items-center justify-center min-h-screen bg-gray-900",
  
  // Ligne centrale
  centerLine: "absolute left-1/2 top-0 bottom-0 w-0.5 opacity-60 transform -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-400/80 to-transparent",
  
  // Raquettes équipe 1 (gauche - cyan)
  paddleLeft: "absolute left-[30px] w-3 rounded-lg transition-all duration-75 ease-linear border border-cyan-400/60 bg-gradient-to-r from-cyan-400/90 via-cyan-500/70 to-cyan-400/90",
  
  // Raquettes équipe 2 (droite - pink)  
  paddleRight: "absolute right-[30px] w-3 rounded-lg transition-all duration-75 ease-linear border border-pink-400/60 bg-gradient-to-r from-pink-400/90 via-pink-500/70 to-pink-400/90",
  
  // Tailles de raquettes
  paddleNormal: "h-[100px]",
  paddleSmall: "h-[78px]",
  
  // Balles
  ballBase: "absolute rounded-full w-5 h-5 -ml-2.5 -mt-2.5 border-2 transition-all duration-75 ease-linear",
  ballCyan: "bg-cyan-400 border-cyan-400/90 shadow-cyan-400/80",
  ballPink: "bg-pink-400 border-pink-400/90 shadow-pink-400/80", 
  ballGreen: "bg-green-400 border-green-400/90 shadow-green-400/80",
  
  // Effets visuels
  glowCyan: "shadow-[0_0_20px_rgba(34,211,238,0.8)]",
  glowPink: "shadow-[0_0_20px_rgba(236,72,153,0.8)]",
  glowGreen: "shadow-[0_0_20px_rgba(34,197,94,0.8)]",
  glowIntense: "shadow-[0_0_30px_currentColor,0_0_60px_currentColor]",
  
  // Animations
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  
  // UI
  scoreText: "text-2xl font-bold text-cyan-400",
  countdownText: "text-6xl font-bold text-white",
  winMessage: "text-4xl font-bold text-green-400",
  
  // Positions UI
  scoreContainer: "absolute top-4 left-1/2 transform -translate-x-1/2 z-10",
  countdownContainer: "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20",
  messageContainer: "absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10",
  
  // Particules
  particle: "absolute w-0.5 h-0.5 rounded-full bg-cyan-400/60 pointer-events-none",
};

// Helper function pour combiner les classes
export function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

// Configurations pré-composées pour chaque mode
export const gameConfigs = {
  // Mode Solo (Joueur vs IA)
  solo: {
    container: cn(pongClasses.gameContainer),
    leftPaddle: cn(pongClasses.paddleLeft, pongClasses.paddleNormal, pongClasses.glowCyan),
    rightPaddle: cn(pongClasses.paddleRight, pongClasses.paddleNormal, pongClasses.glowPink),
    ball: cn(pongClasses.ballBase, pongClasses.ballCyan, pongClasses.glowCyan),
    centerLine: pongClasses.centerLine,
  },
  
  // Mode Versus (2 joueurs)
  versus: {
    container: cn(pongClasses.gameContainer),
    leftPaddle: cn(pongClasses.paddleLeft, pongClasses.paddleNormal, pongClasses.glowCyan),
    rightPaddle: cn(pongClasses.paddleRight, pongClasses.paddleNormal, pongClasses.glowPink),
    ball: cn(pongClasses.ballBase, pongClasses.ballPink, pongClasses.glowPink),
    centerLine: pongClasses.centerLine,
  },
  
  // Mode Tournament
  tournament: {
    container: cn(pongClasses.gameContainer),
    leftPaddle: cn(pongClasses.paddleLeft, pongClasses.paddleNormal, pongClasses.glowCyan),
    rightPaddle: cn(pongClasses.paddleRight, pongClasses.paddleNormal, pongClasses.glowPink),
    ball: cn(pongClasses.ballBase, pongClasses.ballGreen, pongClasses.glowGreen),
    centerLine: pongClasses.centerLine,
  },
  
  // Mode Ligne (4 joueurs)
  ligne: {
    container: cn(pongClasses.gameContainer),
    paddleP1: cn(pongClasses.paddleLeft, pongClasses.paddleSmall, pongClasses.glowCyan),
    paddleP2: cn(pongClasses.paddleLeft, pongClasses.paddleSmall, pongClasses.glowCyan),
    paddleP3: cn(pongClasses.paddleRight, pongClasses.paddleSmall, pongClasses.glowPink),
    paddleP4: cn(pongClasses.paddleRight, pongClasses.paddleSmall, pongClasses.glowPink),
    ball: cn(pongClasses.ballBase, pongClasses.ballCyan, pongClasses.glowCyan),
    centerLine: pongClasses.centerLine,
  },
};

// Effets spéciaux
export const effects = {
  paddleHit: "scale-110 duration-200",
  ballIntense: cn(pongClasses.glowIntense),
  scoreFlash: "animate-pulse",
};

// Dimensions fixes (en pixels)
export const dimensions = {
  game: { width: 800, height: 600 },
  paddle: { width: 12, height: 100, heightSmall: 78 },
  ball: { size: 20 },
  positions: { paddleLeft: 30, paddleRight: 30 },
};

// Styles CSS-in-JS pour appliquer les dimensions fixes
export const containerStyle = {
  width: '800px',
  height: '600px',
  boxShadow: '0 0 60px rgba(34, 211, 238, 0.3), inset 0 0 60px rgba(34, 211, 238, 0.1)',
};

export const centerLineStyle = {
  background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 8px, rgba(34, 211, 238, 0.8) 8px, rgba(34, 211, 238, 0.8) 18px, transparent 18px, transparent 26px)',
  boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
};