export function createLogoutSwitcher(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'logout-button';
    
    const logoutBtn = document.createElement('button');
	logoutBtn.className = "neon-btn neon-btn-secondary";
	logoutBtn.textContent = "Logout";
	logoutBtn.onclick = async () => {
		try
		{
			const response = await fetch("/api/logout", {
			method: "POST",
				headers: {
					'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
				}
			});
	
			if (response.ok) {
				console.log("Logout successful on backend.");
			} else {
				console.error("Backend logout failed.");
			}
		} catch (error) {
			console.error("Error during logout fetch:", error);
		} finally {
			sessionStorage.clear();
			import('../router/router.js').then(({ router }) => {
				router.navigate('/game');
			});
		}
	};
	container.appendChild(logoutBtn);
	return container;
}