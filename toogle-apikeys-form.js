import { LOCAL_STORAGE_KEYS } from './constants.js';

document.addEventListener('DOMContentLoaded', () => {
	// get the api keys from the local storage
	const openaiApiKey = localStorage.getItem(LOCAL_STORAGE_KEYS.OPENAI_API_KEY);
	const braveSearchApiProxyUrl = localStorage.getItem(
		LOCAL_STORAGE_KEYS.BRAVE_SEARCH_API_PROXY_URL,
	);
	const braveApiKey = localStorage.getItem(LOCAL_STORAGE_KEYS.BRAVE_API_KEY);

	if (openaiApiKey && braveSearchApiProxyUrl && braveApiKey) {
		console.log('api keys found in local storage');
		console.log({ openaiApiKey, braveSearchApiProxyUrl, braveApiKey });
		// set the api keys to the form
		const apiKeysForm = document.getElementById('api-keys-form');
		apiKeysForm.querySelector('input[name="openai-api-key"]').value =
			openaiApiKey;
		apiKeysForm.querySelector(
			'input[name="brave-search-api-proxy-url"]',
		).value = braveSearchApiProxyUrl;
		apiKeysForm.querySelector('input[name="brave-api-key"]').value =
			braveApiKey;
	}

	const toggleApiKeysButton = document.getElementById('toggle-api-keys');
	const apiKeysFormContainer = document.getElementById('api-keys');
	toggleApiKeysButton.addEventListener('click', () => {
		console.log('toggleApiKeysButton clicked');
		apiKeysFormContainer.classList.toggle('hidden');
		toggleApiKeysButton.classList.toggle('hidden');
	});

	const closeApiKeysFormButton = document.getElementById('close-api-keys-form');
	closeApiKeysFormButton.addEventListener('click', () => {
		console.log('closeApiKeysFormButton clicked');
		apiKeysFormContainer.classList.add('hidden');
		toggleApiKeysButton.classList.toggle('hidden');
	});

	const apiKeysForm = document.getElementById('api-keys-form');
	apiKeysForm.addEventListener('submit', (event) => {
		event.preventDefault();
		console.log('apiKeysForm submitted');
		const formData = new FormData(apiKeysForm);
		const openaiApiKey = formData.get('openai-api-key');
		const braveSearchApiProxyUrl = formData.get('brave-search-api-proxy-url');
		const braveApiKey = formData.get('brave-api-key');
		console.log({ openaiApiKey, braveSearchApiProxyUrl, braveApiKey });
		// apiKeysFormContainer.classList.add('hidden');
		// save the api keys to the local storage
		localStorage.setItem(LOCAL_STORAGE_KEYS.OPENAI_API_KEY, openaiApiKey);
		localStorage.setItem(
			LOCAL_STORAGE_KEYS.BRAVE_SEARCH_API_PROXY_URL,
			braveSearchApiProxyUrl,
		);
		localStorage.setItem(LOCAL_STORAGE_KEYS.BRAVE_API_KEY, braveApiKey);
		// close the api keys form
		apiKeysFormContainer.classList.add('hidden');
		toggleApiKeysButton.classList.remove('hidden');
	});
});
