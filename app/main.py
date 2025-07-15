from flask import Flask, request, render_template, session, redirect, url_for
import os
import json
from urllib.request import Request, urlopen

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'change_me')


def _generate_csrf_token() -> str:
    token = session.get('_csrf_token')
    if not token:
        token = os.urandom(16).hex()
        session['_csrf_token'] = token
    return token

app.jinja_env.globals['csrf_token'] = _generate_csrf_token


def _chat_with_gpt(messages):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return "OpenAI API key not configured."
    payload = json.dumps({"model": "gpt-3.5-turbo", "messages": messages}).encode("utf-8")
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
            return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    except Exception as e:
        return f"Request failed: {e}"


@app.route('/', methods=['GET', 'POST'])
def index():
    session.setdefault('messages', [])
    if request.method == 'POST':
        if session.pop('_csrf_token', None) != request.form.get('csrf_token'):
            return redirect(url_for('index'))
        user_msg = request.form.get('message', '').strip()
        if user_msg:
            session['messages'].append({'role': 'user', 'content': user_msg})
            answer = _chat_with_gpt(session['messages'])
            session['messages'].append({'role': 'assistant', 'content': answer})
        return redirect(url_for('index'))
    return render_template('index.html', messages=session['messages'])


@app.route('/reset', methods=['POST'])
def reset():
    session.pop('messages', None)
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True)

