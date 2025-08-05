export function createTwoFactorCodeInput(
    onSubmit: (code: string) => void,
    error?: string,
    loading?: boolean
): HTMLElement {
    const form = document.createElement('form');
    form.className = 'flex flex-col items-center gap-2';

    const label = document.createElement('label');
    label.htmlFor = 'twoFactorCode';
    label.textContent = 'Enter 2FA Code';
    form.appendChild(label);

    const input = document.createElement('input');
    input.id = 'twoFactorCode';
    input.type = 'text';
    input.maxLength = 6;
    input.pattern = '[0-9]{6}';
    input.autocomplete = 'one-time-code';
    input.className = 'border rounded px-2 py-1 text-center text-lg tracking-widest';
    input.required = true;
    input.disabled = !!loading;
    form.appendChild(input);

    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'btn btn-primary w-full';
    btn.textContent = loading ? 'Verifying...' : 'Verify';
    btn.disabled = !!loading;
    form.appendChild(btn);

    if (error) {
        const errDiv = document.createElement('div');
        errDiv.className = 'text-red-500 text-sm';
        errDiv.textContent = error;
        form.appendChild(errDiv);
    }

    input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        target.value = target.value.replace(/\D/g, '').slice(0, 6);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value.length === 6) {
            onSubmit(input.value);
        }
    });

    return form;
}