import { setupTOTP, send2FACode, verifyEmail2FA, verifyTOTP, get2FAStatus, disable2FA } from '../services/TwoFactorService.js';
// import { setupTOTP, send2FACode, verifyEmail2FA, verifyTOTP } from '../services/TwoFactorService.js';
// import { createTwoFactorCodeInput } from './TwoFactorCodeInput.js';

export function createTwoFactorSetup(userId: number): HTMLElement {
    const container = document.createElement('div');
    container.className = 'flex flex-col gap-4';

    let status: { enabled: boolean, type?: 'email' | 'totp' } | null = null;
    let error: string | null = null;

    async function fetchStatus() {
        try {
            status = await get2FAStatus(userId);
        } catch {
            status = null;
        }
        render();
    }

    async function handleEnableEmail() {
        // You may want to send a code to the user's email and ask for input here
        try {
            await send2FACode(userId);
            alert('A verification code has been sent to your email. Please check your inbox.');
            // You should show an input for the code and call verifyEmail2FA(userId, code)
        } catch (e) {
            error = "Failed to send email code.";
            render();
        }
    }

    async function handleEnableTOTP() {
        try {
            const info = await setupTOTP(userId);
            // Show QR code and secret to user, then ask for code input and call verifyTOTP(userId, code)
            alert('Scan the QR code in your authenticator app and enter the code to verify.');
            // You should show a QR code and input for the code
        } catch (e) {
            error = "Failed to setup TOTP.";
            render();
        }
    }

    async function handleDisable() {
        const password = prompt("Enter your password to disable 2FA:");
        if (!password) return;
        const res = await disable2FA(userId, password);
        if (res.error) {
            error = res.error;
        } else {
            error = null;
            await fetchStatus();
        }
        render();
    }

    function render() {
        container.innerHTML = '';

        if (!status) {
            container.textContent = "Loading...";
            return;
        }

        if (status.enabled) {
            // 2FA is enabled
            const info = document.createElement('div');
            info.textContent = `2FA is enabled (${status.type === 'totp' ? 'Authenticator App' : 'Email'})`;
            container.appendChild(info);

            const disableBtn = document.createElement('button');
            disableBtn.textContent = "Disable 2FA";
            disableBtn.className = "bg-red-500 text-white px-4 py-2 rounded";
            disableBtn.onclick = handleDisable;
            container.appendChild(disableBtn);
        } else {
            // 2FA is disabled
            const info = document.createElement('div');
            info.textContent = "2FA is currently disabled.";
            container.appendChild(info);

            const enableEmailBtn = document.createElement('button');
            enableEmailBtn.textContent = "Enable 2FA by Email";
            enableEmailBtn.className = "bg-blue-500 text-white px-4 py-2 rounded";
            enableEmailBtn.onclick = handleEnableEmail;
            container.appendChild(enableEmailBtn);

            const enableTotpBtn = document.createElement('button');
            enableTotpBtn.textContent = "Enable 2FA by Authenticator App";
            enableTotpBtn.className = "bg-green-500 text-white px-4 py-2 rounded";
            enableTotpBtn.onclick = handleEnableTOTP;
            container.appendChild(enableTotpBtn);
        }

        if (error) {
            const errDiv = document.createElement('div');
            errDiv.textContent = error;
            errDiv.className = "text-red-500";
            container.appendChild(errDiv);
        }
    }

    fetchStatus();
    return container;
}

// // Helper: import this from the next file or place below
// import { createTwoFactorCodeInput } from './TwoFactorCodeInput.js';