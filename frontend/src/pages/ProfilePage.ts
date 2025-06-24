export function createProfilePage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'profile-page';
  
  page.innerHTML = `
    <header class="page-header">
      <button class="back-btn" data-route="/home">← Retour</button>
      <h2>Mon Profil</h2>
    </header>
    <main class="profile-content">
      <div class="profile-info">
        <div class="avatar">
          <img src="/default-avatar.png" alt="Avatar" id="user-avatar">
        </div>
        <div class="user-details">
          <h3 id="username">Nom d'utilisateur</h3>
          <p id="user-stats">Parties jouées: 0 | Victoires: 0</p>
        </div>
      </div>
      <div class="profile-actions">
        <button id="edit-profile">Modifier le profil</button>
        <button id="change-avatar">Changer l'avatar</button>
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