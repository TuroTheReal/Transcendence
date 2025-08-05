import { i18n } from "./i18n.js";

export class errorMsg
{
	showErrorBanner(messageKey: string, type: 'error' | 'warning' | 'info' = 'error', params?: Record<string, string>): void {
		const existingError = document.querySelector('.error-banner');
		if (existingError) {
			existingError.remove();
		}

		const colors = {
			error: 'bg-red-900 border-red-500 text-red-100',
			warning: 'bg-yellow-900 border-yellow-500 text-yellow-100',
			info: 'bg-blue-900 border-blue-500 text-blue-100'
		};

		const icons = {
			error: '❌',
			warning: '⚠️',
			info: 'ℹ️'
		};

		const message = messageKey.startsWith('errors.') ?
			i18n.t(messageKey, params) :
			i18n.t(`errors.${messageKey}`, params);

		const errorHTML = `
			<div class="error-banner fixed top-4 left-1/2 transform -translate-x-1/2 z-50
						max-w-md w-full mx-4 ${colors[type]}
						border-l-4 rounded-lg shadow-lg p-4 animate-pulse">
				<div class="flex items-center">
					<span class="text-xl mr-3">${icons[type]}</span>
					<div class="flex-1">
						<p class="text-sm font-medium">${message}</p>
					</div>
					<button class="error-close ml-4 text-gray-300 hover:text-white transition-colors">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
						</svg>
					</button>
				</div>
			</div>
		`;
		document.body.insertAdjacentHTML('afterbegin', errorHTML);

		const closeBtn = document.querySelector('.error-close');
		closeBtn?.addEventListener('click', () => {
			const banner = document.querySelector('.error-banner');
			banner?.remove();
		});

		setTimeout(() => {
			const banner = document.querySelector('.error-banner');
			banner?.remove();
		}, 5000);
	}

	showFieldError(fieldId: string, messageKey: string): void {
		const field = document.querySelector(`#${fieldId}`) as HTMLInputElement;
		if (!field) return;

		const existingError = field.parentElement?.querySelector('.field-error-message');
		if (existingError) {
			existingError.remove();
		}

		field.classList.add('border-red-500', 'bg-red-900', 'bg-opacity-20');

		const message = messageKey.startsWith('errors.') ?
			i18n.t(messageKey) :
			i18n.t(`errors.${messageKey}`);

		const errorHTML = `
			<div class="field-error-message mt-1 text-red-400 text-sm flex items-center animate-pulse">
				<svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
				</svg>
				${message}
			</div>
		`;
		field.insertAdjacentHTML('afterend', errorHTML);

		const clearError = () => {
			field.classList.remove('border-red-500', 'bg-red-900', 'bg-opacity-20');
			const errorMsg = field.parentElement?.querySelector('.field-error-message');
			errorMsg?.remove();
			field.removeEventListener('input', clearError);
		};

		field.addEventListener('input', clearError);
	}

	showSuccessMessage(messageKey: string, params?: Record<string, string>): void {
		const message = messageKey.startsWith('errors.') ?
			i18n.t(messageKey, params) :
			i18n.t(`errors.${messageKey}`, params);

		const successHTML = `
			<div class="success-banner fixed top-4 right-4 z-50
						bg-green-900 border-l-4 border-green-500 text-green-100
						rounded-lg shadow-lg p-4 max-w-sm animate-bounce">
				<div class="flex items-center">
					<span class="text-xl mr-3">✅</span>
					<p class="text-sm font-medium">${message}</p>
				</div>
			</div>
		`;

		document.body.insertAdjacentHTML('afterbegin', successHTML);

		setTimeout(() => {
			const banner = document.querySelector('.success-banner');
			banner?.remove();
		}, 3000);
	}

	clearAllErrors(): void {
		const errorBanner = document.querySelector('.error-banner');
		const successBanner = document.querySelector('.success-banner');
		errorBanner?.remove();
		successBanner?.remove();

		const fieldErrors = document.querySelectorAll('.field-error-message');
		fieldErrors.forEach(error => error.remove());

		const errorFields = document.querySelectorAll('.border-red-500');
		errorFields.forEach(field => {
			field.classList.remove('border-red-500', 'bg-red-900', 'bg-opacity-20');
		});
	}
}

export const errorNotif = new errorMsg();

window.addEventListener('languageChanged', () => {
	errorNotif.clearAllErrors();
});