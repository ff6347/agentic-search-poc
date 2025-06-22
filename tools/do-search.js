import { LOCAL_STORAGE_KEYS } from '../constants.js';

const BRAVE_SEARCH_API_URL = 'https://ff6347-brave-search-proxy.val.run';
// Example curl request

/*
curl -s --compressed "https://api.search.brave.com/res/v1/web/search?q=brave+search" \
  -H "Accept: application/json" \
  -H "Accept-Encoding: gzip" \
  -H "X-Subscription-Token: <YOUR_API_KEY>"

 */
export const doSearch = async (query) => {
	const braveSearchApiProxyUrl = localStorage.getItem(
		LOCAL_STORAGE_KEYS.BRAVE_SEARCH_API_PROXY_URL,
	);
	const braveApiKey = localStorage.getItem(LOCAL_STORAGE_KEYS.BRAVE_API_KEY);

	const params = new URLSearchParams({
		q: query,
	});

	const response = await fetch(
		`${braveSearchApiProxyUrl || BRAVE_SEARCH_API_URL}?${params}`,
		{
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Accept-Encoding': 'gzip',
				'X-Subscription-Token': braveApiKey,
			},
		},
	);
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to fetch search results: ${errorText}`);
	}
	const data = await response.json();
	return data;
};
