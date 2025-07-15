from flask import (
    Flask,
    request,
    redirect,
    url_for,
    render_template,
    flash,
    session,
    abort,
)
from urllib.request import urlretrieve
from tempfile import NamedTemporaryFile
import json
import os
import sys

# Ensure the module can be imported when running from the repo root
sys.path.insert(0, os.path.dirname(__file__))

from simple_xlsx import read_workbook

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'change_me')

# Store uploaded data keyed by session id
user_data = {}


def _get_session_id() -> str:
    """Return a unique session id and ensure it exists."""
    sid = session.get('sid')
    if not sid:
        sid = os.urandom(16).hex()
        session['sid'] = sid
    return sid

# Public Google Sheets document containing the data
# The sheet ID and API key can be provided via environment variables so
# private sheets can be accessed.  If not set, a demo sheet is used.
SHEET_ID = os.getenv("GOOGLE_SHEETS_ID")
API_KEY = os.getenv("GOOGLE_API_KEY")

if SHEET_ID:
    if API_KEY:
        GOOGLE_SHEET_URL = (
            "https://www.googleapis.com/drive/v3/files/"
            f"{SHEET_ID}/export?mimeType="
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            f"&key={API_KEY}"
        )
    else:
        GOOGLE_SHEET_URL = (
            "https://docs.google.com/spreadsheets/d/"
            f"{SHEET_ID}/export?format=xlsx"
        )
else:
    GOOGLE_SHEET_URL = (
        "https://docs.google.com/spreadsheets/d/"
        "1Np_YQejqfgoW9Se3g6hZnrmmcEu32TrFNF78Z3MxnBA/export?format=xlsx"
    )


def _fetch_sheet() -> dict:
    """Download the Google Sheet and return parsed workbook data."""
    tmp = NamedTemporaryFile(delete=False, suffix=".xlsx")
    tmp_path = tmp.name
    urlretrieve(GOOGLE_SHEET_URL, tmp_path)
    return read_workbook(tmp_path)

@app.route('/')
def index():
    """Load data from Google Sheets and show the dashboard."""
    sid = _get_session_id()
    try:
        user_data[sid] = _fetch_sheet()
        flash("Data loaded from Google Sheets.")
    except Exception as e:
        flash(f"Failed to load Google Sheet: {e}")
        user_data[sid] = {}
    return redirect(url_for("dashboard"))


@app.route('/load')
def load():
    """Fetch the Google Sheet and redirect to dashboard."""
    sid = _get_session_id()
    try:
        user_data[sid] = _fetch_sheet()
        flash('Data loaded from Google Sheets.')
    except Exception as e:
        flash(f'Failed to load Google Sheet: {e}')
        user_data[sid] = {}
    return redirect(url_for('dashboard'))

@app.route('/upload', methods=['POST'])
def upload():
    sid = _get_session_id()
    if session.pop('_csrf_token', None) != request.form.get('csrf_token'):
        abort(400)
    file = request.files.get('file')
    if not file or file.filename == '':
        flash('No file selected')
        return redirect(url_for('index'))
    with NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
        file.save(tmp.name)
        path = tmp.name
    try:
        user_data[sid] = read_workbook(path)
    except Exception as e:
        flash(f'Failed to parse file: {e}')
        user_data[sid] = {}
    return redirect(url_for('dashboard'))


def _compute_stats(rows):
    stats = {
        'total': len(rows),
        'deal_stage_counts': {},
        'region_counts': {},
        'lost_count': 0,
        'avg_cashback_live': 0.0,
        'sales_rep_live_counts': {},
    }
    cashback_total = 0.0
    cashback_count = 0
    for row in rows:
        stage = row.get('deal_stage', 'Unknown')
        region = row.get('region', 'Unknown')
        stats['deal_stage_counts'][stage] = stats['deal_stage_counts'].get(stage, 0) + 1
        stats['region_counts'][region] = stats['region_counts'].get(region, 0) + 1
        if stage.lower() in {'lost', 'churn', 'churned'}:
            stats['lost_count'] += 1
        if stage.lower() == 'live':
            rep = row.get('sales_rep', 'Unknown')
            stats['sales_rep_live_counts'][rep] = stats['sales_rep_live_counts'].get(rep, 0) + 1
            cb = _to_float(row.get('cashback', row.get('cashback_amount')))
            if cb is not None:
                cashback_total += cb
                cashback_count += 1
    stats['lost_rate'] = (stats['lost_count'] / stats['total']) * 100 if stats['total'] else 0
    if cashback_count:
        stats['avg_cashback_live'] = cashback_total / cashback_count
    return stats


@app.route('/dashboard')
def dashboard():
    sid = _get_session_id()
    data = user_data.get(sid, {})
    merchant_data = data.get('merchant list', [])
    offs_data = data.get('offs list', [])
    stats = _compute_stats(merchant_data)
    return render_template(
        'dashboard.html',
        merchant_data=merchant_data,
        offs_data=offs_data,
        stats=stats,
        stats_json=json.dumps(stats),
    )


@app.route('/ask', methods=['POST'])
def ask():
    sid = _get_session_id()
    data = user_data.get(sid, {})
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
        rep = _extract_sales_rep(rows, q)
        count = sum(
            1
            for r in rows
            if r.get('deal_stage', '').lower() == 'live'
            and (not region or r.get('region', '').lower() == region.lower())
            and (not rep or r.get('sales_rep', '').lower() == rep.lower())
        )
        qualifiers = []
        if rep:
            qualifiers.append(rep.title())
        if region:
            qualifiers.append(region)
        qualifier = ' in '.join(qualifiers) if qualifiers else ''
        return f'{count} retailers are live{(" in " + qualifier) if qualifier else ""}.'
    if 'lost' in q and '2024' in q:
        count = sum(1 for r in rows if r.get('deal_stage', '').lower() == 'lost' and '2024' in str(r.get('lost_date', '')))
        return f'{count} retailers lost in 2024.'
    if 'average cashback' in q:
        region = _extract_region(rows, q)
        values = [
            _to_float(r.get('cashback', r.get('cashback_amount')))
            for r in rows
            if r.get('deal_stage', '').lower() == 'live'
            and (not region or r.get('region', '').lower() == region.lower())
        ]
        values = [v for v in values if v is not None]
        if not values:
            return 'No cashback data available.'
        avg = sum(values) / len(values)
        return f'Average cashback{f" in {region}" if region else ""} is {avg:.2f}.'
    return 'Question not recognized.'


def _extract_region(rows, text: str):
    regions = {r.get('region', '') for r in rows if r.get('region')}
    for region in regions:
        if region.lower() in text:
            return region
    return None


def _extract_sales_rep(rows, text: str):
    reps = {r.get('sales_rep', '') for r in rows if r.get('sales_rep')}
    for rep in reps:
        if rep.lower() in text:
            return rep
    return None


def _to_float(value):
    try:
        return float(str(value).replace('%', '').strip())
    except (TypeError, ValueError):
        return None


if __name__ == '__main__':
    app.run(debug=True)
