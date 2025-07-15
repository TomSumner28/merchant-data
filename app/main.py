from __future__ import annotations

import json
import os
from typing import Dict, List
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from time import sleep

from flask import Flask, render_template, request, session

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change_me")

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------

def _generate_csrf_token() -> str:
    token = session.get("_csrf_token")
    if not token:
        token = os.urandom(16).hex()
        session["_csrf_token"] = token
    return token

app.jinja_env.globals["csrf_token"] = _generate_csrf_token


def _chat_with_gpt(messages: List[Dict[str, str]]) -> str:
    """Send the conversation history to OpenAI and return the response."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "OpenAI API key not configured."

    payload = json.dumps({"model": "gpt-3.5-turbo", "messages": messages}).encode(
        "utf-8"
    )
    req = Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    for _ in range(3):  # pragma: no cover - network calls
        try:
            with urlopen(req) as resp:
                data = json.load(resp)
                return (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                    .strip()
                )
        except HTTPError as e:
            if e.code == 429:
                sleep(1)
                continue
            return f"Request failed: {e}"
        except Exception as e:  # pragma: no cover - network errors
            return f"Request failed: {e}"
    return "Request failed: rate limit exceeded"


# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------

@app.route("/")
def index() -> str:
    # Start conversation with a system prompt if not already present
    if "messages" not in session:
        session["messages"] = [
            {
                "role": "system",
                "content": "You are The Reward Collection GPT, a helpful assistant.",
            }
        ]
    return render_template("chat.html", messages=session["messages"])


@app.route("/ask", methods=["POST"])
def ask() -> Dict[str, str]:
    user_message = request.form.get("message", "")
    messages = session.get("messages", [])
    messages.append({"role": "user", "content": user_message})
    answer = _chat_with_gpt(messages)
    messages.append({"role": "assistant", "content": answer})
    session["messages"] = messages
    return {"answer": answer}


@app.route("/knowledge")
def knowledge() -> str:
    return render_template("knowledge.html")


@app.route("/asset")
def asset() -> str:
    return render_template("asset.html")


@app.route("/tools")
def tools() -> str:
    return render_template("tools.html")


@app.route("/email-dashboard")
def email_dashboard() -> str:
    timeframe = request.args.get("range", "30d")
    sample = [
        {"name": "Alice", "sends": 120, "response_percent": 47, "response_time": "2h"},
        {"name": "Bob", "sends": 95, "response_percent": 51, "response_time": "3h"},
        {"name": "Lucy", "sends": 80, "response_percent": 40, "response_time": "1h"},
    ]
    return render_template("email_dashboard.html", data=sample, timeframe=timeframe)


if __name__ == "__main__":
    app.run(debug=True)
