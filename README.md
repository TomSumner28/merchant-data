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

Open `http://localhost:5000` in your browser to start chatting.  The conversation history is stored in your session so you can ask follow‑up questions.

### Deployment

The included `vercel.json` file allows the Flask app to run on Vercel.  Configure the environment variables above in your Vercel project and deploy as normal.  All requests are forwarded to `api/index.py` which exposes the Flask application.
