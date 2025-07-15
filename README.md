# The Reward Collection GPT Dashboard

This Flask app lets your team upload the TRC master Excel workbook and explore key metrics in a TRC‑branded interface. It also includes a simple AI bar for natural‑language questions with a fallback to OpenAI if a query cannot be answered directly.

## Setup

Install Flask with the requirements file:

```bash
pip install -r requirements.txt
```

Set the following environment variables before running:

- `OPENAI_API_KEY` – optional, enables GPT fallback
- `FLASK_SECRET_KEY` – secret used for session cookies

Start the server with:

```bash
python3 app/main.py
```

Open `http://localhost:5000` to upload your workbook. Once uploaded you can view the dashboard and ask questions such as *"How many live merchants does Lucy have?"* or *"What is the average cashback?"*.

## Files

- `app/main.py` – Flask routes and helpers
- `app/simple_xlsx.py` – tiny Excel parser using the Python standard library
- `app/templates/` – Jinja2 templates for the interface
- `static/style.css` – shared styles with light/dark modes
- `vercel.json` – configuration for deploying to Vercel
