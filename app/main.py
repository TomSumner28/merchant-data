from __future__ import annotations

import json
import os
import tempfile
from typing import Any, Dict, List
from urllib.request import Request, urlopen

from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from .simple_xlsx import read_workbook

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change_me")


def _generate_csrf_token() -> str:
    token = session.get("_csrf_token")
    if not token:
        token = os.urandom(16).hex()
        session["_csrf_token"] = token
    return token


app.jinja_env.globals["csrf_token"] = _generate_csrf_token


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _chat_with_gpt(messages: List[Dict[str, str]]) -> str:
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
    try:
        with urlopen(req) as resp:
            data = json.loads(resp.read())
            return (
                data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
                .strip()
            )
    except Exception as e:  # pragma: no cover - network errors
        return f"Request failed: {e}"


def _get_sheet(data: Dict[str, List[Dict[str, str]]], name: str) -> List[Dict[str, str]]:
    for key, rows in data.items():
        if key.strip().lower() == name.lower():
            return rows
    return []


def _to_float(text: str) -> float:
    try:
        return float(text)
    except Exception:
        return 0.0


def _compute_stats(data: Dict[str, List[Dict[str, str]]]) -> Dict[str, Any]:
    merchants = _get_sheet(data, "merchant list")
    stats: Dict[str, Any] = {
        "total": len(merchants),
        "deal_stage_counts": {},
        "region_counts": {},
        "sales_rep_counts": {},
        "live_per_region": {},
        "lost_per_region": {},
        "sales_rep_live_counts": {},
        "avg_cashback_per_region": {},
    }

    live_cashback = 0.0
    live_count = 0
    lost_count = 0

    for row in merchants:
        stage = row.get("deal_stage", "").strip()
        region = row.get("region", "").strip()
        rep = row.get("sales_rep", row.get("salesperson", "")).strip()
        cashback = _to_float(row.get("cashback", row.get("cashback_amount", "0")))

        if stage:
            stats["deal_stage_counts"][stage] = stats["deal_stage_counts"].get(stage, 0) + 1
        if region:
            stats["region_counts"][region] = stats["region_counts"].get(region, 0) + 1
        if rep:
            stats["sales_rep_counts"][rep] = stats["sales_rep_counts"].get(rep, 0) + 1

        if stage.lower() == "live":
            live_cashback += cashback
            live_count += 1
            if region:
                stats["live_per_region"][region] = stats["live_per_region"].get(region, 0) + 1
            if rep:
                stats["sales_rep_live_counts"][rep] = stats["sales_rep_live_counts"].get(rep, 0) + 1
        if stage.lower() == "lost":
            lost_count += 1
            if region:
                stats["lost_per_region"][region] = stats["lost_per_region"].get(region, 0) + 1

    stats["lost_rate"] = (lost_count / stats["total"] * 100) if stats["total"] else 0.0
    stats["avg_cashback_live"] = (live_cashback / live_count) if live_count else 0.0

    for region in stats["region_counts"]:
        total_cb = 0.0
        live_reg = 0
        for row in merchants:
            if row.get("region", "").strip() != region:
                continue
            if row.get("deal_stage", "").strip().lower() == "live":
                total_cb += _to_float(row.get("cashback", row.get("cashback_amount", "0")))
                live_reg += 1
        if live_reg:
            stats["avg_cashback_per_region"][region] = total_cb / live_reg
    return stats


def _answer_question(question: str, stats: Dict[str, Any]) -> str:
    q = question.lower()
    # simple patterns for live counts by region or rep
    for region in stats["region_counts"]:
        if region.lower() in q and "live" in q and "how many" in q:
            return str(stats["live_per_region"].get(region, 0))
    for rep in stats["sales_rep_counts"]:
        if rep.lower() in q and "live" in q and "how many" in q:
            return str(stats["sales_rep_live_counts"].get(rep, 0))

    messages = [
        {
            "role": "system",
            "content": "You are a helpful assistant answering questions about merchant statistics.",
        },
        {"role": "user", "content": f"Data summary: {json.dumps(stats)}"},
        {"role": "user", "content": question},
    ]
    return _chat_with_gpt(messages)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index() -> str:
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload() -> str:
    file = request.files.get("file")
    if not file or file.filename == "":
        flash("No file selected")
        return redirect(url_for("index"))

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
    file.save(tmp.name)
    data = read_workbook(tmp.name)
    tmp.close()
    os.unlink(tmp.name)
    session["workbook"] = data
    return redirect(url_for("dashboard"))


@app.route("/dashboard")
def dashboard() -> str:
    data = session.get("workbook")
    if not data:
        flash("Please upload a workbook first.")
        return redirect(url_for("index"))
    stats = _compute_stats(data)
    return render_template(
        "dashboard.html", stats=stats, stats_json=json.dumps(stats)
    )


@app.route("/ask", methods=["POST"])
def ask() -> Dict[str, str]:
    data = session.get("workbook")
    if not data:
        return {"answer": "No data loaded."}
    question = request.form.get("question", "")
    stats = _compute_stats(data)
    answer = _answer_question(question, stats)
    return {"answer": answer}


if __name__ == "__main__":
    app.run(debug=True)
