import os
import tempfile
from flask import Flask, request, redirect, url_for, render_template, flash, session
from simple_xlsx import read_workbook

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev_secret')


def _generate_csrf_token() -> str:
    token = session.get('_csrf_token')
    if not token:
        token = os.urandom(16).hex()
        session['_csrf_token'] = token
    return token


app.jinja_env.globals['csrf_token'] = _generate_csrf_token


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files.get('file')
    if not file or file.filename == '':
        flash('No file selected')
        return redirect(url_for('index'))
    with tempfile.NamedTemporaryFile(delete=True, suffix='.xlsx') as tmp:
        file.save(tmp.name)
        try:
            session['dashboard_data'] = read_workbook(tmp.name)
        except Exception as e:
            flash(f'Failed to parse file: {e}')
            session['dashboard_data'] = {}
    return redirect(url_for('dashboard'))


def _compute_stats(rows):
    stats = {
        'total': len(rows),
        'deal_stage_counts': {},
        'region_counts': {},
        'lost_count': 0,
    }
    for row in rows:
        stage = row.get('deal_stage', 'Unknown')
        region = row.get('region', 'Unknown')
        stats['deal_stage_counts'][stage] = stats['deal_stage_counts'].get(stage, 0) + 1
        stats['region_counts'][region] = stats['region_counts'].get(region, 0) + 1
        if stage.lower() in {'lost', 'churn', 'churned'}:
            stats['lost_count'] += 1
    stats['lost_rate'] = (stats['lost_count'] / stats['total']) * 100 if stats['total'] else 0
    return stats


@app.route('/dashboard')
def dashboard():
    data = session.get('dashboard_data', {})
    merchant_data = data.get('merchant list', [])
    offs_data = data.get('offs list', [])
    stats = _compute_stats(merchant_data)
    return render_template(
        'dashboard.html',
        merchant_data=merchant_data,
        offs_data=offs_data,
        stats=stats,
    )


@app.route('/ask', methods=['POST'])
def ask():
    data = session.get('dashboard_data', {})
    merchant_data = data.get('merchant list', [])
    question = request.form.get('question', '')
    answer = _answer_question(merchant_data, question)
    return {'answer': answer}


def _answer_question(rows, question: str) -> str:
    if not rows:
        return 'No data loaded.'
    q = question.lower()
    if 'live' in q:
        region = _extract_region(rows, q)
        count = sum(1 for r in rows if r.get('deal_stage', '').lower() == 'live' and (not region or r.get('region', '').lower() == region.lower()))
        return f'{count} retailers are live{f" in {region}" if region else ""}.'
    if 'lost' in q and '2024' in q:
        count = sum(1 for r in rows if r.get('deal_stage', '').lower() == 'lost' and '2024' in str(r.get('lost_date', '')))
        return f'{count} retailers lost in 2024.'
    return 'Question not recognized.'


def _extract_region(rows, text: str):
    regions = {r.get('region', '') for r in rows if r.get('region')}
    for region in regions:
        if region.lower() in text:
            return region
    return None


if __name__ == '__main__':
    app.run(debug=True)
