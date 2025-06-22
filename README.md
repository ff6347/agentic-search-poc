# Agentic Search Proof of Concept

This is a web-based chat interface that allows you to interact with an AI agent that can perform web searches.

It's a "Bring-Your-Own-Key" application, meaning you provide your own API keys for OpenAI and the Brave Search API. The interface is built with vanilla HTML, CSS, and JavaScript.

The core functionality is an "agentic loop" where the AI can decide to use the do_search tool to look up information. It's designed to handle multi-step conversations, where it can use tools multiple times before giving a final answer. The UI includes a loading indicator while the agent is working, a "Stop" button to interrupt it manually, and a circuit breaker to prevent infinite loops.

The agent is a simple tool-using agent that can use the do_search tool to look up information. It's designed to handle multi-step conversations, where it can use tools multiple times before giving a final answer.

## How to use

1. Clone the repository
2. Start a local server (we currently use https://marketplace.cursorapi.com/items?itemName=ritwickdey.LiveServer)
3. Open `http://localhost:5500` in your browser
4. Add your [OpenAI API key](https://platform.openai.com/api-keys) and [Brave API key](https://brave.com/search/api/) in the form in the upper right corner
5. If you want to alter/own the search agent proxy got to [val.town and and remix my project](https://www.val.town/x/ff6347/brave-search-proxy).

## Proxy

The folder /proxy contains the code for the proxy that allows you to use the Brave Search API with your own API key.

## Links

- [CLI Spinners](https://github.com/sindresorhus/cli-spinners)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [Live Server](https://marketplace.cursorapi.com/items?itemName=ritwickdey.LiveServer)
- [Val.town](https://www.val.town)
- [Brave Search API](https://brave.com/search/api/)
- [openai](https://openai.com/)
