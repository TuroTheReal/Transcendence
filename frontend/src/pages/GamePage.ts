export function createGamePage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'game-page';
  
  page.innerHTML = `
    <header class="game-header">
      <button class="back-btn" data-route="/home">← Retour</button>
      <h2>Pong Game</h2>
      <div class="score">
        <span id="player1-score">0</span> - <span id="player2-score">0</span>
      </div>
    </header>
    <main class="game-container">
      <canvas id="pong-canvas" width="800" height="400"></canvas>
      <div class="game-controls">
        <button id="start-game">Démarrer</button>
        <button id="pause-game">Pause</button>
      </div>
    </main>
  `;
  
  page.addEventListener('click', (e) => {
    /*
    This function is called when the user clicks on a button.
    It finds the targeted route and navigates to it.
    */
    const target = e.target as HTMLElement;
    const route = target.getAttribute('data-route');
    if (route) {
      import('../router/router.js').then(({ router }) => {
        router.navigate(route);
      });
    }
  });
  
  return page;
} 