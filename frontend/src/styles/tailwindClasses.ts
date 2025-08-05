export const neonClasses = {
  // Buttons
  buttonBase: "font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:transition-all before:duration-500 hover:before:left-full",
  
  buttonGreen: "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/50 text-white hover:shadow-neon-green-lg hover:border-green-300 hover:from-green-500/50 hover:to-emerald-500/50 before:via-green-400/40",
  
  buttonBlue: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/50 text-white hover:shadow-neon-blue hover:border-blue-300 before:via-blue-400/40",
  
  buttonPurple: "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/50 text-white hover:shadow-neon-purple hover:border-purple-300 before:via-purple-400/40",
  
  // Cards/Panels
  card: "bg-gray-900/50 backdrop-blur-lg rounded-2xl border border-green-400/30 shadow-neon-green p-8",
  
  panel: "bg-gray-800/50 backdrop-blur-sm rounded-xl border border-purple-400/30 p-6",
  
  // Inputs
  input: "bg-gray-900/70 border border-green-400/50 rounded-lg text-white px-4 py-3 w-full transition-all duration-300 focus:outline-none focus:border-green-300 focus:shadow-neon-green placeholder-gray-500",
  
  // Text
  titleNeon: "text-6xl font-bold text-green-400 drop-shadow-neon-green animate-pulse",
  
  subtitle: "text-blue-400 text-xl font-semibold",
  
  textMuted: "text-gray-400",
  
  // Layout
  pageContainer: "min-h-screen bg-gray-900 text-white font-mono overflow-hidden",
  
  scanLines: "relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:bg-gradient-to-b before:from-transparent before:via-green-400/5 before:to-transparent before:bg-[length:100%_4px] before:animate-scan before:pointer-events-none",
  
  centerContainer: "min-h-screen flex flex-col items-center justify-center p-4",
  
  // Particles
  particle: "absolute w-0.5 h-0.5 bg-neon-green rounded-full animate-float",
  
  particlesContainer: "fixed top-0 left-0 w-full h-full pointer-events-none -z-10",
};

// Helper function to combine classes
export function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

// Pre-composed button classes
export const buttons = {
  primary: cn(neonClasses.buttonBase, neonClasses.buttonGreen),
  secondary: cn(neonClasses.buttonBase, neonClasses.buttonPurple),
  accent: cn(neonClasses.buttonBase, neonClasses.buttonBlue),
};

// Pre-composed layout classes
export const layouts = {
  page: cn(neonClasses.pageContainer, "animate-fade-in"),
  mainContent: cn(neonClasses.centerContainer, neonClasses.scanLines),
};