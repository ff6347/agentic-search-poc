export default async function (req: Request): Promise<Response> {
	// Handle CORS preflight requests
	if (req.method === 'OPTIONS') {
		return new Response(null, {
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers':
					'Content-Type, X-Subscription-Token, Accept, Accept-Encoding',
				'Access-Control-Max-Age': '86400',
			},
		});
	}

	try {
		const url = new URL(req.url);
		const query = url.searchParams.get('q');

		if (!query) {
			return new Response(
				JSON.stringify({ error: 'Query parameter "q" is required' }),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				},
			);
		}

		// Get the Brave API key from the request headers
		const braveApiKey = req.headers.get('X-Subscription-Token');

		if (!braveApiKey) {
			return new Response(
				JSON.stringify({ error: 'X-Subscription-Token header is required' }),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				},
			);
		}

		// Build the Brave Search API URL with query parameters
		const braveApiUrl = 'https://api.search.brave.com/res/v1/web/search';
		const braveParams = new URLSearchParams({
			q: query,
		});

		// Forward the request to Brave Search API
		const braveResponse = await fetch(`${braveApiUrl}?${braveParams}`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Accept-Encoding': 'gzip',
				'X-Subscription-Token': braveApiKey,
			},
		});

		if (!braveResponse.ok) {
			const errorText = await braveResponse.text();
			return new Response(
				JSON.stringify({
					error: `Brave API error: ${braveResponse.status} ${braveResponse.statusText}`,
					details: errorText,
				}),
				{
					status: braveResponse.status,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				},
			);
		}

		const data = await braveResponse.json();

		// Return the data with CORS headers
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers':
					'Content-Type, X-Subscription-Token, Accept, Accept-Encoding',
			},
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: 'Internal server error',
				details: error.message,
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			},
		);
	}
}
