import { i18n, type Language } from '../services/i18n.js';

export function createLanguageSwitcher(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'language-switcher';
  
  const select = document.createElement('select');
  select.className = 'bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none';
  
  const languages = i18n.getAvailableLanguages();
  const currentLang = i18n.getCurrentLanguage();
  
  languages.forEach(({ code, name }) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = name;
    option.selected = code === currentLang;
    select.appendChild(option);
  });
  
  select.addEventListener('change', async (e) => {
    const target = e.target as HTMLSelectElement;
    const newLanguage = target.value as Language;
    await i18n.setLanguage(newLanguage);
  });
  
  container.appendChild(select);
  return container;
}