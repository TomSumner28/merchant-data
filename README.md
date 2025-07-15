# The Reward Collection GPT

This project provides a small Flask application that turns your website into a branded ChatGPT interface. Users can type questions and receive responses from OpenAI's GPT model. Conversation history is stored in the session so each visitor gets a personal chat experience.

## Requirements

Only `flask` from PyPI is required. Install it with:

```bash
pip install -r requirements.txt
```

Set `OPENAI_API_KEY` in your environment and optionally `FLASK_SECRET_KEY` for session security. Then run:

```bash
python3 app/main.py
```

Open `http://localhost:5000` in your browser to start chatting.

### Deployment

The repository includes a `vercel.json` file so the app can be deployed to Vercel. Configure `OPENAI_API_KEY` (and optionally `FLASK_SECRET_KEY`) as environment variables in your Vercel project. All requests will be served by the Flask function defined in `api/index.py`.

