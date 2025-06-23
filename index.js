// @ts-check
import { doSearch } from './tools/do-search.js';
import {
	LOCAL_STORAGE_KEYS,
	MAX_HISTORY_LENGTH,
	MAX_LOOPS,
	dots,
} from './lib/constants.js';

// Example curl request with tool calls
// curl "https://api.openai.com/v1/chat/completions" \
//     -H "Content-Type: application/json" \
//     -H "Authorization: Bearer $OPENAI_API_KEY" \
//     -d '{
//         "model": "o4-mini",
//         "tools": [
//             {
//                 "type": "function",
//                 "function": {
//                     "name": "do_search",
//                     "description": "Do a web search using brave search api",
//                     "strict": true,
//                     "parameters": {
//                         "type": "object",
//                         "properties": {
//                             "query": { "type": "string" }
//                         },
//                         "required": ["query"]
//                     }
//                 }
//             }
//         ],
//         "messages": [
//             {
//                 "role": "user",
//                 "content": "Do a web search for the latest news about github user ff6347"
//             }
//         ]
//     }'

let llmOptions = {
	// messages: [{role: user | assistant | system; content: string}]
	// response_format: { type: 'json_object' },

	//max_completion_tokens: 100,
	model: 'o4-mini',
	tools: [
		{
			type: 'function',
			function: {
				name: 'do_search',
				description: 'Do a web search using brave search api',
				strict: true,
				parameters: {
					type: 'object',
					required: ['query'],
					additionalProperties: false,
					properties: {
						query: {
							type: 'string',
						},
					},
				},
			},
		},
	],
	messages: [
		{
			role: 'system',
			content: `
			Your are a helpful assistant. When you don't know the answer, just addmit that you don't know. Don't make up an answer. Use your search tool do_search. MAKE SURE TO ALWAYS USE THE LANGUAGE OF THE USER'S LAST QUESTION even if the result of your search are in a different language. You can use simple HTML tags to format your response.
			`,
		},
		{
			role: 'assistant',
			content: `Hello! I'm an AI assistant that can search the web for you. Here's a quick overview of this demo:
			<ul>
				<li><strong>Bring-Your-Own-Key</strong>: This app uses your own API keys for <a href="https://openai.com/" target="_blank">OpenAI</a> and <a href="https://brave.com/search/api/" target="_blank">Brave Search</a>. Just click the "API Keys" button to get set up.</li>
				<li><strong>Tool-Using Agent</strong>: I can use a search tool to find up-to-date information.</li>
				<li><strong>Agentic Loop</strong>: I can perform multiple searches in a row if needed to find the best answer. You can always hit "Stop" to interrupt me.</li>
			</ul>
What would you like to search for?`,
		},
	],
};

const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

let isAgentRunning = false;
let shouldStopLoop = false;
let abortController;

document.addEventListener('DOMContentLoaded', () => {
	// If the user was already and added a key to the local storage, use it
	const openaiApiKey = localStorage.getItem(LOCAL_STORAGE_KEYS.OPENAI_API_KEY);

	// get the relevant elements from the DOM
	// chat history, input, send, toggle api form
	const chatHistoryElement = document.querySelector('.chat-history');
	const inputElement = document.querySelector(
		'form#chat-form input[name="content"]',
	);
	const formElement = document.querySelector('form#chat-form');
	const sendButton = document.querySelector('form#chat-form button');
	const toggleApiKeysButton = document.getElementById('toggle-api-keys');
	const apiKeysFormContainer = document.getElementById('api-keys');

	// check if the elements exists in the DOM
	// if not, throw an error
	if (!chatHistoryElement || !(chatHistoryElement instanceof HTMLElement)) {
		throw new Error('Could not find element .chat-history');
	}
	if (!formElement || !(formElement instanceof HTMLFormElement)) {
		throw new Error('Form element does not exists');
	}
	if (!inputElement || !(inputElement instanceof HTMLInputElement)) {
		throw new Error('Could not find input element');
	}
	if (!sendButton || !(sendButton instanceof HTMLButtonElement)) {
		throw new Error('Could not find send button');
	}
	if (!toggleApiKeysButton) {
		throw new Error('Could not find toggle api keys button');
	}
	if (!apiKeysFormContainer) {
		throw new Error('Could not find api keys form container');
	}

	// Initial message rendering for existing history (if any)
	llmOptions.messages.forEach((message) =>
		appendMessage(message, chatHistoryElement),
	);

	let loadingIndex = 0; // this is for the loading animation
	const originalButtonText = sendButton.innerHTML;

	// now when the user submits the form, we want to run the agent
	formElement.addEventListener('submit', async (event) => {
		event.preventDefault(); // dont reload the page

		// Close API keys form if it's open on submit
		if (!apiKeysFormContainer.classList.contains('hidden')) {
			apiKeysFormContainer.classList.add('hidden');
			toggleApiKeysButton.classList.remove('hidden');
		}

		// If the agent is running the submit button works as a stop button
		if (isAgentRunning) {
			shouldStopLoop = true;
			if (abortController) {
				abortController.abort();
			}
			sendButton.textContent = 'Stopping...';
			sendButton.disabled = true;
			return;
		} else {
			isAgentRunning = true;
		}

		// get the data from the form
		// it is just the input field for now
		const formData = new FormData(formElement);
		const contentValue = formData.get('content');
		if (!contentValue) {
			// if there is nothing in the input end here
			return;
		}

		// convert the value to a string
		const content = String(contentValue);

		// --- Start Agent Run ---
		isAgentRunning = true;
		shouldStopLoop = false;
		abortController = new AbortController();
		sendButton.textContent = 'Stop';

		const userMessage = { role: 'user', content };
		llmOptions.messages.push(userMessage);
		appendMessage(userMessage, chatHistoryElement);
		inputElement.value = '';

		const loadingEl = document.createElement('div');
		loadingEl.className = 'message assistant';
		chatHistoryElement.appendChild(loadingEl);

		const loadingInterval = setInterval(() => {
			loadingIndex = (loadingIndex + 1) % dots.frames.length;
			loadingEl.innerHTML = dots.frames[loadingIndex];
		}, dots.interval);

		scrollToBottom(chatHistoryElement);

		try {
			// Okay here we go. This is the main loop.
			// The agent will keep running until he found an answer to it.

			let loopCount = 0;
			while (loopCount < MAX_LOOPS && !shouldStopLoop) {
				loopCount++;
				const json = await getOpenAICompletion(
					llmOptions,
					openaiApiKey,
					apiEndpoint,
					abortController.signal,
				);
				console.log(json);

				const { message: assistantMessage, finish_reason } = json.choices[0];

				// Add the assistant's response to history
				llmOptions.messages.push(assistantMessage);

				if (finish_reason === 'stop') {
					// End of conversation
					break;
				} else if (finish_reason === 'tool_calls') {
					const toolResults = await Promise.all(
						assistantMessage.tool_calls.map(async (toolCall) => {
							const toolName = toolCall.function.name;
							if (toolName === 'do_search') {
								const toolArgs = JSON.parse(toolCall.function.arguments);
								const toolResult = await doSearch(toolArgs.query);
								console.log({ toolName, toolResult });
								return {
									role: 'tool',
									content: JSON.stringify(toolResult),
									tool_call_id: toolCall.id,
								};
							}
						}),
					);
					llmOptions.messages.push(...toolResults);
					// Continue loop to send tool results to the model
				} else {
					// Handle other cases or break
					console.warn(`Unexpected finish_reason: ${finish_reason}`);
					break;
				}
			}

			let finalContent = 'Sorry, I could not find an answer.';
			const lastMessage = llmOptions.messages[llmOptions.messages.length - 1];
			if (lastMessage.role === 'assistant' && lastMessage.content) {
				finalContent = lastMessage.content;
			}

			if (shouldStopLoop) {
				finalContent = 'Processing stopped manually.';
			} else if (loopCount >= MAX_LOOPS) {
				finalContent =
					'The agent reached the maximum number of steps. Please try again with a more specific query.';
			}
			clearInterval(loadingInterval);
			loadingEl.replaceWith(
				createMessageElement({ role: 'assistant', content: finalContent }),
			);
		} catch (error) {
			clearInterval(loadingInterval);
			if (error.name === 'AbortError') {
				console.log('Fetch aborted by user.');
				loadingEl.replaceWith(
					createMessageElement({
						role: 'assistant',
						content: 'Processing stopped manually.',
					}),
				);
			} else {
				console.error(error);
				loadingEl.replaceWith(
					createMessageElement({
						role: 'assistant',
						content: `An error occurred: ${error.message}`,
					}),
				);
			}
		} finally {
			// Truncate history here
			const allButSystem = llmOptions.messages.slice(1);

			if (allButSystem.length > MAX_HISTORY_LENGTH) {
				let finalMessages = allButSystem.slice(-MAX_HISTORY_LENGTH);

				// Ensure the history we keep doesn't start with a `tool` message,
				// as it would be orphaned from its `assistant` call.
				const firstValidIndex = finalMessages.findIndex(
					(msg) => msg.role !== 'tool',
				);

				if (firstValidIndex > 0) {
					// If we found a non-tool message, but it wasn't the first one,
					// slice the array to start from that valid message.
					finalMessages = finalMessages.slice(firstValidIndex);
				} else if (firstValidIndex === -1) {
					// If the entire history window is just tool messages, something is very wrong.
					// We'll clear the conversation to prevent an error loop.
					// A user message will be needed to restart.
					console.warn(
						'Truncation resulted in only tool messages. Clearing history to prevent errors.',
					);
					finalMessages = [];
				}

				const systemMessage = llmOptions.messages[0];
				llmOptions.messages = [systemMessage, ...finalMessages];
			}

			isAgentRunning = false;
			sendButton.disabled = false;
			sendButton.textContent = originalButtonText;
			scrollToBottom(chatHistoryElement);
		}
	});
});

async function getOpenAICompletion(messages, apiKey, endpoint, signal) {
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify(messages),
		signal,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`OpenAI API Error: ${errorText}`);
	}

	const json = await response.json();
	if (json.error) {
		throw new Error(`OpenAI API error: ${json.error.message}`);
	}
	return json;
}

function createMessageElement(message) {
	const messageElement = document.createElement('div');
	messageElement.className = `message ${message.role}`;
	if (message.content) {
		messageElement.innerHTML = formatMessageContent(message.content);
	}
	return messageElement;
}

function formatMessageContent(content) {
	// @ts-ignore
	const sanitizedContent = DOMPurify.sanitize(content);
	return sanitizedContent
		.replace(/```(\w+)?\s*([\s\S]+?)```/g, '<pre><code>$2</code></pre>')
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function appendMessage(message, container) {
	if (message.role === 'system' || message.role === 'tool') {
		return;
	}
	const messageElement = createMessageElement(message);
	container.appendChild(messageElement);
}

function scrollToBottom(conainer) {
	conainer.scrollTop = conainer.scrollHeight;
}
