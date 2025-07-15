from __future__ import annotations

import json
import os
from typing import Dict, List
from urllib.request import Request, urlopen

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
    try:  # pragma: no cover - network calls
        with urlopen(req) as resp:
            data = json.load(resp)
            return (
                data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            )
    except Exception as e:  # pragma: no cover - network errors
        return f"Request failed: {e}"


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


if __name__ == "__main__":
    app.run(debug=True)
