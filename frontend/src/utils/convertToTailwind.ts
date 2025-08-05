// Mapping des classes retroStyles vers Tailwind CSS
export const classMapping: Record<string, string> = {
  // Boutons
  'classes.backButton': 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[\'\'] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full',
  
  'classes.gameModeButton': 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[\'\'] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full',
  
  'classes.actionButton': 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-purple-300 font-bold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-neon-purple hover:border-purple-300 relative overflow-hidden before:content-[\'\'] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent before:transition-all before:duration-500 hover:before:left-full',
  
  // Titres et textes
  'classes.retroTitle': 'text-6xl font-black text-transparent bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-center drop-shadow-neon-purple animate-pulse',
  
  'classes.sectionTitle': 'text-3xl font-bold text-purple-300 mb-8 text-center',
  
  'classes.nametitle': 'text-xl font-bold text-white mb-8 text-center',
  
  'classes.neonText': 'text-purple-300 drop-shadow-neon-purple animate-pulse',
  
  // Panels et containers
  'classes.retroPanel': 'bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm',
  
  'classes.gameCanvasFrame': 'bg-black/95 border-4 border-purple-400 shadow-[0_0_30px_rgb(157,78,221,0.8),inset_0_0_30px_rgb(157,78,221,0.4)]',
  
  'classes.scoreboardPanel': 'bg-gradient-to-br from-black via-purple-900/20 to-black border-2 border-purple-400 shadow-neon-purple-lg',
  
  'classes.playerPanel': 'bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-xl p-6 flex flex-col items-center',
  
  // Inputs
  'classes.retroInput': 'bg-gradient-to-br from-black to-purple-900/20 border-2 border-purple-400 text-purple-300 shadow-neon-purple px-4 py-2 rounded-lg w-full transition-all duration-300 focus:border-purple-300 focus:shadow-neon-purple-lg focus:outline-none',
  
  'classes.tournamentInput': 'bg-gradient-to-br from-black to-purple-900/20 border-2 border-purple-400 text-purple-300 shadow-neon-purple px-4 py-2 rounded-lg w-full text-center font-bold transition-all duration-300 focus:border-purple-300 focus:shadow-neon-purple-lg focus:outline-none',
  
  // Layout helpers
  'classes.scanLinesContainer': 'relative before:content-[\'\'] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-purple-400/10 before:to-transparent before:bg-[length:100%_4px] before:animate-pulse before:pointer-events-none',
  
  'classes.starfield': 'fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(2px_2px_at_20px_30px,rgb(157,78,221),transparent),radial-gradient(2px_2px_at_40px_70px,rgb(199,125,255),transparent),radial-gradient(1px_1px_at_90px_40px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_130px_80px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_160px_30px,rgb(157,78,221),transparent),radial-gradient(1px_1px_at_200px_90px,rgb(199,125,255),transparent),radial-gradient(2px_2px_at_240px_20px,rgb(157,78,221),transparent)] bg-[length:250px_150px] animate-pulse',
  
  // Status indicators
  'classes.statusOnline': 'w-3 h-3 bg-green-400 rounded-full shadow-[0_0_5px_rgb(34,197,94)] mr-3',
  'classes.statusOffline': 'w-3 h-3 bg-gray-500 rounded-full mr-3',
  
  // Friend/Player items
  'classes.friendItem': 'p-3 rounded-lg bg-gray-800/30 border border-gray-600/30 hover:bg-gray-700/40 transition-all duration-200',
  
  'classes.playerCard': 'bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-400/30',
  
  'classes.playerAvatar': 'w-16 h-16 rounded-full bg-gray-800/50 backdrop-blur-sm border-4 border-purple-400/50 flex items-center justify-center',
  
  // Control panels
  'classes.controlPanel': 'bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-2xl p-6',
  
  'classes.controlItem': 'bg-black/95 border-2 border-purple-400 shadow-neon-purple-lg backdrop-blur-sm rounded-lg p-4 text-center',
  
  // Interfaces
  'classes.onlineInterface': 'bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/30',
  
  'classes.friendsPanel': 'bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30 w-full flex flex-col h-full',
  
  // Indicateurs de coin
  'classes.cornerIndicator': 'w-5 h-5 border-4 border-purple-400 shadow-neon-purple',
  
  // Bordure néon générique
  'classes.neonBorder': 'border-2 border-purple-400 shadow-[0_0_10px_rgb(157,78,221),inset_0_0_10px_rgb(157,78,221),0_0_20px_rgb(157,78,221,0.4)] bg-gradient-to-br from-black via-purple-900/20 to-black',
  
  // Messages d'erreur
  'classes.errorMessage': 'text-purple-300 drop-shadow-neon-purple animate-pulse text-red-400 text-lg font-bold',
};

// Fonction pour remplacer les classes dans un fichier
export function convertClassesToTailwind(content: string): string {
  let newContent = content;
  
  // Remplacer chaque mapping
  Object.entries(classMapping).forEach(([oldClass, newClass]) => {
    // Remplacer ${oldClass} dans les templates
    const templateRegex = new RegExp(`\\$\\{${oldClass.replace('.', '\\.')}\\}`, 'g');
    newContent = newContent.replace(templateRegex, newClass);
    
    // Remplacer class="${oldClass}"
    const classRegex = new RegExp(`class="\\$\\{${oldClass.replace('.', '\\.')}\\}"`, 'g');
    newContent = newContent.replace(classRegex, `class="${newClass}"`);
  });
  
  return newContent;
}

// Fonction pour enlever les imports de retroStyles et neonTheme
export function removeStyleImports(content: string): string {
  // Enlever les imports
  const importRegex = /import\s*{\s*(?:classes|createNeonContainer|neonThemeStyles|neonParticles)\s*}\s*from\s*["']\.\.\/styles\/(?:retroStyles|neonTheme)(?:\.js)?["'];?\s*\n?/g;
  let newContent = content.replace(importRegex, '');
  
  // Enlever les usages de createNeonContainer
  newContent = newContent.replace(/createNeonContainer\((.*?)\)/gs, '$1');
  
  return newContent;
}