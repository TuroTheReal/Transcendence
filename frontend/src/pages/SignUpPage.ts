import { UserSignUpCheck } from '../../backend/src/signup/signUpCheck.ts';

export function createSignUpPage(): HTMLElement{
	const page = document.createElement('div');
	page.className = "signup-page";

	page.innerHTML = `
		<div class="signup-container">
			<h1> Create your account </h1>
			<form class="signup-form">
				<input type="text" placeholder="Username" id="username" required>
				<input type="text" placeholder="Password" id="password" required>
				<br>
				<label for="avatar">Choose a profile picture:</label>
				<input type="file" id="avatar" name="avatar" accept="image/png, image/jpeg" />
				<p><img id="avatar" width="200" /></p>
				<br>
				<button type="submit">Sign up</button>
			</form>
		</div>
		`;

	const form = page.querySelector(".signup-form") as HTMLFormElement;
	form.addEventListener("submit", (e) => {
		e.preventDefault();

		const usernameInput = page.querySelector("#username") as HTMLInputElement;
		const passwordInput = page.querySelector("#password") as HTMLInputElement;
		const avatarInput = page.querySelector("#avatar") as HTMLInputElement;

		const UserInfo = {
			username: usernameInput.value,
			password: passwordInput.value,
			avatar: avatarInput.value,
		};

		if (UserSignUpCheck(UserInfo)){
			//push to backend
		}
		else {
			//error message
		}

		import("../router/router.js").then(({ router }) => {
			router.navigate('/login');
		});
	});
	return page;
}