export function createLoginPage(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'login-page';

  page.innerHTML = `
    <div class="login-container">
      <h1>Transcendence</h1>
      <form class="login-form">
        <input type="text" placeholder="Username" id="username" required>
        <input type="password" placeholder="Password" id="password" required>
        <button type="submit">Log in</button>
	  </form>
	  <button type="button" id="register-btn">Sign up</button>
    </div>
  `;

  const signupBtn = page.querySelector('#register-btn') as HTMLButtonElement;
  signupBtn.addEventListener("click", () => {
	import("../router/router.js").then(({ router }) => {
		router.navigate("/signup");
		});
  	});

  const form = page.querySelector('.login-form') as HTMLFormElement;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    /*
    This function is called when the user clicks on a button.
    It finds the targeted route and navigates to it.
    */
    import('../router/router.js').then(({ router }) => {
      router.navigate('/home');
    });
  });

  return page;
}