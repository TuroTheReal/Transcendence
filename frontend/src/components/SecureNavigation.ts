// import { AuthService } from "../middleware/auth.js";

// const authService = new AuthService();

// export function createSecureNavigation(): HTMLElement {
//     const nav = document.createElement('nav');
//     nav.className = 'secure-nav';

//     const updateNav = async () => {
//         const user = await authService.getCurrentUser();
        
//         if (user) {
//             nav.innerHTML = `
//                 <div class="nav-user">
//                     <span>Bienvenue, ${user.username}</span>
//                     <button id="logout-btn" class="btn">Déconnexion</button>
//                 </div>
//             `;
            
//             const logoutBtn = nav.querySelector('#logout-btn');
//             logoutBtn?.addEventListener('click', async () => {
//                 await authService.logout();
//             });
//         } else {
//             nav.innerHTML = `
//                 <div class="nav-auth">
//                     <button class="btn" data-route="/login">Connexion</button>
//                     <button class="btn" data-route="/signup">Inscription</button>
//                 </div>
//             `;
//         }
//     };

//     updateNav();
    
//     // Écouter les changements d'authentification
//     document.addEventListener('authStateChanged', updateNav);
    
//     return nav;
// }