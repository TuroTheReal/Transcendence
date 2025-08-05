// Fixes pour les types DOM dans Node.js
declare global {
  interface Window {
    // Types pour les timers - force le type number
  }
}

// Fix pour setTimeout/setInterval qui retournent NodeJS.Timeout au lieu de number
declare var setTimeout: (callback: () => void, ms: number) => number;
declare var setInterval: (callback: () => void, ms: number) => number;

export {};