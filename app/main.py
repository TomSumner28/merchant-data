from __future__ import annotations

import json
import os
import tempfile
from typing import Any, Dict, List
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from time import sleep

from flask import Flask, render_template, request, session, redirect, url_for, flash

from .simple_xlsx import read_xlsx

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
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "OpenAI API key not configured."

    payload = json.dumps({"model": "gpt-3.5-turbo", "messages": messages}).encode("utf-8")
    req = Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
    )
    for _ in range(3):
        try:
            with urlopen(req) as resp:  # pragma: no cover - network
                data = json.load(resp)
                return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        except HTTPError as e:
            if e.code == 429:
                sleep(1)
                continue
            return f"Request failed: {e}"
        except Exception as e:  # pragma: no cover - network
            return f"Request failed: {e}"
    return "Request failed: rate limit exceeded"


# ----------------------------------------------------------------------------
# Data helpers
# ----------------------------------------------------------------------------

def _compute_stats(book: Dict[str, List[Dict[str, str]]]) -> Dict[str, Any]:
    merchants = book.get("merchant list", [])
    offs = book.get("offs list", [])
    stage_counts: Dict[str, int] = {}
    region_counts: Dict[str, int] = {}
    rep_live: Dict[str, int] = {}
    cashback_total = 0.0
    live_count = 0
    for row in merchants:
        stage = row.get("deal_stage", "").title()
        region = row.get("region", "Unknown")
        rep = row.get("sales_rep", "Unknown")
        stage_counts[stage] = stage_counts.get(stage, 0) + 1
        region_counts[region] = region_counts.get(region, 0) + 1
        if stage.lower() == "live":
            rep_live[rep] = rep_live.get(rep, 0) + 1
            try:
                cashback_total += float(row.get("cashback", row.get("cashback_percentage", 0)))
                live_count += 1
            except ValueError:
                pass
    lost = len(offs)
    avg_cashback = cashback_total / live_count if live_count else 0
    return {
        "stage_counts": stage_counts,
        "region_counts": region_counts,
        "rep_live": rep_live,
        "avg_cashback": round(avg_cashback, 2),
        "lost": lost,
    }


def _answer_question(question: str, stats: Dict[str, Any]) -> str:
    q = question.lower()
    if "average cashback" in q:
        return f"Average cashback across live merchants is {stats['avg_cashback']}%."
    if "how many" in q and "live" in q:
        for rep in stats["rep_live"]:
            if rep.lower() in q:
                return f"{rep} has {stats['rep_live'][rep]} live merchants."
        return f"There are {stats['stage_counts'].get('Live', 0)} live merchants."
    return _chat_with_gpt([{"role": "user", "content": question}])


# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------

@app.route("/")
def index() -> str:
    return render_template("index.html", has_data="stats" in session)


@app.route("/upload", methods=["POST"])
def upload() -> str:
    file = request.files.get("file")
    if not file or file.filename == "":
        flash("No file selected")
        return redirect(url_for("index"))
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
        file.save(tmp.name)
        book = read_xlsx(tmp.name)
    session["book"] = book
    session["stats"] = _compute_stats(book)
    return redirect(url_for("dashboard"))


@app.route("/dashboard")
def dashboard() -> str:
    stats = session.get("stats")
    if not stats:
        return redirect(url_for("index"))
    return render_template("dashboard.html", stats=stats)


@app.route("/ask", methods=["POST"])
def ask() -> Dict[str, str]:
    question = request.form.get("message", "")
    stats = session.get("stats", {})
    answer = _answer_question(question, stats)
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
    sample = [
        {"name": "Alice", "sends": 120, "response_percent": 47, "response_time": "2h"},
        {"name": "Bob", "sends": 95, "response_percent": 51, "response_time": "3h"},
        {"name": "Lucy", "sends": 80, "response_percent": 40, "response_time": "1h"},
    ]
    timeframe = request.args.get("range", "30d")
    return render_template("email_dashboard.html", data=sample, timeframe=timeframe)


if __name__ == "__main__":
    app.run(debug=True)
