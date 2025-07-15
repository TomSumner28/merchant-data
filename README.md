# The Reward Collection GPT

This repository contains a tiny Flask application that wraps the OpenAI ChatGPT API in a TRC branded interface.  It lets your team chat with GPT right from a simple web page.

## Setup

Install Flask using the provided requirements file:

```bash
pip install -r requirements.txt
```

Set the following environment variables before starting the app:

- `OPENAI_API_KEY` – your OpenAI API key
- `FLASK_SECRET_KEY` – secret used for session cookies

Then run:

```bash
python3 app/main.py
```

Open `http://localhost:5000` in your browser to start chatting. A multi‑line textarea lets you draft longer questions and answers appear directly below the form so the conversation stays on a single page. The navigation bar links to additional pages:

- **Forecasting** – external site with forecasting tools
- **Knowledge Base** – placeholder for documentation
- **Asset Creation** – placeholder for creative tools
- **Email Dashboard** – example stats for team email activity
- **External Tools** – shortcuts to finance, admin and sales platforms

Use the toggle button in the header to switch between light and dark modes.

The app will automatically retry if the OpenAI API returns a rate limit error. If you keep seeing "Too Many Requests" make sure your API key has sufficient quota.

### Deployment

The included `vercel.json` file allows the Flask app to run on Vercel.  Configure the environment variables above in your Vercel project and deploy as normal.  All requests are forwarded to `api/index.py` which exposes the Flask application.
