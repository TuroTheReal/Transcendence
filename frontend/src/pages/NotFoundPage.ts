export function createNotFoundPage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'not-found-page';
  
  page.innerHTML = `
    <div class="not-found-container">
      <h1>404</h1>
      <p>Page non trouvée</p>
      <button class="home-btn" data-route="/home">Retour à l'accueil</button>
    </div>
  `;
  

  page.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const route = target.getAttribute('data-route');
    if (route) {
      /*
      This function is called when the user clicks on a button.
      It finds the targeted route and navigates to it.
      */
      import('../router/router.js').then(({ router }) => {
        router.navigate(route);
      });
    }
  });
  
  return page;
} 